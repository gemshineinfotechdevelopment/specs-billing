import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, CreditCard, BarChart2, CheckCircle2, Clock, Check } from 'lucide-react';
import {
  SalesInvoice,
  Product,
  StoreSettings,
  EyewearCategory,
  PaymentMethod,
} from '../types';
import { api } from '../services/api';

interface ReportsViewProps {
  invoices: SalesInvoice[];
  products: Product[];
  settings: StoreSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  invoices,
  products,
  settings,
}) => {
  const [backendSummary, setBackendSummary] = useState<any>(null);
  const [isLiveFromBackend, setIsLiveFromBackend] = useState(false);

  useEffect(() => {
    api.getReportsSummary()
      .then((res) => {
        if (res?.success && res.data) {
          setBackendSummary(res.data);
          setIsLiveFromBackend(true);
        }
      })
      .catch(() => {
        setIsLiveFromBackend(false);
      });
  }, [invoices.length, products.length]);

  const fmt = (val: number) =>
    `${settings.currencySymbol}${(val || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    })}`;

  // Category Revenue Breakdown
  const categories: EyewearCategory[] = [
    'Sunglasses',
    'Cooling Glasses',
    'Power Glasses',
    'Lenses & Care',
  ];

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

  const totalCatSales = Math.max(
    1,
    categoryMetrics.reduce((acc, c) => acc + c.netSales, 0)
  );

  // Payment Mode Reconciliation
  const paymentMethods: PaymentMethod[] = [
    'UPI / QR',
    'Card',
    'Cash',
    'Split Payment',
  ];

  const paymentBreakdown = paymentMethods.map((method) => {
    const matching = invoices.filter((i) => i.paymentMethod === method);
    const billed = matching.reduce((acc, i) => acc + i.grandTotal, 0);
    const collected = matching.reduce((acc, i) => acc + i.amountPaid, 0);
    return {
      method,
      count: matching.length,
      billed,
      collected,
    };
  });

  const totalPaymentBilled = Math.max(
    1,
    paymentBreakdown.reduce((acc, p) => acc + p.billed, 0)
  );

  // Order Status Breakdown
  const orderStatuses = ['Completed', 'Lab Fitting', 'Ready for Pickup'] as const;
  const statusBreakdown = orderStatuses.map((st) => {
    const matching = invoices.filter((i) => i.orderStatus === st);
    const total = matching.reduce((acc, i) => acc + i.grandTotal, 0);
    return {
      status: st,
      count: matching.length,
      total,
    };
  });

  // Tax Summary
  const totalTaxable = backendSummary?.tax?.totalTaxable ?? invoices.reduce(
    (acc, i) => acc + (i.subtotal - i.totalDiscount),
    0
  );
  const totalCgst = backendSummary?.tax?.totalCgst ?? invoices.reduce((acc, i) => acc + i.cgstAmount, 0);
  const totalSgst = backendSummary?.tax?.totalSgst ?? invoices.reduce((acc, i) => acc + i.sgstAmount, 0);
  const totalGrand = backendSummary?.totalRevenue ?? invoices.reduce((acc, i) => acc + i.grandTotal, 0);
  const totalCollected = backendSummary?.totalCollected ?? invoices.reduce((acc, i) => acc + i.amountPaid, 0);

  const exportCsv = () => {
    const headers = [
      'Invoice Number',
      'Date',
      'Customer Name',
      'Phone',
      'Payment Mode',
      'Order Status',
      'Subtotal',
      'Discount',
      'CGST',
      'SGST',
      'Grand Total',
      'Amount Paid',
      'Balance Due',
    ];
    const rows = invoices.map((i) => [
      i.invoiceNumber,
      i.createdAt,
      `"${i.customerName}"`,
      i.customerPhone,
      i.paymentMethod,
      i.orderStatus,
      i.subtotal,
      i.totalDiscount,
      i.cgstAmount,
      i.sgstAmount,
      i.grandTotal,
      i.amountPaid,
      i.balanceDue,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categoryColors: Record<EyewearCategory, string> = {
    Sunglasses: 'bg-amber-500',
    'Cooling Glasses': 'bg-cyan-500',
    'Power Glasses': 'bg-blue-600',
    'Lenses & Care': 'bg-indigo-500',
  };

  const paymentColors: Record<PaymentMethod, string> = {
    'UPI / QR': 'bg-emerald-500',
    Card: 'bg-blue-600',
    Cash: 'bg-amber-500',
    'Split Payment': 'bg-purple-600',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Financial Reports & Store Analytics
            </h1>
            {isLiveFromBackend && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Backend Synced
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Real-time optical sales metrics, category revenue share, payment reconciliation, and GST ledger
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
        >
          <Download className="w-4 h-4" />
          Download Sales CSV
        </button>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Billed Sales</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {fmt(totalGrand)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Collected: {fmt(totalCollected)}</span>
            <span className="font-mono text-emerald-600 font-semibold">
              {invoices.length} Invoices
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Taxable Value</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {fmt(totalTaxable)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Excl. CGST & SGST taxes</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total GST Collected</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {fmt(totalCgst + totalSgst)}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono">
            CGST: {fmt(totalCgst)} · SGST: {fmt(totalSgst)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Store Identity & GSTIN</div>
          <div className="text-lg font-bold text-slate-900 mt-2 truncate" title={settings.storeName}>
            {settings.storeName}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono">
            GSTIN: <span className="font-semibold text-slate-800">{settings.gstin}</span>
          </div>
        </div>
      </div>

      {/* Visual Charts & Reconciliation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Category Breakdown & Visual Progress Bars */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-slate-600" />
              Category Sales & Inventory Valuation
            </h2>
            <span className="text-xs font-mono text-slate-500">
              Total: {fmt(totalCatSales)}
            </span>
          </div>

          <div className="p-6 space-y-6">
            {categoryMetrics.map((m) => {
              const sharePct = totalCatSales > 0 ? Math.round((m.netSales / totalCatSales) * 100) : 0;
              const barColor = categoryColors[m.category] || 'bg-slate-900';
              return (
                <div key={m.category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${barColor}`} />
                      <span className="font-semibold text-slate-900">{m.category}</span>
                      <span className="text-xs text-slate-500 font-mono">
                        · {m.unitsSold} sold
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900">
                        {fmt(m.netSales)}
                      </span>
                      <span className="text-xs text-slate-500 font-mono ml-1.5">
                        ({sharePct}%)
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar Chart */}
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(sharePct > 0 ? 3 : 0, sharePct)}%` }}
                    />
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono flex justify-between">
                    <span>Stock Value in Store: {fmt(m.inventoryValue)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Method Breakdown & Graph */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-4">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-600" />
              Payment Method Reconciliation
            </h2>
          </div>

          <div className="px-6 space-y-4">
            {/* Visual Payment Share Bar */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-600">Payment Channel Share Graph</div>
              <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                {paymentBreakdown.map((row) => {
                  const share = totalPaymentBilled > 0 ? (row.billed / totalPaymentBilled) * 100 : 0;
                  if (share <= 0) return null;
                  const color = paymentColors[row.method] || 'bg-slate-400';
                  return (
                    <div
                      key={row.method}
                      title={`${row.method}: ${fmt(row.billed)} (${Math.round(share)}%)`}
                      className={`h-full ${color} transition-all`}
                      style={{ width: `${share}%` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Payment Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 font-semibold text-slate-500 bg-slate-50/70">
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3 text-center">Bills</th>
                    <th className="py-2.5 px-3 text-right">Billed</th>
                    <th className="py-2.5 px-3 text-right">Collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paymentBreakdown.map((row) => {
                    const color = paymentColors[row.method] || 'bg-slate-400';
                    return (
                      <tr key={row.method} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-medium text-slate-900 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${color}`} />
                          {row.method}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {row.count}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                          {fmt(row.billed)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">
                          {fmt(row.collected)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Status Summary */}
          <div className="px-6 pb-6 pt-2">
            <div className="text-xs font-semibold text-slate-700 mb-2">Order Fulfillment Status</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {statusBreakdown.map((st) => (
                <div key={st.status} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-base font-bold font-mono text-slate-900">{st.count}</div>
                  <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{st.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
