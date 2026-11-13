import { Product, Customer, SalesInvoice, StoreSettings } from '../types.js';

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "HHS Optic Vision Care",
  branchName: "T. Nagar Flagship Showroom",
  gstin: "33AABCL1234F1Z8",
  phone: "+91 44 2815 4400",
  email: "care@luminaoptic.in",
  address: "No. 42, Usman Road, T. Nagar, Chennai, Tamil Nadu 600017",
  invoicePrefix: "LUM-2026-",
  currencySymbol: "₹",
  defaultGstRate: 12,
  defaultLabDays: 3,
  receiptFormat: "A4 Standard Tax Invoice",
  footerTerms: "1. Lens fitting warranties valid for 1 year against coating peel.\n2. No refund after lens surfacing is initiated.\n3. Goods once sold can be adjusted against store credit within 7 days.",
  defaultLowStockThreshold: 5,
};

export const DEFAULT_PRODUCTS: Product[] = [];
export const DEFAULT_CUSTOMERS: Customer[] = [];
export const DEFAULT_INVOICES: SalesInvoice[] = [];
