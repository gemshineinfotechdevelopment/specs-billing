import { Router, Request, Response } from 'express';
import { db } from '../data/store.js';

export const reportsRouter = Router();

// GET /api/reports/summary
reportsRouter.get('/summary', (_req: Request, res: Response) => {
  try {
    const invoices = db.getInvoices();
    const products = db.getProducts();

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalCollected = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const pendingBalance = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
    const pendingLabOrders = invoices.filter((inv) => inv.orderStatus !== 'Completed').length;
    const threshold = db.getSettings().defaultLowStockThreshold || 5;
    const lowStockCount = products.filter((p) => p.stock <= threshold).length;

    // Categories
    const categories = ['Sunglasses', 'Cooling Glasses', 'Power Glasses', 'Lenses & Care'] as const;
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
      const inventoryValue = products
        .filter((p) => p.category === cat)
        .reduce((acc, p) => acc + p.price * p.stock, 0);
      return { category: cat, unitsSold, netSales, inventoryValue };
    });

    // Payment Methods
    const paymentMethods = ['UPI / QR', 'Card', 'Cash', 'Split Payment'] as const;
    const paymentBreakdown = paymentMethods.map((method) => {
      const matching = invoices.filter((i) => i.paymentMethod === method);
      return {
        method,
        count: matching.length,
        billed: matching.reduce((acc, i) => acc + i.grandTotal, 0),
        collected: matching.reduce((acc, i) => acc + i.amountPaid, 0),
      };
    });

    // Tax
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
          totalGst: totalCgst + totalSgst,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

