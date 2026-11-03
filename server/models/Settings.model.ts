import mongoose, { Schema, Document } from 'mongoose';
import { StoreSettings } from '../types.js';

export interface ISettingsDocument extends Document, StoreSettings {}

const SettingsSchema = new Schema<ISettingsDocument>(
  {
    storeName: { type: String, default: 'LuminaOptic Vision Care' },
    branchName: { type: String, default: 'T. Nagar Flagship Showroom' },
    gstin: { type: String, default: '33AABCL1234F1Z8' },
    phone: { type: String, default: '+91 44 2815 4400' },
    email: { type: String, default: 'care@luminaoptic.in' },
    address: { type: String, default: 'No. 42, Usman Road, T. Nagar, Chennai, Tamil Nadu 600017' },
    invoicePrefix: { type: String, default: 'LUM-2026-' },
    currencySymbol: { type: String, default: '₹' },
    defaultGstRate: { type: Number, default: 12 },
    defaultLabDays: { type: Number, default: 3 },
    receiptFormat: { type: String, default: 'A4 Standard Tax Invoice' },
    footerTerms: { type: String, default: '' },
    defaultLowStockThreshold: { type: Number, default: 5 },
  },
  { timestamps: true }
);

export const SettingsModel = mongoose.models.Settings || mongoose.model<ISettingsDocument>('Settings', SettingsSchema);

