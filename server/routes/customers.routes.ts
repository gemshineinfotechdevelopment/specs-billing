import { Router, Request, Response } from 'express';
import { db } from '../data/store.js';

export const customersRouter = Router();

// GET /api/customers
customersRouter.get('/', (req: Request, res: Response) => {
  try {
    let customers = db.getCustomers();
    const { search } = req.query;

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, count: customers.length, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/customers/:id
customersRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const customer = db.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/customers
customersRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { id, name, phone, email, age, prescription, totalSpent, ordersCount, lastVisit } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }

    const created = await db.addCustomer({
      ...(id ? { id } : {}),
      name: String(name).trim(),
      phone: String(phone || '').trim(),
      email: String(email || '').trim(),
      age: age ? Number(age) : undefined,
      prescription,
      ...(totalSpent !== undefined ? { totalSpent: Number(totalSpent) } : {}),
      ...(ordersCount !== undefined ? { ordersCount: Number(ordersCount) } : {}),
      ...(lastVisit ? { lastVisit } : {}),
    } as any);

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// PUT /api/customers/:id
customersRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await db.updateCustomer(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// PUT /api/customers/:id/rx
customersRouter.put('/:id/rx', async (req: Request, res: Response) => {
  try {
    const { prescription } = req.body;
    if (!prescription) {
      return res.status(400).json({ success: false, message: 'Prescription data is required' });
    }
    const updated = await db.updateCustomer(req.params.id, {
      prescription,
      lastVisit: new Date().toISOString().slice(0, 10),
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});


// DELETE /api/customers/:id
customersRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await db.deleteCustomer(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});
