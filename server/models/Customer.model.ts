import mongoose, { Schema, Document } from 'mongoose';
import { Customer } from '../types.js';

export interface ICustomerDocument extends Document, Omit<Customer, 'id'> {
  id: string;
}

const CustomerSchema = new Schema<ICustomerDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    age: { type: Number },
    lastVisit: { type: String, default: () => new Date().toISOString().slice(0, 10) },
    totalSpent: { type: Number, default: 0 },
    ordersCount: { type: Number, default: 1 },
    prescription: {
      rightEye: { sph: String, cyl: String, axis: String, add: String },
      leftEye: { sph: String, cyl: String, axis: String, add: String },
      pd: String,
      lensType: String,
      notes: String,
      recordedAt: String,
    },
  },
  { timestamps: true }
);

export const CustomerModel = mongoose.models.Customer || mongoose.model<ICustomerDocument>('Customer', CustomerSchema);

