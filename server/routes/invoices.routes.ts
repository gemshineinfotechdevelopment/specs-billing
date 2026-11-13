import { Router, Request, Response } from 'express';
import { db } from '../data/store.js';

export const invoicesRouter = Router();

// GET /api/invoices
invoicesRouter.get('/', (req: Request, res: Response) => {
  try {
    let invoices = db.getInvoices();
    const { status, search } = req.query;

    if (status && status !== 'All') {
      invoices = invoices.filter((inv) => inv.orderStatus === status);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      invoices = invoices.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          inv.customerPhone.toLowerCase().includes(q) ||
          inv.items.some((i) => i.name.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/invoices/:id
invoicesRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const invoice = db.getInvoiceById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/invoices
invoicesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const invoiceData = req.body.invoiceData || (req.body.items ? req.body : null);
    const newCustomerData = req.body.newCustomerData;

    if (!invoiceData || !invoiceData.items || invoiceData.items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Valid invoice data with items is required' });
    }

    const created = await db.addInvoice(invoiceData, newCustomerData);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// PUT /api/invoices/:id
invoicesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await db.updateInvoice(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// PATCH /api/invoices/:id/status
invoicesRouter.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, collectBalance } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const updated = await db.updateInvoiceStatus(
      req.params.id,
      status,
      Boolean(collectBalance)
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});


// DELETE /api/invoices/:id
invoicesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await db.deleteInvoice(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});
