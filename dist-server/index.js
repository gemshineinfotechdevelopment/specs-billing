// server/index.ts
import express from "express";
import cors from "cors";
import path2 from "path";
import fs2 from "fs";
import dotenv from "dotenv";

// server/routes/products.routes.ts
import { Router } from "express";

// server/data/store.ts
import fs from "fs";
import path from "path";
import mongoose5 from "mongoose";

// server/data/defaultData.ts
var DEFAULT_SETTINGS = {
  storeName: "LuminaOptic Vision Care",
  branchName: "T. Nagar Flagship Showroom",
  gstin: "33AABCL1234F1Z8",
  phone: "+91 44 2815 4400",
  email: "care@luminaoptic.in",
  address: "No. 42, Usman Road, T. Nagar, Chennai, Tamil Nadu 600017",
  invoicePrefix: "LUM-2026-",
  currencySymbol: "\u20B9",
  defaultGstRate: 12,
  defaultLabDays: 3,
  receiptFormat: "A4 Standard Tax Invoice",
  footerTerms: "1. Lens fitting warranties valid for 1 year against coating peel.\n2. No refund after lens surfacing is initiated.\n3. Goods once sold can be adjusted against store credit within 7 days.",
  defaultLowStockThreshold: 5
};
var DEFAULT_PRODUCTS = [];
var DEFAULT_CUSTOMERS = [];
var DEFAULT_INVOICES = [];

// server/models/Product.model.ts
import mongoose, { Schema } from "mongoose";
var ProductSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    sku: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    brand: { type: String, default: "Generic" },
    category: {
      type: String,
      required: true,
      enum: ["Sunglasses", "Cooling Glasses", "Power Glasses", "Lenses & Care"]
    },
    frameMaterial: { type: String, default: "Alloy" },
    frameShape: { type: String, default: "Standard" },
    lensFeature: { type: String, default: "Standard UV" },
    price: { type: Number, required: true },
    costPrice: { type: Number, default: 0 },
    gstRate: { type: Number, default: 12 },
    stock: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 5 },
    hsnCode: { type: String, default: "90041000" },
    imageUrl: { type: String, default: "" },
    isUserAdded: { type: Boolean, default: true },
    rightEyePower: {
      sph: String,
      cyl: String,
      axis: String,
      add: String
    },
    leftEyePower: {
      sph: String,
      cyl: String,
      axis: String,
      add: String
    }
  },
  { timestamps: true }
);
var ProductModel = mongoose.models.Product || mongoose.model("Product", ProductSchema);

// server/models/Customer.model.ts
import mongoose2, { Schema as Schema2 } from "mongoose";
var CustomerSchema = new Schema2(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    age: { type: Number },
    lastVisit: { type: String, default: () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) },
    totalSpent: { type: Number, default: 0 },
    ordersCount: { type: Number, default: 1 },
    prescription: {
      rightEye: { sph: String, cyl: String, axis: String, add: String },
      leftEye: { sph: String, cyl: String, axis: String, add: String },
      pd: String,
      lensType: String,
      notes: String,
      recordedAt: String
    }
  },
  { timestamps: true }
);
var CustomerModel = mongoose2.models.Customer || mongoose2.model("Customer", CustomerSchema);

