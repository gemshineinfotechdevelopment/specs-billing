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

  async addProduct(product: Omit<Product, 'id'> & { id?: string }): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: product.id || `prd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    const exIdx = this.data.products.findIndex((p) => p.id === newProduct.id);
    if (exIdx >= 0) {
      this.data.products[exIdx] = newProduct;
    } else {
      this.data.products.unshift(newProduct);
    }
    this.saveData(this.data);

    if (this.isMongoConnected) {
      try {
        await ProductModel.findOneAndUpdate(
          { id: newProduct.id },
          { $set: newProduct },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error('❌ MongoDB addProduct error:', err);
      }
    }

    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const index = this.data.products.findIndex((p) => p.id === id);
    if (index === -1) {
      if (this.isMongoConnected) {
        const doc = await ProductModel.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
        if (doc) {
          const p = doc as any;
          delete p._id; delete p.__v;
          this.data.products.unshift(p);
          this.saveData(this.data);
          return p;
        }
      }
      return null;
    }
    this.data.products[index] = { ...this.data.products[index], ...updates };
    this.saveData(this.data);

    if (this.isMongoConnected) {
      try {
        await ProductModel.updateOne({ id }, { $set: updates });
      } catch (err) {
        console.error('❌ MongoDB updateProduct error:', err);
      }
    }

    return this.data.products[index];
  }

  async deleteProduct(id: string): Promise<boolean> {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter((p) => p.id !== id);
    this.saveData(this.data);

    if (this.isMongoConnected) {
      try {
        const res = await ProductModel.deleteOne({ id });
        return (res.deletedCount && res.deletedCount > 0) || initialLen !== this.data.products.length;
      } catch (err) {
        console.error('❌ MongoDB deleteProduct error:', err);
      }
    }
    return initialLen !== this.data.products.length;
  }

  async adjustProductStock(id: string, delta: number): Promise<Product | null> {
    const product = this.getProductById(id);
    if (!product) return null;
    product.stock = Math.max(0, product.stock + delta);
    this.saveData(this.data);

    if (this.isMongoConnected) {
      try {
        await ProductModel.updateOne({ id }, { $set: { stock: product.stock } });
      } catch (err) {
        console.error('❌ MongoDB adjustStock error:', err);
      }
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

  async addCustomer(customer: Omit<Customer, 'id' | 'totalSpent' | 'ordersCount' | 'lastVisit'> & { id?: string; totalSpent?: number; ordersCount?: number; lastVisit?: string }): Promise<Customer> {
    const newCust: Customer = {
      ...customer,
      id: customer.id || `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      lastVisit: customer.lastVisit || new Date().toISOString().slice(0, 10),
      totalSpent: customer.totalSpent || 0,
      ordersCount: customer.ordersCount !== undefined ? customer.ordersCount : 0,
    };
    const exIdx = this.data.customers.findIndex((c) => c.id === newCust.id);
    if (exIdx >= 0) {
      this.data.customers[exIdx] = newCust;
    } else {
      this.data.customers.unshift(newCust);
    }
    this.saveData(this.data);

    if (this.isMongoConnected) {
      try {
        await CustomerModel.findOneAndUpdate(
          { id: newCust.id },
          { $set: newCust },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error('❌ MongoDB addCustomer error:', err);
      }
    }

    return newCust;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    const index = this.data.customers.findIndex((c) => c.id === id);
    if (index === -1) {
      if (this.isMongoConnected) {
        const doc = await CustomerModel.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
        if (doc) {
          const c = doc as any;
          delete c._id; delete c.__v;
          this.data.customers.unshift(c);
          this.saveData(this.data);
          return c;
        }
      }
      return null;
    }
    this.data.customers[index] = { ...this.data.customers[index], ...updates };
    this.saveData(this.data);

    if (this.isMongoConnected) {
      try {
        await CustomerModel.updateOne({ id }, { $set: updates });
      } catch (err) {
        console.error('❌ MongoDB updateCustomer error:', err);
      }
    }

    return this.data.customers[index];
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const initialLen = this.data.customers.length;
    this.data.customers = this.data.customers.filter((c) => c.id !== id);
    this.saveData(this.data);

    if (this.isMongoConnected) {
      try {
        const res = await CustomerModel.deleteOne({ id });
        return (res.deletedCount && res.deletedCount > 0) || initialLen !== this.data.customers.length;
      } catch (err) {
        console.error('❌ MongoDB deleteCustomer error:', err);
      }
    }
    return initialLen !== this.data.customers.length;
  }

  // Invoices
  getInvoices(): SalesInvoice[] {
    return this.data.invoices;
  }

  getInvoiceById(id: string): SalesInvoice | undefined {
    return this.data.invoices.find((i) => i.id === id);
  }

  async addInvoice(
    invoiceData: Omit<SalesInvoice, 'id' | 'invoiceNumber' | 'createdAt'> & { id?: string; invoiceNumber?: string; createdAt?: string },
    newCustomerData?: Omit<Customer, 'id' | 'totalSpent' | 'ordersCount' | 'lastVisit'>
  ): Promise<SalesInvoice> {
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
      id: invoiceData.id || `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      invoiceNumber: invoiceData.invoiceNumber || `${this.data.settings.invoicePrefix}${nextNumber}`,
      createdAt: invoiceData.createdAt || nowStr,
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

    const exInvIdx = this.data.invoices.findIndex((inv) => inv.id === newInvoice.id);
    if (exInvIdx >= 0) {
      this.data.invoices[exInvIdx] = newInvoice;
    } else {
      this.data.invoices.unshift(newInvoice);
    }
    this.saveData(this.data);

    // Persist to MongoDB
    if (this.isMongoConnected) {
      try {
        await InvoiceModel.findOneAndUpdate(
          { id: newInvoice.id },
          { $set: newInvoice },
          { upsert: true, new: true }
        );

        for (const sold of newInvoice.items) {
          await ProductModel.updateOne({ id: sold.productId }, { $inc: { stock: -sold.quantity } });
        }

        if (createdCustomer) {
          await CustomerModel.findOneAndUpdate(
            { id: createdCustomer.id },
            { $set: createdCustomer },
            { upsert: true, new: true }
          );
        } else if (invoiceData.customerId && invoiceData.customerId !== 'walk-in') {
          await CustomerModel.updateOne(
            { id: invoiceData.customerId },
            {
              $set: {
                lastVisit: todayIso,
                ...(invoiceData.prescription ? { prescription: invoiceData.prescription } : {}),
              },
              $inc: { totalSpent: invoiceData.grandTotal, ordersCount: 1 },
            }
          );
        }
      } catch (err) {
        console.error('❌ MongoDB addInvoice error:', err);
      }
    }

    return newInvoice;
  }

  async updateInvoice(id: string, updates: Partial<SalesInvoice>): Promise<SalesInvoice | null> {
    const index = this.data.invoices.findIndex((i) => i.id === id);
    if (index === -1) {
      if (this.isMongoConnected) {
        const doc = await InvoiceModel.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
        if (doc) {
          const inv = doc as any;
          delete inv._id; delete inv.__v;
          this.data.invoices.unshift(inv);
          this.saveData(this.data);
          return inv;
        }
      }
      return null;
    }
    this.data.invoices[index] = { ...this.data.invoices[index], ...updates };
    this.saveData(this.data);

    if (this.isMongoConnected) {
      try {
        await InvoiceModel.updateOne({ id }, { $set: updates });
      } catch (err) {
        console.error('❌ MongoDB updateInvoice error:', err);
      }
    }

    return this.data.invoices[index];
  }

  async updateInvoiceStatus(
    id: string,
    status: SalesInvoice['orderStatus'],
    collectBalance: boolean
  ): Promise<SalesInvoice | null> {
    const invoice = this.getInvoiceById(id);
    if (!invoice) return null;
    invoice.orderStatus = status;
    if (collectBalance) {
      invoice.amountPaid = invoice.grandTotal;
      invoice.balanceDue = 0;
    }
    this.saveData(this.data);

    if (this.isMongoConnected) {
      try {
        await InvoiceModel.updateOne(
          { id },
          {
            $set: {
              orderStatus: status,
              amountPaid: invoice.amountPaid,
              balanceDue: invoice.balanceDue,
            },
          }
        );
      } catch (err) {
        console.error('❌ MongoDB updateInvoiceStatus error:', err);
      }
    }

    return invoice;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const initialLen = this.data.invoices.length;
    this.data.invoices = this.data.invoices.filter((i) => i.id !== id);
    this.saveData(this.data);

    if (this.isMongoConnected) {
      try {
        const res = await InvoiceModel.deleteOne({ id });
        return (res.deletedCount && res.deletedCount > 0) || initialLen !== this.data.invoices.length;
      } catch (err) {
        console.error('❌ MongoDB deleteInvoice error:', err);
      }
    }
    return initialLen !== this.data.invoices.length;
  }

  // Settings
  getSettings(): StoreSettings {
    return this.data.settings;
  }

  async updateSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
    this.data.settings = { ...this.data.settings, ...updates };
    this.saveData(this.data);

    if (this.isMongoConnected) {
      try {
        await SettingsModel.findOneAndUpdate({}, { $set: updates }, { upsert: true, new: true });
      } catch (err) {
        console.error('❌ MongoDB updateSettings error:', err);
      }
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
