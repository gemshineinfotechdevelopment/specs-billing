import {
  Product,
  Customer,
  SalesInvoice,
  StoreSettings,
  OpticalPrescription,
  OrderStatus,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Health
  async checkHealth(): Promise<{ status: string; uptime: number; database: any }> {
    return request('/health');
  },

  // Products
  async getProducts(): Promise<{ success: boolean; data: Product[] }> {
    return request('/products');
  },

  async createProduct(product: Omit<Product, 'id'>): Promise<{ success: boolean; data: Product }> {
    return request('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  async updateProduct(product: Product): Promise<{ success: boolean; data: Product }> {
    return request(`/products/${product.id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    return request(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  async adjustStock(id: string, delta: number): Promise<{ success: boolean; data: Product }> {
    return request(`/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ delta }),
    });
  },

  // Customers
  async getCustomers(): Promise<{ success: boolean; data: Customer[] }> {
    return request('/customers');
  },

  async createCustomer(
    customer: Omit<Customer, 'id' | 'totalSpent' | 'ordersCount' | 'lastVisit'>
  ): Promise<{ success: boolean; data: Customer }> {
    return request('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  },

  async updateCustomer(customer: Customer): Promise<{ success: boolean; data: Customer }> {
    return request(`/customers/${customer.id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
  },

  async updateCustomerRx(
    id: string,
    prescription: OpticalPrescription
  ): Promise<{ success: boolean; data: Customer }> {
    return request(`/customers/${id}/rx`, {
      method: 'PUT',
      body: JSON.stringify({ prescription }),
    });
  },

  async deleteCustomer(id: string): Promise<{ success: boolean }> {
    return request(`/customers/${id}`, {
      method: 'DELETE',
    });
  },

  // Invoices
  async getInvoices(): Promise<{ success: boolean; data: SalesInvoice[] }> {
    return request('/invoices');
  },

  async createInvoice(
    invoiceData: Omit<SalesInvoice, 'id' | 'invoiceNumber' | 'createdAt'>,
    newCustomerData?: Omit<Customer, 'id' | 'totalSpent' | 'ordersCount' | 'lastVisit'>
  ): Promise<{ success: boolean; data: SalesInvoice }> {
    return request('/invoices', {
      method: 'POST',
      body: JSON.stringify({ invoiceData, newCustomerData }),
    });
  },

  async updateInvoice(
    id: string,
    updates: Partial<SalesInvoice>
  ): Promise<{ success: boolean; data: SalesInvoice }> {
    return request(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async updateInvoiceStatus(
    id: string,
    status: OrderStatus,
    collectBalance: boolean
  ): Promise<{ success: boolean; data: SalesInvoice }> {
    return request(`/invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, collectBalance }),
    });
  },

  async deleteInvoice(id: string): Promise<{ success: boolean }> {
    return request(`/invoices/${id}`, {
      method: 'DELETE',
    });
  },

  // Settings
  async getSettings(): Promise<{ success: boolean; data: StoreSettings }> {
    return request('/settings');
  },

  async updateSettings(settings: StoreSettings): Promise<{ success: boolean; data: StoreSettings }> {
    return request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  async resetSettings(): Promise<{ success: boolean; data: any }> {
    return request('/settings/reset', {
      method: 'POST',
    });
  },

  // Reports
  async getReportsSummary(): Promise<{ success: boolean; data: any }> {
    return request('/reports/summary');
  },

  // AI Optical Assistant
  async askAiAssistant(payload: {
    prompt?: string;
    customerRx?: OpticalPrescription;
    faceShape?: string;
    usage?: string;
  }): Promise<{ success: boolean; recommendation: string; source: string }> {
    return request('/ai/assistant', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