// server/models/Invoice.model.ts
import mongoose3, { Schema as Schema3 } from "mongoose";
var InvoiceItemSchema = new Schema3(
  {
    productId: { type: String, required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    hsnCode: { type: String, default: "90041000" },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    lensUpgradeLabel: { type: String, default: "Standard Included Lens" },
    lensUpgradePrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    gstRate: { type: Number, default: 12 },
    lineTotal: { type: Number, required: true }
  },
  { _id: false }
);
var InvoiceSchema = new Schema3(
  {
    id: { type: String, required: true, unique: true, index: true },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    createdAt: { type: String, required: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, default: "" },
    items: [InvoiceItemSchema],
    prescription: {
      rightEye: { sph: String, cyl: String, axis: String, add: String },
      leftEye: { sph: String, cyl: String, axis: String, add: String },
      pd: String,
      lensType: String,
      notes: String,
      recordedAt: String
    },
    subtotal: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    paymentMethod: { type: String, default: "UPI / QR" },
    orderStatus: { type: String, default: "Completed" },
    deliveryDate: { type: String },
    staffName: { type: String, default: "Lumina Counter" }
  },
  { timestamps: true }
);
var InvoiceModel = mongoose3.models.Invoice || mongoose3.model("Invoice", InvoiceSchema);

// server/models/Settings.model.ts
import mongoose4, { Schema as Schema4 } from "mongoose";
var SettingsSchema = new Schema4(
  {
    storeName: { type: String, default: "LuminaOptic Vision Care" },
    branchName: { type: String, default: "T. Nagar Flagship Showroom" },
    gstin: { type: String, default: "33AABCL1234F1Z8" },
    phone: { type: String, default: "+91 44 2815 4400" },
    email: { type: String, default: "care@luminaoptic.in" },
    address: { type: String, default: "No. 42, Usman Road, T. Nagar, Chennai, Tamil Nadu 600017" },
    invoicePrefix: { type: String, default: "LUM-2026-" },
    currencySymbol: { type: String, default: "\u20B9" },
    defaultGstRate: { type: Number, default: 12 },
    defaultLabDays: { type: Number, default: 3 },
    receiptFormat: { type: String, default: "A4 Standard Tax Invoice" },
    footerTerms: { type: String, default: "" },
    defaultLowStockThreshold: { type: Number, default: 5 }
  },
  { timestamps: true }
);
var SettingsModel = mongoose4.models.Settings || mongoose4.model("Settings", SettingsSchema);

// server/data/store.ts
var currentDir = path.resolve(import.meta.dirname || ".");
var defaultDbPath = path.join(currentDir, "db.json");
var configuredDbPath = process.env.DATA_FILE_PATH ? path.resolve(process.env.DATA_FILE_PATH) : null;
var DB_FILE = configuredDbPath && fs.existsSync(path.dirname(configuredDbPath)) ? configuredDbPath : defaultDbPath;
var DataStore = class {
  constructor() {
    this.isMongoConnected = false;
    this.data = this.loadData();
  }
  getMongoStatus() {
    const rawUri = process.env.MONGODB_URI;
    const sanitizedUri = rawUri ? rawUri.replace(/:[^:@]+@/, ":***@") : null;
    return {
      connected: this.isMongoConnected,
      uri: sanitizedUri
    };
  }
  async connectMongo(uri) {
    const mongoUri = uri || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.log("\u2139\uFE0F No MONGODB_URI provided. Running in JSON file database mode.");
      return false;
    }
    try {
      await mongoose5.connect(mongoUri, {
        serverSelectionTimeoutMS: 5e3
      });
      this.isMongoConnected = true;
      console.log(`\u{1F343} Connected to MongoDB: ${mongoUri.replace(/:[^:@]+@/, ":***@")}`);
      await this.syncFromMongo();
      return true;
    } catch (err) {
      console.warn(`\u26A0\uFE0F MongoDB connection failed (${mongoUri.replace(/:[^:@]+@/, ":***@")}). Running in local JSON file mode. Error: ${err.message}`);
      this.isMongoConnected = false;
      return false;
    }
  }
  async syncFromMongo() {
    try {
      const [prodCount, custCount, invCount, settingsDoc] = await Promise.all([
        ProductModel.countDocuments(),
        CustomerModel.countDocuments(),
        InvoiceModel.countDocuments(),
        SettingsModel.findOne()
      ]);
      const hasMongoData = prodCount > 0 || custCount > 0 || invCount > 0 || !!settingsDoc;
      if (hasMongoData) {
        console.log(`\u{1F4E6} Loading data from MongoDB (${prodCount} products, ${custCount} customers, ${invCount} invoices)...`);
        const [mongoProds, mongoCusts, mongoInvs] = await Promise.all([
          ProductModel.find({}, { _id: 0, __v: 0 }).lean(),
          CustomerModel.find({}, { _id: 0, __v: 0 }).lean(),
          InvoiceModel.find({}, { _id: 0, __v: 0 }).lean()
        ]);
        this.data.products = mongoProds || [];
        this.data.customers = mongoCusts || [];
        this.data.invoices = mongoInvs || [];
        if (settingsDoc) {
          const sObj = settingsDoc.toObject();
          delete sObj._id;
          delete sObj.__v;
          this.data.settings = sObj;
        }
        this.saveData(this.data);
      } else {
        console.log("\u{1F331} MongoDB is empty. Seeding initial store settings to MongoDB...");
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
      console.error("\u274C Error synchronizing with MongoDB:", err);
    }
  }
  loadData() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        return {
          products: Array.isArray(parsed.products) ? parsed.products : [],
          customers: Array.isArray(parsed.customers) ? parsed.customers : [],
          invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [],
          settings: parsed.settings || DEFAULT_SETTINGS
        };
      }
    } catch (err) {
      console.warn("\u26A0\uFE0F Could not load database file, falling back to default seed data:", err);
    }
    const initial = {
      products: [],
      customers: [],
      invoices: [],
      settings: DEFAULT_SETTINGS
    };
    this.saveData(initial);
    return initial;
  }
  saveData(data) {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("\u274C Failed to persist database to file:", err);
    }
  }
  // Products
  getProducts() {
    return this.data.products;
  }
  getProductById(id) {
    return this.data.products.find((p) => p.id === id);
  }
  addProduct(product) {
    const newProduct = {
      ...product,
      id: `prd-${Date.now()}-${Math.floor(Math.random() * 1e3)}`
    };
    this.data.products.unshift(newProduct);
    this.saveData(this.data);
    if (this.isMongoConnected) {
      ProductModel.create(newProduct).catch(
        (err) => console.error("MongoDB addProduct error:", err)
      );
    }
    return newProduct;
  }
  updateProduct(id, updates) {
    const index = this.data.products.findIndex((p) => p.id === id);
    if (index === -1) return null;
    this.data.products[index] = { ...this.data.products[index], ...updates };
    this.saveData(this.data);
    if (this.isMongoConnected) {
      ProductModel.updateOne({ id }, { $set: updates }).catch(
        (err) => console.error("MongoDB updateProduct error:", err)
      );
    }
    return this.data.products[index];
  }
  deleteProduct(id) {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter((p) => p.id !== id);
    if (this.data.products.length !== initialLen) {
      this.saveData(this.data);
      if (this.isMongoConnected) {
        ProductModel.deleteOne({ id }).catch(
          (err) => console.error("MongoDB deleteProduct error:", err)
        );
      }
      return true;
    }
    return false;
  }
  adjustProductStock(id, delta) {
    const product = this.getProductById(id);
    if (!product) return null;
    product.stock = Math.max(0, product.stock + delta);
    this.saveData(this.data);
    if (this.isMongoConnected) {
      ProductModel.updateOne({ id }, { $set: { stock: product.stock } }).catch(
        (err) => console.error("MongoDB adjustStock error:", err)
      );
    }
    return product;
  }
  // Customers
  getCustomers() {
    return this.data.customers;
  }
  getCustomerById(id) {
    return this.data.customers.find((c) => c.id === id);
  }
  addCustomer(customer) {
    const newCust = {
      ...customer,
      id: customer.id || `cust-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      lastVisit: customer.lastVisit || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      totalSpent: customer.totalSpent || 0,
      ordersCount: customer.ordersCount !== void 0 ? customer.ordersCount : 0
    };
    this.data.customers.unshift(newCust);
    this.saveData(this.data);
    if (this.isMongoConnected) {
      CustomerModel.create(newCust).catch(
        (err) => console.error("MongoDB addCustomer error:", err)
      );
    }
    return newCust;
  }
  updateCustomer(id, updates) {
    const index = this.data.customers.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.data.customers[index] = { ...this.data.customers[index], ...updates };
    this.saveData(this.data);
    if (this.isMongoConnected) {
      CustomerModel.updateOne({ id }, { $set: updates }).catch(
        (err) => console.error("MongoDB updateCustomer error:", err)
      );
    }
    return this.data.customers[index];
  }
  deleteCustomer(id) {
    const initialLen = this.data.customers.length;
    this.data.customers = this.data.customers.filter((c) => c.id !== id);
    if (this.data.customers.length !== initialLen) {
      this.saveData(this.data);
      if (this.isMongoConnected) {
        CustomerModel.deleteOne({ id }).catch(
          (err) => console.error("MongoDB deleteCustomer error:", err)
        );
      }
      return true;
    }
    return false;
  }
  // Invoices
  getInvoices() {
    return this.data.invoices;
  }
  getInvoiceById(id) {
    return this.data.invoices.find((i) => i.id === id);
  }
  addInvoice(invoiceData, newCustomerData) {
    const nextNumber = 1040 + this.data.invoices.length + 1;
    const nowStr = (/* @__PURE__ */ new Date()).toLocaleString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
    const newInvoice = {
      ...invoiceData,
      id: invoiceData.id || `inv-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      invoiceNumber: invoiceData.invoiceNumber || `${this.data.settings.invoicePrefix}${nextNumber}`,
      createdAt: invoiceData.createdAt || nowStr
    };
    newInvoice.items.forEach((sold) => {
      const prod = this.getProductById(sold.productId);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - sold.quantity);
      }
    });
    const todayIso = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    let createdCustomer;
    if (newCustomerData) {
      createdCustomer = {
        ...newCustomerData,
        id: invoiceData.customerId,
        lastVisit: todayIso,
        totalSpent: invoiceData.grandTotal,
        ordersCount: 1
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
    if (this.isMongoConnected) {
      InvoiceModel.create(newInvoice).catch(
        (err) => console.error("MongoDB addInvoice error:", err)
      );
      newInvoice.items.forEach((sold) => {
        ProductModel.updateOne({ id: sold.productId }, { $inc: { stock: -sold.quantity } }).catch(
          (err) => console.error("MongoDB stock deduction error:", err)
        );
      });
      if (createdCustomer) {
        CustomerModel.create(createdCustomer).catch(
          (err) => console.error("MongoDB createCustomer on invoice error:", err)
        );
      } else {
        CustomerModel.updateOne(
          { id: invoiceData.customerId },
          {
            $set: {
              lastVisit: todayIso,
              ...invoiceData.prescription ? { prescription: invoiceData.prescription } : {}
            },
            $inc: { totalSpent: invoiceData.grandTotal, ordersCount: 1 }
          }
        ).catch((err) => console.error("MongoDB updateCustomer on invoice error:", err));
      }
    }
    return newInvoice;
  }
  updateInvoice(id, updates) {
    const index = this.data.invoices.findIndex((i) => i.id === id);
    if (index === -1) return null;
    this.data.invoices[index] = { ...this.data.invoices[index], ...updates };
    this.saveData(this.data);
    if (this.isMongoConnected) {
      InvoiceModel.updateOne({ id }, { $set: updates }).catch(
        (err) => console.error("MongoDB updateInvoice error:", err)
      );
    }
    return this.data.invoices[index];
  }
  updateInvoiceStatus(id, status, collectBalance) {
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
            balanceDue: invoice.balanceDue
          }
        }
      ).catch((err) => console.error("MongoDB updateInvoiceStatus error:", err));
    }
    return invoice;
  }
  deleteInvoice(id) {
    const initialLen = this.data.invoices.length;
    this.data.invoices = this.data.invoices.filter((i) => i.id !== id);
    if (this.data.invoices.length !== initialLen) {
      this.saveData(this.data);
      if (this.isMongoConnected) {
        InvoiceModel.deleteOne({ id }).catch(
          (err) => console.error("MongoDB deleteInvoice error:", err)
        );
      }
      return true;
    }
    return false;
  }
  // Settings
  getSettings() {
    return this.data.settings;
  }
  updateSettings(updates) {
    this.data.settings = { ...this.data.settings, ...updates };
    this.saveData(this.data);
    if (this.isMongoConnected) {
      SettingsModel.findOneAndUpdate({}, { $set: updates }, { upsert: true }).catch(
        (err) => console.error("MongoDB updateSettings error:", err)
      );
    }
    return this.data.settings;
  }
  resetToDefault() {
    this.data = {
      products: [...DEFAULT_PRODUCTS],
      customers: [...DEFAULT_CUSTOMERS],
      invoices: [...DEFAULT_INVOICES],
      settings: { ...DEFAULT_SETTINGS }
    };
    this.saveData(this.data);
    if (this.isMongoConnected) {
      Promise.all([
        ProductModel.deleteMany({}),
        CustomerModel.deleteMany({}),
        InvoiceModel.deleteMany({}),
        SettingsModel.findOneAndUpdate({}, { ...DEFAULT_SETTINGS }, { upsert: true })
      ]).catch((err) => console.error("MongoDB resetToDefault error:", err));
    }
  }
};
var db = new DataStore();

