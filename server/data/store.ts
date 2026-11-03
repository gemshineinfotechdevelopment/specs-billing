import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { Product, Customer, SalesInvoice, StoreSettings } from '../types.js';
import {
  DEFAULT_PRODUCTS,
  DEFAULT_CUSTOMERS,
  DEFAULT_INVOICES,
  DEFAULT_SETTINGS,
} from './defaultData.js';
import { ProductModel } from '../models/Product.model.js';
import { CustomerModel } from '../models/Customer.model.js';
import { InvoiceModel } from '../models/Invoice.model.js';
import { SettingsModel } from '../models/Settings.model.js';

export interface DatabaseSchema {
  products: Product[];
  customers: Customer[];
  invoices: SalesInvoice[];
  settings: StoreSettings;
}

const currentDir = path.resolve(import.meta.dirname || '.');
const defaultDbPath = path.join(currentDir, 'db.json');
const configuredDbPath = process.env.DATA_FILE_PATH ? path.resolve(process.env.DATA_FILE_PATH) : null;
const DB_FILE = configuredDbPath && fs.existsSync(path.dirname(configuredDbPath))
  ? configuredDbPath
  : defaultDbPath;

class DataStore {
  private data: DatabaseSchema;
  private isMongoConnected: boolean = false;

  constructor() {
    this.data = this.loadData();
  }

  public getMongoStatus() {
    const rawUri = process.env.MONGODB_URI;
    const sanitizedUri = rawUri ? rawUri.replace(/:[^:@]+@/, ':***@') : null;
    return {
      connected: this.isMongoConnected,
      uri: sanitizedUri,
    };
  }

  public async connectMongo(uri?: string): Promise<boolean> {
    const mongoUri = uri || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.log('ℹ️ No MONGODB_URI provided. Running in JSON file database mode.');
      return false;
    }

    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      this.isMongoConnected = true;
      console.log(`🍃 Connected to MongoDB: ${mongoUri.replace(/:[^:@]+@/, ':***@')}`);

