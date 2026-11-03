import { Router, Request, Response } from 'express';
import { db } from '../data/store.js';

export const productsRouter = Router();

// GET /api/products
productsRouter.get('/', (req: Request, res: Response) => {
  try {
    let products = db.getProducts();
    const { category, search, lowStock } = req.query;

    if (category && category !== 'All') {
      products = products.filter((p) => p.category === category);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.lensFeature.toLowerCase().includes(q)
      );
    }

    if (lowStock === 'true') {
      const threshold = db.getSettings().defaultLowStockThreshold || 5;
      products = products.filter((p) => p.stock <= threshold);
    }

    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/products/:id
productsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/products
productsRouter.post('/', (req: Request, res: Response) => {
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
      leftEyePower,
    } = req.body;

    if (!sku || !name || price === undefined) {
      return res
        .status(400)
        .json({ success: false, message: 'SKU, name, and price are required' });
    }

    const cleanSku = String(sku).trim().toUpperCase();
    const existing = db.getProducts().find((p) => p.sku.toUpperCase() === cleanSku);
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: `SKU '${cleanSku}' already exists.` });
    }

    const created = db.addProduct({
      sku: cleanSku,
      name: String(name).trim(),
      brand: String(brand || 'Generic').trim(),
      category: category || 'Sunglasses',
      frameMaterial: String(frameMaterial || 'Alloy'),
      frameShape: String(frameShape || 'Standard'),
      lensFeature: String(lensFeature || 'Standard UV'),
      price: Number(price) || 0,
      costPrice: Number(costPrice) || 0,
      gstRate: Number(gstRate) || 12,
      stock: Number(stock) || 0,
      reorderLevel: Number(reorderLevel) || 5,
      hsnCode: String(hsnCode || '90041000'),
      imageUrl: imageUrl || '',
      isUserAdded: Boolean(isUserAdded),
      ...(rightEyePower ? { rightEyePower } : {}),
      ...(leftEyePower ? { leftEyePower } : {}),
    });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// PUT /api/products/:id
productsRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const updated = db.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// DELETE /api/products/:id
productsRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const deleted = db.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// PATCH /api/products/:id/stock
productsRouter.patch('/:id/stock', (req: Request, res: Response) => {
  try {
    const { delta } = req.body;
    if (delta === undefined || typeof delta !== 'number') {
      return res
        .status(400)
        .json({ success: false, message: 'Numeric delta is required' });
    }
    const updated = db.adjustProductStock(req.params.id, delta);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