// server/routes/products.routes.ts
var productsRouter = Router();
productsRouter.get("/", (req, res) => {
  try {
    let products = db.getProducts();
    const { category, search, lowStock } = req.query;
    if (category && category !== "All") {
      products = products.filter((p) => p.category === category);
    }
    if (search && typeof search === "string") {
      const q = search.toLowerCase().trim();
      products = products.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.lensFeature.toLowerCase().includes(q)
      );
    }
    if (lowStock === "true") {
      const threshold = db.getSettings().defaultLowStockThreshold || 5;
      products = products.filter((p) => p.stock <= threshold);
    }
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
productsRouter.get("/:id", (req, res) => {
  try {
    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
productsRouter.post("/", (req, res) => {
  try {
    const {
      sku,
      name,
      brand,
      category,
      frameMaterial,
      frameShape,
      lensFeature,
      price,
      costPrice,
      gstRate,
      stock,
      reorderLevel,
      hsnCode,
      imageUrl,
      isUserAdded,
      rightEyePower,
      leftEyePower
    } = req.body;
    if (!sku || !name || price === void 0) {
      return res.status(400).json({ success: false, message: "SKU, name, and price are required" });
    }
    const cleanSku = String(sku).trim().toUpperCase();
    const existing = db.getProducts().find((p) => p.sku.toUpperCase() === cleanSku);
    if (existing) {
      return res.status(409).json({ success: false, message: `SKU '${cleanSku}' already exists.` });
    }
    const created = db.addProduct({
      sku: cleanSku,
      name: String(name).trim(),
      brand: String(brand || "Generic").trim(),
      category: category || "Sunglasses",
      frameMaterial: String(frameMaterial || "Alloy"),
      frameShape: String(frameShape || "Standard"),
      lensFeature: String(lensFeature || "Standard UV"),
      price: Number(price) || 0,
      costPrice: Number(costPrice) || 0,
      gstRate: Number(gstRate) || 12,
      stock: Number(stock) || 0,
      reorderLevel: Number(reorderLevel) || 5,
      hsnCode: String(hsnCode || "90041000"),
      imageUrl: imageUrl || "",
      isUserAdded: Boolean(isUserAdded),
      ...rightEyePower ? { rightEyePower } : {},
      ...leftEyePower ? { leftEyePower } : {}
    });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
productsRouter.put("/:id", (req, res) => {
  try {
    const updated = db.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
productsRouter.delete("/:id", (req, res) => {
  try {
    const deleted = db.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
productsRouter.patch("/:id/stock", (req, res) => {
  try {
    const { delta } = req.body;
    if (delta === void 0 || typeof delta !== "number") {
      return res.status(400).json({ success: false, message: "Numeric delta is required" });
    }
    const updated = db.adjustProductStock(req.params.id, delta);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// server/routes/customers.routes.ts
import { Router as Router2 } from "express";
var customersRouter = Router2();
customersRouter.get("/", (req, res) => {
  try {
    let customers = db.getCustomers();
    const { search } = req.query;
    if (search && typeof search === "string") {
      const q = search.toLowerCase().trim();
      customers = customers.filter(
        (c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      );
    }
    res.json({ success: true, count: customers.length, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
customersRouter.get("/:id", (req, res) => {
  try {
    const customer = db.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
customersRouter.post("/", (req, res) => {
  try {
    const { id, name, phone, email, age, prescription, totalSpent, ordersCount, lastVisit } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Customer name is required" });
    }
    const created = db.addCustomer({
      ...id ? { id } : {},
      name: String(name).trim(),
      phone: String(phone || "").trim(),
      email: String(email || "").trim(),
      age: age ? Number(age) : void 0,
      prescription,
      ...totalSpent !== void 0 ? { totalSpent: Number(totalSpent) } : {},
      ...ordersCount !== void 0 ? { ordersCount: Number(ordersCount) } : {},
      ...lastVisit ? { lastVisit } : {}
    });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
customersRouter.put("/:id", (req, res) => {
  try {
    const updated = db.updateCustomer(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
customersRouter.put("/:id/rx", (req, res) => {
  try {
    const { prescription } = req.body;
    if (!prescription) {
      return res.status(400).json({ success: false, message: "Prescription data is required" });
    }
    const updated = db.updateCustomer(req.params.id, {
      prescription,
      lastVisit: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
customersRouter.delete("/:id", (req, res) => {
  try {
    const deleted = db.deleteCustomer(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    res.json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// server/routes/invoices.routes.ts
import { Router as Router3 } from "express";
var invoicesRouter = Router3();
invoicesRouter.get("/", (req, res) => {
  try {
    let invoices = db.getInvoices();
    const { status, search } = req.query;
    if (status && status !== "All") {
      invoices = invoices.filter((inv) => inv.orderStatus === status);
    }
    if (search && typeof search === "string") {
      const q = search.toLowerCase().trim();
      invoices = invoices.filter(
        (inv) => inv.invoiceNumber.toLowerCase().includes(q) || inv.customerName.toLowerCase().includes(q) || inv.customerPhone.toLowerCase().includes(q) || inv.items.some((i) => i.name.toLowerCase().includes(q))
      );
    }
    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
invoicesRouter.get("/:id", (req, res) => {
  try {
    const invoice = db.getInvoiceById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
invoicesRouter.post("/", (req, res) => {
  try {
    const invoiceData = req.body.invoiceData || (req.body.items ? req.body : null);
    const newCustomerData = req.body.newCustomerData;
    if (!invoiceData || !invoiceData.items || invoiceData.items.length === 0) {
      return res.status(400).json({ success: false, message: "Valid invoice data with items is required" });
    }
    const created = db.addInvoice(invoiceData, newCustomerData);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
invoicesRouter.put("/:id", (req, res) => {
  try {
    const updated = db.updateInvoice(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
invoicesRouter.patch("/:id/status", (req, res) => {
  try {
    const { status, collectBalance } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }
    const updated = db.updateInvoiceStatus(
      req.params.id,
      status,
      Boolean(collectBalance)
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
invoicesRouter.delete("/:id", (req, res) => {
  try {
    const deleted = db.deleteInvoice(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    res.json({ success: true, message: "Invoice deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// server/routes/settings.routes.ts
import { Router as Router4 } from "express";
var settingsRouter = Router4();
settingsRouter.get("/", (req, res) => {
  try {
    const settings = db.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
settingsRouter.put("/", (req, res) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
settingsRouter.post("/reset", (req, res) => {
  try {
    db.resetToDefault();
    res.json({
      success: true,
      message: "Store settings, products, and records reset to default",
      data: {
        settings: db.getSettings(),
        products: db.getProducts(),
        customers: db.getCustomers(),
        invoices: db.getInvoices()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// server/routes/reports.routes.ts
import { Router as Router5 } from "express";
var reportsRouter = Router5();
reportsRouter.get("/summary", (_req, res) => {
  try {
    const invoices = db.getInvoices();
    const products = db.getProducts();
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalCollected = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const pendingBalance = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
    const pendingLabOrders = invoices.filter((inv) => inv.orderStatus !== "Completed").length;
    const threshold = db.getSettings().defaultLowStockThreshold || 5;
    const lowStockCount = products.filter((p) => p.stock <= threshold).length;
    const categories = ["Sunglasses", "Cooling Glasses", "Power Glasses", "Lenses & Care"];
    const categoryMetrics = categories.map((cat) => {
      let unitsSold = 0;
      let netSales = 0;
      invoices.forEach((inv) => {
        inv.items.forEach((item) => {
          if (item.category === cat) {
            unitsSold += item.quantity;
            netSales += item.lineTotal;
          }
        });
      });
      const inventoryValue = products.filter((p) => p.category === cat).reduce((acc, p) => acc + p.price * p.stock, 0);
      return { category: cat, unitsSold, netSales, inventoryValue };
    });
    const paymentMethods = ["UPI / QR", "Card", "Cash", "Split Payment"];
    const paymentBreakdown = paymentMethods.map((method) => {
      const matching = invoices.filter((i) => i.paymentMethod === method);
      return {
        method,
        count: matching.length,
        billed: matching.reduce((acc, i) => acc + i.grandTotal, 0),
        collected: matching.reduce((acc, i) => acc + i.amountPaid, 0)
      };
    });
    const totalTaxable = invoices.reduce(
      (acc, i) => acc + (i.subtotal - i.totalDiscount),
      0
    );
    const totalCgst = invoices.reduce((acc, i) => acc + i.cgstAmount, 0);
    const totalSgst = invoices.reduce((acc, i) => acc + i.sgstAmount, 0);
    res.json({
      success: true,
      data: {
        totalRevenue,
        totalCollected,
        pendingBalance,
        pendingLabOrders,
        lowStockCount,
        categoryMetrics,
        paymentBreakdown,
        tax: {
          totalTaxable,
          totalCgst,
          totalSgst,
          totalGst: totalCgst + totalSgst
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// server/routes/ai.routes.ts
import { Router as Router6 } from "express";
import { GoogleGenAI } from "@google/genai";
var aiRouter = Router6();
aiRouter.post("/assistant", async (req, res) => {
  try {
    const { prompt, customerRx, faceShape, usage } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!prompt && !customerRx && !faceShape) {
      return res.status(400).json({
        success: false,
        message: "Prompt or customer optical parameters are required"
      });
    }
    if (apiKey && apiKey !== "YOUR_GEMINI_API_KEY_HERE" && apiKey !== "MY_GEMINI_API_KEY") {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `You are an expert optometrist and optical dispensing consultant for LuminaOptic POS & Eyewear Store.
Provide concise, accurate dispensing recommendations covering frame shape compatibility, lens material/coatings (e.g. 1.67 High-Index, Crizal Anti-glare, Blue Block 420nm, Photochromic), and eye care tips in a polite retail tone.`;
        const userContent = `Customer query: ${prompt || "Frame and lens recommendation"}
Prescription: ${customerRx ? JSON.stringify(customerRx) : "Not provided"}
Face Shape: ${faceShape || "Unspecified"}
Primary Usage: ${usage || "Daily general wear"}`;
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: userContent,
          config: {
            systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 600
          }
        });
        return res.json({
          success: true,
          source: "gemini",
          recommendation: response.text
        });
      } catch (geminiErr) {
        console.warn("\u26A0\uFE0F Gemini API call failed, using built-in optical engine:", geminiErr.message);
      }
    }
    let advice = "Optical Recommendation:\n";
    if (usage?.toLowerCase().includes("screen") || usage?.toLowerCase().includes("computer")) {
      advice += "\u2022 Lens: Zero-Power or Anti-Glare Blue-Cut 420nm filter lenses to reduce digital visual fatigue and circadian disruption.\n";
      advice += "\u2022 Frame: Lightweight TR90 matte frame with ergonomic silicone bridge pads for long 8+ hour comfort.\n";
    } else if (usage?.toLowerCase().includes("driving")) {
      advice += "\u2022 Lens: HD Polarized tinted lenses or Drivewear photochromic transitions with anti-reflective back-surface coat.\n";
      advice += "\u2022 Frame: Aviator or Navigator double-bridge frame with wide peripheral view.\n";
    } else {
      advice += "\u2022 Lens: Single Vision Anti-Glare with hydrophobic and oleophobic easy-clean coating.\n";
      advice += "\u2022 Frame: Classic Wayfarer or Round P3 handcrafted acetate frame.\n";
    }
    if (faceShape?.toLowerCase().includes("round")) {
      advice += "\u2022 Frame Style: Rectangular or angular geometric frames add definition and visually lengthen rounder facial contours.\n";
    } else if (faceShape?.toLowerCase().includes("square")) {
      advice += "\u2022 Frame Style: Round or oval curved frames balance strong jawlines and angular features.\n";
    }
    if (customerRx) {
      advice += "\u2022 Dispensing Note: Ensure accurate Pupillary Distance (PD) measurement before lens edging.\n";
    }
    return res.json({
      success: true,
      source: "optical-engine-fallback",
      recommendation: advice
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// server/index.ts
var currentDir2 = path2.resolve(import.meta.dirname || ".");
var serverEnvPath = fs2.existsSync(path2.join(currentDir2, ".env")) ? path2.join(currentDir2, ".env") : path2.resolve(process.cwd(), "server", ".env");
if (fs2.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
}
dotenv.config();
var app = express();
var PORT = Number(process.env.PORT) || 5026;
var CLIENT_URL = process.env.CLIENT_URL || "https://specs-billing.gemshine.tech";
db.connectMongo().catch((err) => {
  console.warn("MongoDB connection notice:", err.message);
});
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1") || origin.includes("specs-billing.gemshine.tech") || origin === CLIENT_URL) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use((req, _res, next) => {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});
app.get("/api/health", (_req, res) => {
  const mongoStatus = db.getMongoStatus();
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    service: "LuminaOptic Billing POS Server",
    port: PORT,
    database: {
      type: mongoStatus.connected ? "mongodb" : "json-file",
      mongodbConnected: mongoStatus.connected,
      mongodbUri: mongoStatus.uri,
      products: db.getProducts().length,
      customers: db.getCustomers().length,
      invoices: db.getInvoices().length
    }
  });
});
app.use("/api/products", productsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/ai", aiRouter);
var distPath = path2.resolve(process.cwd(), "dist");
if (fs2.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path2.join(distPath, "index.html"));
  });
}
app.use("/api/*", (_req, res) => {
  res.status(404).json({ success: false, message: "API route not found" });
});
app.use((err, _req, res, _next) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : void 0
  });
});
var server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`
======================================================`);
  console.log(`\u{1F680} LuminaOptic Server running on: http://0.0.0.0:${PORT}`);
  console.log(`\u{1F50C} Health check available at:     http://localhost:${PORT}/api/health`);
  console.log(`\u{1F310} Subdomain configured for:      https://specs-billing.gemshine.tech`);
  console.log(`\u{1F4BB} Connected to client on:        ${CLIENT_URL}`);
  console.log(`======================================================
`);
});
var handleGracefulShutdown = () => {
  console.log("\n\u{1F6D1} Receiving shutdown signal. Closing HTTP server gracefully...");
  server.close(() => {
    console.log("\u2705 LuminaOptic Server closed.");
    process.exit(0);
  });
};
process.on("SIGTERM", handleGracefulShutdown);
process.on("SIGINT", handleGracefulShutdown);
var index_default = app;
export {
  index_default as default
};
