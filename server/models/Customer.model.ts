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
    prescription: { type: Schema.Types.Mixed, default: undefined },
  },
  { timestamps: true, strict: false }
);

export const CustomerModel = mongoose.models.Customer || mongoose.model<ICustomerDocument>('Customer', CustomerSchema);

