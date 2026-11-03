import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Glasses,
  Users,
  FileText,
  BarChart3,
  Settings,
  Plus,
  Menu,
  X,
} from 'lucide-react';
import {
  NavSection,
  Product,
  Customer,
  SalesInvoice,
  StoreSettings,
  EyewearCategory,
  OrderStatus,
  OpticalPrescription,
} from './types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_INVOICES,
  INITIAL_SETTINGS,
} from './data/initialData';
import { DashboardView } from './components/DashboardView';
import { BillingPosView } from './components/BillingPosView';
import { ProductsView } from './components/ProductsView';
import { CustomersView } from './components/CustomersView';
import { InvoicesView } from './components/InvoicesView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { InvoiceModal } from './components/InvoiceModal';
import { api } from './services/api';

const STORAGE_KEYS = {
  products: 'luminaoptic_products_v2',
  customers: 'luminaoptic_customers_v2',
  invoices: 'luminaoptic_invoices_v2',
  settings: 'luminaoptic_settings_v1',
};

// Purge any legacy cached dummy data once
try {
  localStorage.removeItem('luminaoptic_products_v1');
  localStorage.removeItem('luminaoptic_customers_v1');
  localStorage.removeItem('luminaoptic_invoices_v1');
} catch {}

export default function App() {
  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [posCategoryFilter, setPosCategoryFilter] = useState<EyewearCategory | 'All'>('All');
  const [posCustomerId, setPosCustomerId] = useState<string | null>(null);
  const [productsInitialFilter, setProductsInitialFilter] = useState<'all' | 'low'>('all');
  const [activeInvoiceModal, setActiveInvoiceModal] = useState<SalesInvoice | null>(null);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // State dynamically synced with backend database (db.json)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.products);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.customers);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  const [invoices, setInvoices] = useState<SalesInvoice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.invoices);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.settings);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // Keep localStorage synced
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
    } catch {
      // Ignore quota
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(customers));
    } catch {
      // Ignore
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(invoices));
    } catch {
      // Ignore
    }
  }, [invoices]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }, [settings]);

  // Sync with Server if online
  const syncWithServer = async () => {
    try {
      const health = await api.checkHealth();
      if (health.status === 'ok') {
        setServerOnline(true);
        const [prodsRes, custsRes, invsRes, settsRes] = await Promise.all([
          api.getProducts().catch(() => null),
          api.getCustomers().catch(() => null),
          api.getInvoices().catch(() => null),
          api.getSettings().catch(() => null),
        ]);
        if (prodsRes?.data) setProducts(prodsRes.data);
        if (custsRes?.data) setCustomers(custsRes.data);
        if (invsRes?.data) setInvoices(invsRes.data);
        if (settsRes?.data) setSettings(settsRes.data);
      }
    } catch {
      setServerOnline(false);
    }
  };

  useEffect(() => {
    syncWithServer();
  }, []);

  useEffect(() => {
    document.title = `${settings.storeName} - Optical POS`;
  }, [settings.storeName]);

  // Low stock calculation driven strictly by Settings threshold for all products
  const lowStockThreshold = settings.defaultLowStockThreshold || 5;
  const isLowStockProduct = (p: Product) => p.stock <= lowStockThreshold;
  const lowStockCount = products.filter(isLowStockProduct).length;

  // Navigation handler
  const handleNavigate = (
    section: NavSection,
    preselectCategory?: EyewearCategory,
    filter?: string
  ) => {
    if (preselectCategory) {
      setPosCategoryFilter(preselectCategory);
    } else if (section === 'pos') {
      setPosCategoryFilter('All');
    }

    if (section === 'products' && filter === 'low') {
      setProductsInitialFilter('low');
    } else if (section === 'products') {
      setProductsInitialFilter('all');
    }

    setActiveNav(section);
    setIsMobileMenuOpen(false);
  };

  const handleBillCustomerInPos = (customerId: string) => {
    setPosCustomerId(customerId);
    setPosCategoryFilter('All');
    setActiveNav('pos');
    setIsMobileMenuOpen(false);
  };

  // Complete POS Sale -> Decrement Stock, Save or Update Invoice, Update Customer Spend
  const handleCompleteSale = (
    invoiceData: Omit<SalesInvoice, 'id' | 'invoiceNumber' | 'createdAt'>,
    newCustomerData?: Omit<Customer, 'id' | 'totalSpent' | 'ordersCount' | 'lastVisit'>
  ) => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const nowStr = new Date().toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Check if this customer already has an active 'Lab Fitting' invoice
    const existingLabInv = !newCustomerData && invoiceData.customerId
      ? invoices.find(
          (inv) => inv.customerId === invoiceData.customerId && inv.orderStatus === 'Lab Fitting'
        )
      : undefined;

    let finalInvoice: SalesInvoice;

    if (existingLabInv) {
      // Transition the existing Lab Fitting invoice to Completed with final POS bill data
      finalInvoice = {
        ...existingLabInv,
        ...invoiceData,
        id: existingLabInv.id,
        invoiceNumber: existingLabInv.invoiceNumber,
        createdAt: existingLabInv.createdAt,
        orderStatus: 'Completed',
        amountPaid: invoiceData.amountPaid ?? invoiceData.grandTotal,
        balanceDue: invoiceData.balanceDue !== undefined ? invoiceData.balanceDue : Math.max(0, invoiceData.grandTotal - (invoiceData.amountPaid ?? invoiceData.grandTotal)),
        paymentMethod: invoiceData.paymentMethod || existingLabInv.paymentMethod,
        items: invoiceData.items,
        subtotal: invoiceData.subtotal,
        totalDiscount: invoiceData.totalDiscount,
        cgstAmount: invoiceData.cgstAmount,
        sgstAmount: invoiceData.sgstAmount,
        grandTotal: invoiceData.grandTotal,
        prescription: invoiceData.prescription || existingLabInv.prescription,
      };

      // 1. Update invoice in local state
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === existingLabInv.id ? finalInvoice : inv))
      );

      // 2. Persist update and status change to server
      api.updateInvoice(existingLabInv.id, finalInvoice).catch(console.warn);
      api.updateInvoiceStatus(existingLabInv.id, 'Completed', true).catch(console.warn);
    } else {
      const nextNumber = 1040 + invoices.length + 1;
      finalInvoice = {
        ...invoiceData,
        id: `inv-${Date.now()}`,
        invoiceNumber: `${settings.invoicePrefix}${nextNumber}`,
        createdAt: nowStr,
        orderStatus: 'Completed',
        amountPaid: invoiceData.amountPaid ?? invoiceData.grandTotal,
        balanceDue: 0,
      };

      // 1. Prepend new invoice
      setInvoices((prev) => [finalInvoice, ...prev]);

      // 2. Persist to server
      api.createInvoice(invoiceData, newCustomerData).catch(console.warn);
    }

    // 3. Deduct sold quantities from product stock
    setProducts((prev) =>
      prev.map((prod) => {
        const soldItem = invoiceData.items.find((i) => i.productId === prod.id);
        if (!soldItem) return prod;
        return {
          ...prod,
          stock: Math.max(0, prod.stock - soldItem.quantity),
        };
      })
    );

    // 4. Update or create customer profile
    if (newCustomerData) {
      const createdCustomer: Customer = {
        ...newCustomerData,
        id: invoiceData.customerId,
        lastVisit: todayIso,
        totalSpent: invoiceData.grandTotal,
        ordersCount: 1,
      };
      setCustomers((prev) => [createdCustomer, ...prev]);
    } else {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === invoiceData.customerId
            ? {
                ...c,
                lastVisit: todayIso,
                totalSpent: c.totalSpent + invoiceData.grandTotal,
                ordersCount: existingLabInv ? c.ordersCount : c.ordersCount + 1,
                prescription: invoiceData.prescription || c.prescription,
              }
            : c
        )
      );
    }

    // 5. Open Printable Tax Invoice Modal immediately with the active format
    setActiveInvoiceModal(finalInvoice);
  };

  const handleUpdateInvoiceStatus = (
    invoiceId: string,
    status: OrderStatus,
    collectBalance: boolean
  ) => {
    api.updateInvoiceStatus(invoiceId, status, collectBalance).catch(console.warn);

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        const updated: SalesInvoice = {
          ...inv,
          orderStatus: status,
          amountPaid: collectBalance ? inv.grandTotal : inv.amountPaid,
          balanceDue: collectBalance ? 0 : inv.balanceDue,
        };
        if (activeInvoiceModal?.id === invoiceId) {
          setActiveInvoiceModal(updated);
        }
        return updated;
      })
    );
  };

  // Product Inventory Handlers
  const handleAddProduct = (newProd: Omit<Product, 'id'>) => {
    const productWithFlag: Product = {
      ...newProd,
      id: `prd-${Date.now()}`,
      isUserAdded: true,
    };
    api.createProduct(productWithFlag).catch(console.warn);
    setProducts((prev) => [productWithFlag, ...prev]);
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    const productWithFlag: Product = { ...updatedProd, isUserAdded: true };
    api.updateProduct(productWithFlag).catch(console.warn);
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProd.id ? productWithFlag : p))
    );
  };

  const handleDeleteProduct = (productId: string) => {
    api.deleteProduct(productId).catch(console.warn);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleAdjustStock = async (productId: string, delta: number) => {
    // 1. Optimistic update so UI reflects immediately
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p
      )
    );

    // 2. Persist to backend database (db.json)
    try {
      const res = await api.adjustStock(productId, delta);
      if (res?.data) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stock: res.data.stock } : p))
        );
      }
    } catch (err) {
      console.warn('Failed to adjust stock on backend:', err);
    }
  };

  // Customer Handlers
  const handleAddCustomer = (
    newCust: Omit<Customer, 'id' | 'totalSpent' | 'ordersCount' | 'lastVisit'>,
    customAmount?: number,
    customDate?: string,
    customAdvance?: number,
    customOrderCount?: number
  ) => {
    const custId = `cust-${Date.now()}`;
    const todayIso = customDate || new Date().toISOString().slice(0, 10);
    const nowStr = new Date().toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const enteredAmount = customAmount !== undefined ? customAmount : 0;
    const enteredAdvance = customAdvance !== undefined ? customAdvance : enteredAmount;
    const balanceDue = Math.max(0, enteredAmount - enteredAdvance);
    const orderQty = customOrderCount && customOrderCount > 0 ? customOrderCount : 1;

    // 1. Create and store Customer with entered amount, order count and date
    const cust: Customer = {
      ...newCust,
      id: custId,
      lastVisit: todayIso,
      totalSpent: enteredAmount,
      ordersCount: orderQty,
    };
    setCustomers((prev) => [cust, ...prev]);
    api.createCustomer(cust).catch(console.warn);

    // 2. Automatically create Sales Invoice with 'Lab Fitting' order status and save to backend database
    if (newCust.prescription || enteredAmount > 0) {
      const rxLensName = newCust.prescription?.lensType || 'Single Vision Anti-Glare';
      const nextInvNum = `${settings.invoicePrefix}${1040 + invoices.length + 1}`;
      const gstRate = settings.defaultGstRate || 12;
      const subtotal = Math.round(enteredAmount / (1 + gstRate / 100));
      const totalTax = enteredAmount - subtotal;
      const cgst = Math.round(totalTax / 2);
      const sgst = totalTax - cgst;

      const labInvoice: SalesInvoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber: nextInvNum,
        createdAt: nowStr,
        customerId: custId,
        customerName: cust.name,
        customerPhone: cust.phone,
        items: [
          {
            productId: 'rx-lab-lens',
            sku: 'RX-LAB',
            name: `Rx Lab Order - ${rxLensName} Fitting`,
            category: 'Power Glasses',
            hsnCode: '90031100',
            quantity: orderQty,
            unitPrice: Math.round(subtotal / orderQty),
            lensUpgradeLabel: rxLensName,
            lensUpgradePrice: 0,
            discount: 0,
            gstRate: gstRate,
            lineTotal: subtotal,
          },
        ],
        subtotal: subtotal,
        totalDiscount: 0,
        cgstAmount: cgst,
        sgstAmount: sgst,
        grandTotal: enteredAmount,
        amountPaid: enteredAdvance,
        balanceDue: balanceDue,
        paymentMethod: 'UPI / QR',
        orderStatus: 'Lab Fitting',
        prescription: newCust.prescription,
        staffName: 'Optometrist / Lab',
      };

      setInvoices((prev) => [labInvoice, ...prev]);

      api.createInvoice({
        id: labInvoice.id,
        invoiceNumber: labInvoice.invoiceNumber,
        customerId: custId,
        customerName: cust.name,
        customerPhone: cust.phone,
        items: labInvoice.items,
        subtotal: labInvoice.subtotal,
        totalDiscount: labInvoice.totalDiscount,
        cgstAmount: labInvoice.cgstAmount,
        sgstAmount: labInvoice.sgstAmount,
        grandTotal: labInvoice.grandTotal,
        amountPaid: labInvoice.amountPaid,
        balanceDue: labInvoice.balanceDue,
        paymentMethod: labInvoice.paymentMethod,
        orderStatus: 'Lab Fitting',
        prescription: labInvoice.prescription,
        staffName: labInvoice.staffName,
      } as any).catch(console.warn);
    }
  };

  const handleUpdateCustomer = (updatedCust: Customer) => {
    api.updateCustomer(updatedCust).catch(console.warn);
    setCustomers((prev) =>
      prev.map((c) => (c.id === updatedCust.id ? updatedCust : c))
    );
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    api.deleteCustomer(customerId).catch(console.warn);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
    api.deleteInvoice(invoiceId).catch(console.warn);
  };

  const handleUpdateCustomerRx = (customerId: string, rx: OpticalPrescription) => {
    api.updateCustomerRx(customerId, rx).catch(console.warn);
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              lastVisit: new Date().toISOString().slice(0, 10),
              prescription: rx,
            }
          : c
      )
    );
  };

  const handleResetDemoData = () => {
    api.resetSettings().catch(console.warn);
    setProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    setInvoices(INITIAL_INVOICES);
    setSettings(INITIAL_SETTINGS);
  };

  const handleSaveSettings = (newSettings: StoreSettings) => {
    api.updateSettings(newSettings).catch(console.warn);
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(newSettings));
    } catch {}
  };

  const navItems: {
    id: NavSection;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Billing POS', icon: ShoppingCart },
    { id: 'products', label: 'Products', icon: Glasses, badge: lowStockCount },
    { id: 'customers', label: 'Customers & Rx', icon: Users },
    { id: 'invoices', label: 'Sales Invoices', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const activeNavLabel =
    navItems.find((item) => item.id === activeNav)?.label || 'Dashboard';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900">
      {/* Desktop Sidebar (256px) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-slate-900 text-white border-r border-slate-800 select-none z-30">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Glasses className="w-5 h-5" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-white truncate max-w-[170px]" title={settings.storeName}>
              {settings.storeName}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-full ${
                      isActive
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-400 space-y-1">
          <div className="font-medium text-slate-200 truncate">{settings.storeName}</div>
          <div className="font-mono text-[11px] truncate">GSTIN: {settings.gstin}</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Strict 3-Zone Top Bar Contract */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-3 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-6">
          {/* Zone 1: Single-line Brand / Breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-1 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="text-sm font-bold text-slate-900 truncate">
              <span className="text-slate-400 font-normal hidden sm:inline">{settings.storeName} / </span>
              {activeNavLabel}
            </div>
          </div>

          {/* Zone 2: Quick Category Links */}
          <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => handleNavigate('pos', 'Sunglasses')}
              className="hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Sunglasses
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('pos', 'Cooling Glasses')}
              className="hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Cooling Glasses
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('pos', 'Power Glasses')}
              className="hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Power Glasses
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('invoices')}
              className="hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Sales Invoices
            </button>
          </nav>

          {/* Zone 3: Actions & Server Status */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Primary POS Action Button */}
            <button
              type="button"
              onClick={() => handleNavigate('pos')}
              className="flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New POS Bill</span>
              <span className="sm:hidden">Bill</span>
            </button>
          </div>
        </header>

        {/* Active View Viewport */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 pb-8 max-w-[1440px] w-full mx-auto">
          {activeNav === 'dashboard' && (
            <DashboardView
              products={products}
              customers={customers}
              invoices={invoices}
              settings={settings}
              onNavigate={handleNavigate}
              onSelectInvoice={(inv) => setActiveInvoiceModal(inv)}
              onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
              onQuickRestock={handleAdjustStock}
            />
          )}

          {activeNav === 'pos' && (
            <BillingPosView
              key={`${posCategoryFilter}-${posCustomerId || 'default'}`}
              products={products}
              customers={customers}
              settings={settings}
              initialCategory={posCategoryFilter}
              preselectedCustomerId={posCustomerId}
              onCompleteSale={handleCompleteSale}
              onNavigateToProducts={() => handleNavigate('products')}
            />
          )}

          {activeNav === 'products' && (
            <ProductsView
              products={products}
              settings={settings}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onAdjustStock={handleAdjustStock}
              initialFilter={productsInitialFilter}
            />
          )}

          {activeNav === 'customers' && (
            <CustomersView
              customers={customers}
              invoices={invoices}
              settings={settings}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onUpdateCustomerRx={handleUpdateCustomerRx}
              onBillCustomerInPos={handleBillCustomerInPos}
              onDeleteCustomer={handleDeleteCustomer}
            />
          )}

          {activeNav === 'invoices' && (
            <InvoicesView
              invoices={invoices}
              settings={settings}
              onSelectInvoice={(inv) => setActiveInvoiceModal(inv)}
              onUpdateStatus={handleUpdateInvoiceStatus}
              onDeleteInvoice={handleDeleteInvoice}
            />
          )}

          {activeNav === 'reports' && (
            <ReportsView
              invoices={invoices}
              products={products}
              settings={settings}
            />
          )}

          {activeNav === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onResetDemoData={handleResetDemoData}
            />
          )}
        </main>
      </div>

      {/* Mobile Off-Canvas Drawer Sidebar & Backdrop */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <aside className="relative w-72 max-w-[85vw] bg-slate-900 text-white z-50 flex flex-col shadow-2xl h-full select-none">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-sm">
                  <Glasses className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-display text-base font-bold tracking-tight text-white block leading-none truncate max-w-[160px]" title={settings.storeName}>
                    {settings.storeName}
                  </span>
                  <span className="text-[10px] text-slate-400">Optical POS & Eyecare</span>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                aria-label="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Menu Links */}
            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-full ${
                          isActive
                            ? 'bg-slate-950 text-amber-300'
                            : 'bg-amber-500 text-slate-950'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Drawer Footer Info */}
            <div className="p-4 border-t border-slate-800 text-xs text-slate-400 space-y-1.5">
              <div className="font-medium text-slate-200 truncate">{settings.storeName}</div>
              <div className="font-mono text-[11px] truncate">GSTIN: {settings.gstin}</div>
              {serverOnline !== null && (
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      serverOnline ? 'bg-emerald-400 ring-2 ring-emerald-400/20' : 'bg-amber-400 ring-2 ring-amber-400/20'
                    }`}
                  />
                  <span>{serverOnline ? 'Backend Online (Port 5000)' : 'Offline Local Storage'}</span>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Printable Tax Invoice Modal */}
      <InvoiceModal
        invoice={activeInvoiceModal}
        settings={settings}
        onClose={() => setActiveInvoiceModal(null)}
        onUpdateStatus={handleUpdateInvoiceStatus}
      />

      
    </div>
  );
}
