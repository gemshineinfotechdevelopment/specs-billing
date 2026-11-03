import React, { useState, useMemo } from 'react';
import {
  ArrowUpRight,
  Plus,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Check,
  PackageX,
  ExternalLink,
} from 'lucide-react';
import {
  Product,
  Customer,
  SalesInvoice,
  StoreSettings,
  NavSection,
  EyewearCategory,
  OrderStatus,
} from '../types';
import { ProductImage } from './ProductImage';

interface DashboardViewProps {
  products: Product[];
  customers: Customer[];
  invoices: SalesInvoice[];
  settings: StoreSettings;
  onNavigate: (section: NavSection, preselectCategory?: EyewearCategory, filter?: string) => void;
  onSelectInvoice: (invoice: SalesInvoice) => void;
  onUpdateInvoiceStatus: (invoiceId: string, status: OrderStatus, collectBalance: boolean) => void;
  onQuickRestock: (productId: string, addQty: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  customers,
  invoices,
  settings,
  onNavigate,
  onSelectInvoice,
  onUpdateInvoiceStatus,
  onQuickRestock,
}) => {
  // Low Stock Alert driven by Settings threshold for all products
  const [selectedLowStockCat, setSelectedLowStockCat] = useState<EyewearCategory | 'All'>('All');
  const [customRestockQty, setCustomRestockQty] = useState<Record<string, number>>({});

  const fmt = (val: number) =>
    `${settings.currencySymbol}${val.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    })}`;

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);

  // Low stock calculation driven strictly by Settings threshold for all products
  const lowStockThreshold = settings.defaultLowStockThreshold || 5;
  const isProductLowStock = (p: Product) => {
    return p.stock <= lowStockThreshold;
  };

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => {
      const isLow = isProductLowStock(p);
      const matchesCat = selectedLowStockCat === 'All' || p.category === selectedLowStockCat;
      return isLow && matchesCat;
    });
  }, [products, lowStockThreshold, selectedLowStockCat]);

  const allLowStockCount = useMemo(() => {
    return products.filter(isProductLowStock).length;
  }, [products, lowStockThreshold]);

  const lowStockTotalUnits = useMemo(() => {
    return products.filter(isProductLowStock).reduce((sum, p) => sum + p.stock, 0);
  }, [products, lowStockThreshold]);

  const lowStockTotalValue = useMemo(() => {
    return products.filter(isProductLowStock).reduce((sum, p) => sum + p.price * p.stock, 0);
  }, [products, lowStockThreshold]);

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => p.stock <= 0).length;
  }, [products]);

  const categorySummary: {
    category: EyewearCategory;
    description: string;
    skuCount: number;
    stockCount: number;
    lowStockInCat: number;
  }[] = [
    {
      category: 'Sunglasses',
      description: 'Polarized UV400, Aviators & Navigators',
      skuCount: products.filter((p) => p.category === 'Sunglasses').length,
      stockCount: products
        .filter((p) => p.category === 'Sunglasses')
        .reduce((acc, p) => acc + p.stock, 0),
      lowStockInCat: products.filter((p) => p.category === 'Sunglasses' && isProductLowStock(p)).length,
    },
    {
      category: 'Cooling Glasses',
      description: 'Zero-Power Blue-Cut & Anti-Fatigue',
      skuCount: products.filter((p) => p.category === 'Cooling Glasses').length,
      stockCount: products
        .filter((p) => p.category === 'Cooling Glasses')
        .reduce((acc, p) => acc + p.stock, 0),
      lowStockInCat: products.filter((p) => p.category === 'Cooling Glasses' && isProductLowStock(p)).length,
    },
    {
      category: 'Power Glasses',
      description: 'Single Vision, Bifocal & Progressive Rx',
      skuCount: products.filter((p) => p.category === 'Power Glasses').length,
      stockCount: products
        .filter((p) => p.category === 'Power Glasses')
        .reduce((acc, p) => acc + p.stock, 0),
      lowStockInCat: products.filter((p) => p.category === 'Power Glasses' && isProductLowStock(p)).length,
    },
    {
      category: 'Lenses & Care',
      description: 'Optical Lenses & Hydrogel Contacts',
      skuCount: products.filter((p) => p.category === 'Lenses & Care').length,
      stockCount: products
        .filter((p) => p.category === 'Lenses & Care')
        .reduce((acc, p) => acc + p.stock, 0),
      lowStockInCat: products.filter((p) => p.category === 'Lenses & Care' && isProductLowStock(p)).length,
    },
  ];

  
  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Counter Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Store Operations Overview
            </h1>
            {allLowStockCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                {allLowStockCount} Low Stock Alert{allLowStockCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-1">
            {settings.storeName} · {settings.branchName} · Active Counter Shift
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Optical Bill (POS)
          </button>
          
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-5 flex flex-col justify-between shadow-2xs">
          <div className="text-[11px] sm:text-xs font-medium text-slate-500 truncate">Total Billed Revenue</div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-slate-900 mt-1 sm:mt-2 truncate">
            {fmt(totalRevenue)}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-2 font-mono truncate">
            Collected: {fmt(totalCollected)} · {invoices.length} inv
          </div>
        </div>

        {/* Highlighted Low Stock Inventory KPI with direct filter action */}
        <div
          onClick={() => {
            const el = document.getElementById('low-stock-alert-panel');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`bg-white border rounded-xl p-3 sm:p-5 cursor-pointer transition-all flex flex-col justify-between shadow-2xs ${
            allLowStockCount > 0
              ? 'border-amber-300 ring-2 ring-amber-100 hover:border-amber-400'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 truncate">Low Stock Alert</span>
            {allLowStockCount > 0 && (
              <span className="text-[9px] sm:text-[11px] font-semibold text-amber-800 bg-amber-50 px-1 sm:px-2 py-0.5 rounded border border-amber-200 whitespace-nowrap">
                Action
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1 sm:gap-2 mt-1 sm:mt-2">
            <div className={`text-lg sm:text-2xl font-bold font-mono ${allLowStockCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
              {allLowStockCount}
            </div>
            <span className="text-xs text-slate-500 font-mono truncate">
              items ({lowStockTotalUnits} units)
            </span>
            {outOfStockCount > 0 && (
              <span className="text-[10px] sm:text-xs font-bold text-rose-600 font-mono">
                ({outOfStockCount} Out)
              </span>
            )}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-2 flex items-center justify-between font-mono">
            <span>≤ {lowStockThreshold} units</span>
            <span className="text-slate-700 font-medium hover:underline flex items-center gap-0.5 shrink-0">
              Valuation: {fmt(lowStockTotalValue)} →
            </span>
          </div>
        </div>
      </div>

      {/* Quick POS Launch by Eyewear Category */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Quick POS Counter by Eyewear Category
          </h2>
          <span className="text-xs text-slate-500">
            Tap any category on tablet to open POS filtered directly
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categorySummary.map((item) => (
            <button
              key={item.category}
              type="button"
              onClick={() => onNavigate('pos', item.category)}
              className="group text-left bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-5 transition-colors cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-slate-950">
                      {item.category}
                    </h3>
                    {item.lowStockInCat > 0 && (
                      <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        {item.lowStockInCat} Low
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-mono">
                <span>{item.skuCount} Models</span>
                <span>·</span>
                <span>{item.stockCount} Units in Stock</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* OPTION B: Dedicated Interactive Low Stock Alert Badge & Reordering Panel */}
      <section
        id="low-stock-alert-panel"
        className="bg-white border border-amber-200/80 rounded-xl shadow-xs overflow-hidden"
      >
        {/* Panel Header & Controls */}
        <div className="p-5 bg-gradient-to-r from-amber-50/70 via-white to-white border-b border-amber-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500 text-white shadow-xs shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Low Stock Inventory Alert Badge
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  {allLowStockCount} Products Need Replenishment ({lowStockTotalUnits} units · Stock Value {fmt(lowStockTotalValue)})
                </span>
                {outOfStockCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    <PackageX className="w-3.5 h-3.5" />
                    {outOfStockCount} Critical Out of Stock
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons: View in Catalog */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('products', undefined, 'low')}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            >
              <span>Manage in Catalog</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Category Filter Controls */}
        <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-600 font-medium">Filter by Category:</span>
          <div className="flex items-center gap-1 overflow-x-auto">
            {(['All', 'Sunglasses', 'Cooling Glasses', 'Power Glasses', 'Lenses & Care'] as const).map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedLowStockCat(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    selectedLowStockCat === cat
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>
        </div>

        {/* Low Stock Product List / Table with Quick In-line Restocking */}
        {lowStockProducts.length === 0 ? (
          <div className="p-8 text-center bg-white space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-900">
              Inventory is Healthy
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All optical products in this category currently exceed the reorder alert threshold (≤ {lowStockThreshold} units).
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {lowStockProducts.map((item) => {
              const isOutOfStock = item.stock <= 0;
              const isUrgent = item.stock <= 2;
              const recommendedReorder = Math.max(10, item.reorderLevel * 2 - item.stock);
              const customQty = customRestockQty[item.id] ?? 10;

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  {/* Left: Product Thumbnail, Badges & Details */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <ProductImage
                      src={item.imageUrl}
                      alt={item.name}
                      category={item.category}
                      className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                    />

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {item.name}
                        </span>

                        {/* Status Alert Badge */}
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                            OUT OF STOCK
                          </span>
                        ) : isUrgent ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                            URGENT LOW ({item.stock} LEFT)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
                            REORDER ALERT
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono mt-1">
                        <span>SKU: {item.sku}</span>
                        <span>·</span>
                        <span>{item.brand}</span>
                        <span>·</span>
                        <span>{item.category}</span>
                        <span>·</span>
                        <span>Threshold: ≤ {settings.defaultLowStockThreshold || item.reorderLevel || 5} units</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Stock Level Indicator & Quick Restock Button Group */}
                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 shrink-0">
                    {/* Stock Metrics */}
                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-1.5">
                        <span className="text-xs text-slate-500">In Stock:</span>
                        <span
                          className={`text-base font-bold font-mono ${
                            isOutOfStock
                              ? 'text-rose-600'
                              : isUrgent
                              ? 'text-amber-700'
                              : 'text-slate-900'
                          }`}
                        >
                          {item.stock} units
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        Suggested PO: +{recommendedReorder} units
                      </div>
                    </div>

                    {/* In-Line Restock Quantity Input & Add Action */}
                    <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={customRestockQty[item.id] !== undefined ? customRestockQty[item.id] : 10}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                          setCustomRestockQty({
                            ...customRestockQty,
                            [item.id]: val,
                          });
                        }}
                        className="w-14 px-2 py-1.5 text-xs font-mono text-center focus:outline-none focus:bg-slate-50 text-slate-900 font-semibold"
                        placeholder="Qty"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const qty = customRestockQty[item.id] !== undefined ? customRestockQty[item.id] : 10;
                          if (qty > 0) {
                            onQuickRestock(item.id, qty);
                          }
                        }}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 transition-colors cursor-pointer whitespace-nowrap"
                        title="Add units to stock"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Completed Sales Invoices (No Pending Due) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Completed Sales Invoices
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              All settled optical bills and completed customer orders
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('invoices')}
            className="text-xs font-medium text-slate-700 hover:text-slate-900 underline underline-offset-4 cursor-pointer whitespace-nowrap shrink-0"
          >
            View All Invoices
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50/60">
                <th className="py-3 px-4">Invoice / Customer</th>
                <th className="py-3 px-4">Eyewear & Lens Spec</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                    No sales invoices recorded yet. Completed POS bills will appear here.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-xs font-semibold text-slate-900">
                      {inv.invoiceNumber}
                    </div>
                    <div className="font-medium text-slate-800">{inv.customerName}</div>
                    <div className="text-xs font-mono text-slate-500">{inv.customerPhone}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-slate-900 font-medium">
                      {inv.items.map((i) => i.name).join(', ')}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {inv.prescription
                        ? `Rx: ${inv.prescription.lensType} · PD ${inv.prescription.pd}mm`
                        : 'Direct Retail Counter Sale'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className="font-bold text-slate-900">{fmt(inv.grandTotal)}</div>
                    {inv.totalDiscount > 0 && (
                      <div className="text-[11px] font-semibold text-emerald-700 mt-0.5 whitespace-nowrap">
                        Staff Disc: -{fmt(inv.totalDiscount)}
                      </div>
                    )}
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      Paid in Full ({inv.paymentMethod})
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Completed
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectInvoice(inv)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                      title="View / Print Tax Invoice"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Print Tax Bill</span>
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
