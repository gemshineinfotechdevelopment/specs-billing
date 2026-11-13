import mongoose, { Schema, Document } from 'mongoose';
import { SalesInvoice } from '../types.js';

export interface IInvoiceDocument extends Document, Omit<SalesInvoice, 'id'> {
  id: string;
}

const InvoiceItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    hsnCode: { type: String, default: '90041000' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    lensUpgradeLabel: { type: String, default: 'Standard Included Lens' },
    lensUpgradePrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    gstRate: { type: Number, default: 12 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoiceDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    createdAt: { type: String, required: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, default: '' },
    items: [InvoiceItemSchema],
    prescription: { type: Schema.Types.Mixed, default: undefined },
    subtotal: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    paymentMethod: { type: String, default: 'UPI / QR' },
    orderStatus: { type: String, default: 'Completed' },
    deliveryDate: { type: String },
    staffName: { type: String, default: 'Lumina Counter' },
  },
  { timestamps: true, strict: false }
);

export const InvoiceModel = mongoose.models.Invoice || mongoose.model<IInvoiceDocument>('Invoice', InvoiceSchema);

