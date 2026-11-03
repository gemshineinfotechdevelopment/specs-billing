import React, { useState } from 'react';
import { Search, Printer, CheckCircle2, FileText, Trash2, Receipt } from 'lucide-react';
import { SalesInvoice, OrderStatus, StoreSettings } from '../types';

interface InvoicesViewProps {
  invoices: SalesInvoice[];
  settings: StoreSettings;
  onSelectInvoice: (invoice: SalesInvoice) => void;
  onUpdateStatus: (invoiceId: string, status: OrderStatus, collectBalance: boolean) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  settings,
  onSelectInvoice,
  onUpdateStatus,
  onDeleteInvoice,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'All' || inv.orderStatus === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesQuery =
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      inv.customerPhone.toLowerCase().includes(q) ||
      inv.items.some((i) => i.name.toLowerCase().includes(q));
    return matchesStatus && matchesQuery;
  });

  const fmt = (val: number) =>
    `${settings.currencySymbol}${val.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Sales Invoices & Optical Lab Orders
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            View GST tax invoices, print receipts, and settle advance balances upon eyewear handover
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number (LUM-2026-...), customer name, phone, or frame..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {(['All', 'Completed', 'Lab Fitting', 'Ready for Pickup'] as const).map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            )
          )}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50/70">
                <th className="py-3.5 px-4">Invoice No / Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Eyewear & Rx Details</th>
                <th className="py-3.5 px-4">Payment Mode</th>
                <th className="py-3.5 px-4 text-right">Grand Total</th>
                <th className="py-3.5 px-4 text-right">Advance & Balance</th>
                <th className="py-3.5 px-4">Order Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 text-xs">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No sales invoices recorded yet. Completed POS bills and Eye Test orders will be listed here.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-semibold text-slate-900">
                      {inv.invoiceNumber}
                    </div>
                    <div className="text-xs font-mono text-slate-500">{inv.createdAt}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-900">{inv.customerName}</div>
                    <div className="text-xs font-mono text-slate-500">{inv.customerPhone}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-slate-900 font-medium">
                      {inv.items.map((i) => `${i.name} (×${i.quantity})`).join(', ')}
                    </div>
                    <div className="text-xs text-slate-500">
                      {inv.prescription
                        ? `Rx: ${inv.prescription.lensType} · OD ${inv.prescription.rightEye.sph} / OS ${inv.prescription.leftEye.sph}`
                        : 'Retail Counter Sale'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <span className="inline-block font-medium text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
                      {inv.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className="font-bold text-slate-900">{fmt(inv.grandTotal)}</div>
                    {inv.totalDiscount > 0 && (
                      <div className="text-[11px] font-semibold text-emerald-700 mt-0.5 whitespace-nowrap">
                        Staff Disc: -{fmt(inv.totalDiscount)}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className="text-emerald-700 font-semibold text-xs">
                      Advance: {fmt(inv.amountPaid)}
                    </div>
                    {inv.balanceDue > 0 ? (
                      <div className="text-amber-700 font-bold text-xs mt-0.5">
                        Balance: {fmt(inv.balanceDue)}
                      </div>
                    ) : (
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Balance: ₹0 (Settled)
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-xs font-medium ${
                        inv.orderStatus === 'Completed'
                          ? 'text-emerald-700'
                          : inv.orderStatus === 'Ready for Pickup'
                          ? 'text-amber-700 font-semibold'
                          : 'text-slate-700'
                      }`}
                    >
                      {inv.orderStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {inv.balanceDue > 0 && (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(inv.id, 'Completed', true)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Collect Due
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectInvoice(inv)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Tax Invoice
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectInvoice(inv)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Print Receipt"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      {onDeleteInvoice && (
                        <button
                          type="button"
                          onClick={() => onDeleteInvoice(inv.id)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
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
