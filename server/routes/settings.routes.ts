import { Router, Request, Response } from 'express';
import { db } from '../data/store.js';

export const settingsRouter = Router();

// GET /api/settings
settingsRouter.get('/', (req: Request, res: Response) => {
  try {
    const settings = db.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// PUT /api/settings
settingsRouter.put('/', async (req: Request, res: Response) => {
  try {
    const updated = await db.updateSettings(req.body);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/settings/reset
settingsRouter.post('/reset', (req: Request, res: Response) => {
  try {
    db.resetToDefault();
    res.json({
      success: true,
      message: 'Store settings, products, and records reset to default',
      data: {
        settings: db.getSettings(),
        products: db.getProducts(),
        customers: db.getCustomers(),
        invoices: db.getInvoices(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

