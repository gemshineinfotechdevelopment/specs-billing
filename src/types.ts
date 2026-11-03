export type NavSection =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'customers'
  | 'invoices'
  | 'reports'
  | 'settings';

export type EyewearCategory =
  | 'Sunglasses'
  | 'Cooling Glasses'
  | 'Power Glasses'
  | 'Lenses & Care';

export interface EyeRxValues {
  sph: string;
  cyl: string;
  axis: string;
  add: string;
}

export interface OpticalPrescription {
  rightEye: EyeRxValues; // OD
  leftEye: EyeRxValues;  // OS
  pd: string;            // Pupillary Distance (mm)
  lensType: 'Zero-Power Blue Cut' | 'Single Vision Anti-Glare' | 'Bifocal' | 'Progressive High-Index' | 'Photochromic Transition' | 'Standard Tint';
  notes?: string;
  recordedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: EyewearCategory;
  frameMaterial: string;
  frameShape: string;
  lensFeature: string;
  price: number;
  costPrice: number;
  gstRate: number; // e.g., 12 or 18
  stock: number;
  reorderLevel: number;
  hsnCode: string;
  imageUrl?: string;
  isUserAdded?: boolean;
  rightEyePower?: {
    sph?: string;
    cyl?: string;
    axis?: string;
    add?: string;
  };
  leftEyePower?: {
    sph?: string;
    cyl?: string;
    axis?: string;
    add?: string;
  };
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  age?: number;
  lastVisit: string;
  totalSpent: number;
  ordersCount: number;
  prescription?: OpticalPrescription;
}

export interface CartItem {
  product: Product;
  quantity: number;
  lensUpgradePrice: number;
  lensUpgradeLabel: string;
  itemDiscount: number; // flat amount per line
}

export type PaymentMethod = 'UPI / QR' | 'Card' | 'Cash' | 'Split Payment';
export type OrderStatus = 'Completed' | 'Lab Fitting' | 'Ready for Pickup';

export interface InvoiceItem {
  productId: string;
  sku: string;
  name: string;
  category: EyewearCategory;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  lensUpgradeLabel: string;
  lensUpgradePrice: number;
  discount: number;
  gstRate: number;
  lineTotal: number;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: InvoiceItem[];
  prescription?: OpticalPrescription;
  subtotal: number;
  totalDiscount: number;
  cgstAmount: number;
  sgstAmount: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  paymentMethod: PaymentMethod;
  orderStatus: OrderStatus;
  deliveryDate?: string;
  staffName: string;
}

export type AppFontStyle =
  | 'outfit-inter'
  | 'poppins'
  | 'inter'
  | 'dm-sans'
  | 'plus-jakarta';

export interface StoreSettings {
  storeName: string;
  branchName: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
  invoicePrefix: string;
  currencySymbol: string;
  defaultGstRate: number;
  defaultLabDays: number;
  receiptFormat: 'Thermal 80mm' | 'A4 Standard Tax Invoice';
  footerTerms: string;
  defaultLowStockThreshold?: number;
  fontStyle?: AppFontStyle;
}