      await this.syncFromMongo();
      return true;
    } catch (err) {
      console.warn(`⚠️ MongoDB connection failed (${mongoUri.replace(/:[^:@]+@/, ':***@')}). Running in local JSON file mode. Error: ${(err as Error).message}`);
      this.isMongoConnected = false;
      return false;
    }
  }

  private async syncFromMongo(): Promise<void> {
    try {
      const [prodCount, custCount, invCount, settingsDoc] = await Promise.all([
        ProductModel.countDocuments(),
        CustomerModel.countDocuments(),
        InvoiceModel.countDocuments(),
        SettingsModel.findOne(),
      ]);

      const hasMongoData = prodCount > 0 || custCount > 0 || invCount > 0 || !!settingsDoc;

      if (hasMongoData) {
        console.log(`📦 Loading data from MongoDB (${prodCount} products, ${custCount} customers, ${invCount} invoices)...`);
        const [mongoProds, mongoCusts, mongoInvs] = await Promise.all([
          ProductModel.find({}, { _id: 0, __v: 0 }).lean(),
          CustomerModel.find({}, { _id: 0, __v: 0 }).lean(),
          InvoiceModel.find({}, { _id: 0, __v: 0 }).lean(),
        ]);

        this.data.products = (mongoProds as any[]) || [];
        this.data.customers = (mongoCusts as any[]) || [];
        this.data.invoices = (mongoInvs as any[]) || [];
        if (settingsDoc) {
          const sObj = settingsDoc.toObject();
          delete (sObj as any)._id;
          delete (sObj as any).__v;
          this.data.settings = sObj as StoreSettings;
        }
        this.saveData(this.data);
      } else {
        console.log('🌱 MongoDB is empty. Seeding initial store settings to MongoDB...');
        await SettingsModel.create(this.data.settings);
        if (this.data.products.length > 0) {
          await ProductModel.insertMany(this.data.products);
        }
        if (this.data.customers.length > 0) {
          await CustomerModel.insertMany(this.data.customers);
        }
        if (this.data.invoices.length > 0) {
          await InvoiceModel.insertMany(this.data.invoices);
        }
      }
    } catch (err) {
      console.error('❌ Error synchronizing with MongoDB:', err);
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          products: Array.isArray(parsed.products) ? parsed.products : [],
          customers: Array.isArray(parsed.customers) ? parsed.customers : [],
          invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [],
          settings: parsed.settings || DEFAULT_SETTINGS,
        };
      }
    } catch (err) {
      console.warn('⚠️ Could not load database file, falling back to default seed data:', err);
    }

    const initial: DatabaseSchema = {
      products: [],
      customers: [],
      invoices: [],
      settings: DEFAULT_SETTINGS,
    };

    this.saveData(initial);
    return initial;
  }

  private saveData(data: DatabaseSchema): void {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('❌ Failed to persist database to file:', err);
    }
  }

  // Products
  getProducts(): Product[] {
    return this.data.products;
  }

  getProductById(id: string): Product | undefined {
    return this.data.products.find((p) => p.id === id);
  }

  addProduct(product: Omit<Product, 'id'>): Product {
    const newProduct: Product = {
      ...product,
      id: `prd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    this.data.products.unshift(newProduct);
    this.saveData(this.data);

    if (this.isMongoConnected) {
      ProductModel.create(newProduct).catch((err) =>
        console.error('MongoDB addProduct error:', err)
      );
    }

    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const index = this.data.products.findIndex((p) => p.id === id);
    if (index === -1) return null;
    this.data.products[index] = { ...this.data.products[index], ...updates };
    this.saveData(this.data);

    if (this.isMongoConnected) {
      ProductModel.updateOne({ id }, { $set: updates }).catch((err) =>
        console.error('MongoDB updateProduct error:', err)
      );
    }

    return this.data.products[index];
  }

  deleteProduct(id: string): boolean {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter((p) => p.id !== id);
    if (this.data.products.length !== initialLen) {
      this.saveData(this.data);

      if (this.isMongoConnected) {
        ProductModel.deleteOne({ id }).catch((err) =>
          console.error('MongoDB deleteProduct error:', err)
        );
      }

      return true;
    }
    return false;
  }

  adjustProductStock(id: string, delta: number): Product | null {
    const product = this.getProductById(id);
    if (!product) return null;
    product.stock = Math.max(0, product.stock + delta);
    this.saveData(this.data);

    if (this.isMongoConnected) {
      ProductModel.updateOne({ id }, { $set: { stock: product.stock } }).catch((err) =>
        console.error('MongoDB adjustStock error:', err)
      );
    }

    return product;
  }

  // Customers
  getCustomers(): Customer[] {
    return this.data.customers;
  }

  getCustomerById(id: string): Customer | undefined {
    return this.data.customers.find((c) => c.id === id);
  }

  addCustomer(customer: Omit<Customer, 'id' | 'totalSpent' | 'ordersCount' | 'lastVisit'>): Customer {
    const newCust: Customer = {
      ...customer,
      id: (customer as any).id || `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      lastVisit: (customer as any).lastVisit || new Date().toISOString().slice(0, 10),
      totalSpent: (customer as any).totalSpent || 0,
      ordersCount: (customer as any).ordersCount !== undefined ? (customer as any).ordersCount : 0,
    };
    this.data.customers.unshift(newCust);
    this.saveData(this.data);

    if (this.isMongoConnected) {
      CustomerModel.create(newCust).catch((err) =>
        console.error('MongoDB addCustomer error:', err)
      );
    }

    return newCust;
  }

  updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
    const index = this.data.customers.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.data.customers[index] = { ...this.data.customers[index], ...updates };
    this.saveData(this.data);

    if (this.isMongoConnected) {
      CustomerModel.updateOne({ id }, { $set: updates }).catch((err) =>
        console.error('MongoDB updateCustomer error:', err)
      );
    }

    return this.data.customers[index];
  }

  deleteCustomer(id: string): boolean {
    const initialLen = this.data.customers.length;
    this.data.customers = this.data.customers.filter((c) => c.id !== id);
    if (this.data.customers.length !== initialLen) {
      this.saveData(this.data);

      if (this.isMongoConnected) {
        CustomerModel.deleteOne({ id }).catch((err) =>
          console.error('MongoDB deleteCustomer error:', err)
        );
      }

      return true;
    }
    return false;
  }

  // Invoices
  getInvoices(): SalesInvoice[] {
    return this.data.invoices;
  }

  getInvoiceById(id: string): SalesInvoice | undefined {
    return this.data.invoices.find((i) => i.id === id);
  }

  addInvoice(
    invoiceData: Omit<SalesInvoice, 'id' | 'invoiceNumber' | 'createdAt'>,
    newCustomerData?: Omit<Customer, 'id' | 'totalSpent' | 'ordersCount' | 'lastVisit'>
  ): SalesInvoice {
    const nextNumber = 1040 + this.data.invoices.length + 1;
    const nowStr = new Date().toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newInvoice: SalesInvoice = {
      ...invoiceData,
      id: (invoiceData as any).id || `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      invoiceNumber: (invoiceData as any).invoiceNumber || `${this.data.settings.invoicePrefix}${nextNumber}`,
      createdAt: (invoiceData as any).createdAt || nowStr,
    };

    // Deduct stock for each item sold
    newInvoice.items.forEach((sold) => {
      const prod = this.getProductById(sold.productId);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - sold.quantity);
      }
    });

    // Update or add customer record
    const todayIso = new Date().toISOString().slice(0, 10);
    let createdCustomer: Customer | undefined;
    if (newCustomerData) {
      createdCustomer = {
        ...newCustomerData,
        id: invoiceData.customerId,
        lastVisit: todayIso,
        totalSpent: invoiceData.grandTotal,
        ordersCount: 1,
      };
      this.data.customers.unshift(createdCustomer);
    } else {
      const existingCust = this.getCustomerById(invoiceData.customerId);
      if (existingCust) {
        existingCust.lastVisit = todayIso;
        existingCust.totalSpent += invoiceData.grandTotal;
        existingCust.ordersCount += 1;
        if (invoiceData.prescription) {
          existingCust.prescription = invoiceData.prescription;
        }
      }
    }

    this.data.invoices.unshift(newInvoice);
    this.saveData(this.data);

    // Persist to MongoDB
    if (this.isMongoConnected) {
      InvoiceModel.create(newInvoice).catch((err) =>
        console.error('MongoDB addInvoice error:', err)
      );

      newInvoice.items.forEach((sold) => {
        ProductModel.updateOne({ id: sold.productId }, { $inc: { stock: -sold.quantity } }).catch((err) =>
          console.error('MongoDB stock deduction error:', err)
        );
      });

      if (createdCustomer) {
        CustomerModel.create(createdCustomer).catch((err) =>
          console.error('MongoDB createCustomer on invoice error:', err)
        );
      } else {
        CustomerModel.updateOne(
          { id: invoiceData.customerId },
          {
            $set: {
              lastVisit: todayIso,
              ...(invoiceData.prescription ? { prescription: invoiceData.prescription } : {}),
            },
            $inc: { totalSpent: invoiceData.grandTotal, ordersCount: 1 },
          }
        ).catch((err) => console.error('MongoDB updateCustomer on invoice error:', err));
      }
    }

    return newInvoice;
  }

  updateInvoice(id: string, updates: Partial<SalesInvoice>): SalesInvoice | null {
    const index = this.data.invoices.findIndex((i) => i.id === id);
    if (index === -1) return null;
    this.data.invoices[index] = { ...this.data.invoices[index], ...updates };
    this.saveData(this.data);

    if (this.isMongoConnected) {
      InvoiceModel.updateOne({ id }, { $set: updates }).catch((err) =>
        console.error('MongoDB updateInvoice error:', err)
      );
    }

    return this.data.invoices[index];
  }

  updateInvoiceStatus(
    id: string,
    status: SalesInvoice['orderStatus'],
    collectBalance: boolean
  ): SalesInvoice | null {
    const invoice = this.getInvoiceById(id);
    if (!invoice) return null;
    invoice.orderStatus = status;
    if (collectBalance) {
      invoice.amountPaid = invoice.grandTotal;
      invoice.balanceDue = 0;
    }
    this.saveData(this.data);

    if (this.isMongoConnected) {
      InvoiceModel.updateOne(
        { id },
        {
          $set: {
            orderStatus: status,
            amountPaid: invoice.amountPaid,
            balanceDue: invoice.balanceDue,
          },
        }
      ).catch((err) => console.error('MongoDB updateInvoiceStatus error:', err));
    }

    return invoice;
  }

  deleteInvoice(id: string): boolean {
    const initialLen = this.data.invoices.length;
    this.data.invoices = this.data.invoices.filter((i) => i.id !== id);
    if (this.data.invoices.length !== initialLen) {
      this.saveData(this.data);

      if (this.isMongoConnected) {
        InvoiceModel.deleteOne({ id }).catch((err) =>
          console.error('MongoDB deleteInvoice error:', err)
        );
      }

      return true;
    }
    return false;
  }

  // Settings
  getSettings(): StoreSettings {
    return this.data.settings;
  }

  updateSettings(updates: Partial<StoreSettings>): StoreSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.saveData(this.data);

    if (this.isMongoConnected) {
      SettingsModel.findOneAndUpdate({}, { $set: updates }, { upsert: true }).catch((err) =>
        console.error('MongoDB updateSettings error:', err)
      );
    }

    return this.data.settings;
  }

  resetToDefault(): void {
    this.data = {
      products: [...DEFAULT_PRODUCTS],
      customers: [...DEFAULT_CUSTOMERS],
      invoices: [...DEFAULT_INVOICES],
      settings: { ...DEFAULT_SETTINGS },
    };
    this.saveData(this.data);

    if (this.isMongoConnected) {
      Promise.all([
        ProductModel.deleteMany({}),
        CustomerModel.deleteMany({}),
        InvoiceModel.deleteMany({}),
        SettingsModel.findOneAndUpdate({}, { ...DEFAULT_SETTINGS }, { upsert: true }),
      ]).catch((err) => console.error('MongoDB resetToDefault error:', err));
    }
  }
}

export const db = new DataStore();
