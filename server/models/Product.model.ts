import mongoose, { Schema, Document } from 'mongoose';
import { Product } from '../types.js';

export interface IProductDocument extends Document, Omit<Product, 'id'> {
  id: string;
}

const ProductSchema = new Schema<IProductDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    sku: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    brand: { type: String, default: 'Generic' },
    category: {
      type: String,
      required: true,
      enum: ['Sunglasses', 'Cooling Glasses', 'Power Glasses', 'Lenses & Care'],
    },
    frameMaterial: { type: String, default: 'Alloy' },
    frameShape: { type: String, default: 'Standard' },
    lensFeature: { type: String, default: 'Standard UV' },
    price: { type: Number, required: true },
    costPrice: { type: Number, default: 0 },
    gstRate: { type: Number, default: 12 },
    stock: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 5 },
    hsnCode: { type: String, default: '90041000' },
    imageUrl: { type: String, default: '' },
    isUserAdded: { type: Boolean, default: true },
    rightEyePower: { type: Schema.Types.Mixed, default: undefined },
    leftEyePower: { type: Schema.Types.Mixed, default: undefined },
  },
  { timestamps: true, strict: false }
);

export const ProductModel = mongoose.models.Product || mongoose.model<IProductDocument>('Product', ProductSchema);

