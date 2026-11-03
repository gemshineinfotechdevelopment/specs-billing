import { Printer, X, CheckCircle2, Glasses, FileText, Receipt } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { SalesInvoice, StoreSettings, OrderStatus } from '../types';

interface InvoiceModalProps {
  invoice: SalesInvoice | null;
  settings: StoreSettings;
  onClose: () => void;
  onUpdateStatus?: (invoiceId: string, status: OrderStatus, collectBalance: boolean) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice,
  settings,
  onClose,
  onUpdateStatus,
}) => {
  const [printFormat, setPrintFormat] = useState<'Thermal 80mm' | 'A4 Standard Tax Invoice'>(
    settings.receiptFormat || 'A4 Standard Tax Invoice'
  );

  useEffect(() => {
    if (settings.receiptFormat) {
      setPrintFormat(settings.receiptFormat);
    }
  }, [settings.receiptFormat]);

  if (!invoice) return null;

  const fmt = (val: number) =>
    `${settings.currencySymbol}${(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const isThermal = printFormat === 'Thermal 80mm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div
        className={`bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl my-2 sm:my-8 max-h-[94vh] flex flex-col transition-all duration-300 ${
          isThermal ? 'max-w-md w-full' : 'max-w-3xl w-full'
        }`}
      >
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <Glasses className="w-5 h-5 text-amber-400" />
            <div>
              <div className="font-display font-semibold text-sm sm:text-base leading-none">
                Invoice · {invoice.invoiceNumber}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Format: <span className="text-amber-300 font-medium">{printFormat}</span> (from Settings)
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 justify-end">
            {/* Format Preview Toggle */}
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setPrintFormat('A4 Standard Tax Invoice')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  !isThermal
                    ? 'bg-white text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3 h-3" />
                A4
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('Thermal 80mm')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  isThermal
                    ? 'bg-amber-400 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Receipt className="w-3 h-3" />
                80mm
              </button>
            </div>

            {onUpdateStatus && invoice.balanceDue > 0 && (
              <button
                type="button"
                onClick={() => onUpdateStatus(invoice.id, 'Completed', true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Collect ({fmt(invoice.balanceDue)})
              </button>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-800" />
              Print Receipt
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close invoice modal"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {/* Print Style Injector */}
          <style dangerouslySetInnerHTML={{
            __html: isThermal
              ? `
                @media print {
                  @page {
                    size: 80mm auto;
                    margin: 0;
                  }
                  body * {
                    visibility: hidden;
                  }
                  #printable-invoice-thermal, #printable-invoice-thermal * {
                    visibility: visible;
                  }
                  #printable-invoice-thermal {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 78mm !important;
                    max-width: 78mm !important;
                    margin: 0 auto !important;
                    padding: 3mm !important;
                    background: white !important;
                    color: black !important;
                    font-family: monospace !important;
                  }
                }
              `
              : `
                @media print {
                  @page {
                    size: A4 portrait;
                    margin: 10mm;
                  }
                  body * {
                    visibility: hidden;
                  }
                  #printable-invoice-a4, #printable-invoice-a4 * {
                    visibility: visible;
                  }
                  #printable-invoice-a4 {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100% !important;
                    background: white !important;
                    color: black !important;
                  }
                }
              `
          }} />

          {/* ============================================================ */}
          {/* FORMAT 1: THERMAL 80MM RECEIPT SLIP                         */}
          {/* ============================================================ */}
          {isThermal ? (
            <div
              id="printable-invoice-thermal"
              className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm font-mono text-xs text-slate-900 max-w-[340px] mx-auto space-y-3 leading-tight"
            >
              {/* Slip Header */}
              <div className="text-center space-y-1 pb-2 border-b border-dashed border-slate-400">
                <h2 className="text-base font-bold uppercase tracking-wider text-slate-950 font-sans">
                  {settings.storeName}
                </h2>
                <p className="text-[11px] text-slate-600">{settings.branchName}</p>
                <p className="text-[10px] text-slate-500 leading-normal">{settings.address}</p>
                <div className="text-[11px] font-bold text-slate-800 pt-0.5">
                  GSTIN: {settings.gstin}
                </div>
                <div className="text-[10px] text-slate-600">Ph: {settings.phone}</div>
              </div>

              {/* Meta Info */}
              <div className="text-[11px] space-y-1 pb-2 border-b border-dashed border-slate-400">
                <div className="flex justify-between">
                  <span>BILL NO:</span>
                  <span className="font-bold">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{invoice.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span className="font-semibold truncate max-w-[170px]">{invoice.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>PHONE:</span>
                  <span>{invoice.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span>CASHIER:</span>
                  <span>{invoice.staffName}</span>
                </div>
                <div className="flex justify-between">
                  <span>STATUS:</span>
                  <span className="font-bold uppercase">{invoice.orderStatus}</span>
                </div>
              </div>

              {/* Compact Rx Matrix if present */}
              {invoice.prescription && (
                <div className="p-2 bg-slate-50 border border-dashed border-slate-300 rounded text-[10px] space-y-1">
                  <div className="font-bold text-slate-800 uppercase flex justify-between">
                    <span>EYE RX ({invoice.prescription.lensType})</span>
                    <span>PD: {invoice.prescription.pd}mm</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-0.5">
                    <span>OD (R):</span>
                    <span>
                      SPH {invoice.prescription.rightEye.sph} | CYL {invoice.prescription.rightEye.cyl} | AX {invoice.prescription.rightEye.axis}°
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>OS (L):</span>
                    <span>
                      SPH {invoice.prescription.leftEye.sph} | CYL {invoice.prescription.leftEye.cyl} | AX {invoice.prescription.leftEye.axis}°
                    </span>
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div className="space-y-1.5 pb-2 border-b border-dashed border-slate-400">
                <div className="flex justify-between font-bold text-[10px] uppercase border-b border-slate-300 pb-1 text-slate-600">
                  <span className="w-1/2">ITEM</span>
                  <span className="w-1/6 text-center">QTY</span>
                  <span className="w-1/3 text-right">TOTAL</span>
                </div>

                {invoice.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5 text-[11px]">
                    <div className="flex justify-between font-medium">
                      <span className="w-1/2 truncate font-sans text-slate-950 font-semibold">
                        {item.name}
                      </span>
                      <span className="w-1/6 text-center">{item.quantity}</span>
                      <span className="w-1/3 text-right font-bold">{fmt(item.lineTotal)}</span>
                    </div>
                    {item.lensUpgradeLabel && item.lensUpgradeLabel !== 'Standard Included Lens' && (
                      <div className="text-[10px] text-slate-500 italic pl-1">
                        + {item.lensUpgradeLabel}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Calculations & Totals */}
              <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{fmt(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[10px]">
                  <span>CGST:</span>
                  <span>{fmt(invoice.cgstAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[10px]">
                  <span>SGST:</span>
                  <span>{fmt(invoice.sgstAmount)}</span>
                </div>
                {invoice.totalDiscount > 0 && (
                  <div className="flex justify-between text-slate-700 font-semibold">
                    <span>Staff Discount:</span>
                    <span>-{fmt(invoice.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-300 text-slate-950 font-sans">
                  <span>TOTAL AMOUNT:</span>
                  <span>{fmt(invoice.grandTotal)}</span>
                </div>
                <div className="flex justify-between font-medium pt-0.5">
                  <span>Paid ({invoice.paymentMethod}):</span>
                  <span>{fmt(invoice.amountPaid)}</span>
                </div>
                {invoice.balanceDue > 0 && (
                  <div className="flex justify-between font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    <span>BALANCE DUE:</span>
                    <span>{fmt(invoice.balanceDue)}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center text-[10px] text-slate-500 pt-1 space-y-1 leading-normal">
                <p>{settings.footerTerms}</p>
                <p className="font-semibold text-slate-700">*** Thank You! Visit Again ***</p>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* FORMAT 2: A4 STANDARD GST TAX INVOICE                         */
            /* ============================================================ */
            <div
              id="printable-invoice-a4"
              className="p-6 md:p-8 space-y-6 text-slate-900 bg-white rounded-lg border border-slate-200 shadow-sm"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    {settings.storeName}
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">{settings.branchName}</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">{settings.address}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-2 font-mono">
                    <span>GSTIN: {settings.gstin}</span>
                    <span>·</span>
                    <span>Ph: {settings.phone}</span>
                  </div>
                </div>

                <div className="sm:text-right space-y-1">
                  <div className="text-xs text-slate-500">
                    Tax Invoice No:{' '}
                    <span className="font-mono font-semibold text-slate-900">
                      {invoice.invoiceNumber}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Date & Time:{' '}
                    <span className="font-mono text-slate-800">{invoice.createdAt}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Billed By: <span className="text-slate-800 font-medium">{invoice.staffName}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Order Status:{' '}
                    <span className="font-semibold text-slate-900">{invoice.orderStatus}</span>
                    {invoice.deliveryDate ? ` · Est. Delivery: ${invoice.deliveryDate}` : ''}
                  </div>
                </div>
              </div>

              {/* Customer & Prescription Block */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-6 border-b border-slate-200">
                <div className="md:col-span-5 space-y-1">
                  <p className="text-xs font-semibold text-slate-500">Billed To Customer</p>
                  <p className="text-base font-semibold text-slate-900">{invoice.customerName}</p>
                  <p className="text-xs font-mono text-slate-600">{invoice.customerPhone}</p>
                  <p className="text-xs text-slate-500 pt-1">
                    Payment Mode: <span className="font-medium text-slate-800">{invoice.paymentMethod}</span>
                  </p>
                </div>

                {invoice.prescription && (
                  <div className="md:col-span-7 bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-800">
                        Optical Prescription (Rx) · {invoice.prescription.lensType}
                      </span>
                      <span className="text-xs font-mono text-slate-600">
                        PD: {invoice.prescription.pd} mm
                      </span>
                    </div>
                    <table className="w-full text-xs font-mono border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-left">
                          <th className="py-1 font-medium">Eye</th>
                          <th className="py-1 font-medium text-right">SPH</th>
                          <th className="py-1 font-medium text-right">CYL</th>
                          <th className="py-1 font-medium text-right">AXIS</th>
                          <th className="py-1 font-medium text-right">ADD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70">
                        <tr>
                          <td className="py-1.5 font-sans font-medium text-slate-800">OD (Right)</td>
                          <td className="py-1.5 text-right">{invoice.prescription.rightEye.sph}</td>
                          <td className="py-1.5 text-right">{invoice.prescription.rightEye.cyl}</td>
                          <td className="py-1.5 text-right">{invoice.prescription.rightEye.axis}°</td>
                          <td className="py-1.5 text-right">{invoice.prescription.rightEye.add}</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 font-sans font-medium text-slate-800">OS (Left)</td>
                          <td className="py-1.5 text-right">{invoice.prescription.leftEye.sph}</td>
                          <td className="py-1.5 text-right">{invoice.prescription.leftEye.cyl}</td>
                          <td className="py-1.5 text-right">{invoice.prescription.leftEye.axis}°</td>
                          <td className="py-1.5 text-right">{invoice.prescription.leftEye.add}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                      <th className="py-2.5 pr-3">#</th>
                      <th className="py-2.5 px-3">Eyewear / Lens Particulars</th>
                      <th className="py-2.5 px-3 font-mono">HSN</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Frame + Lens</th>
                      <th className="py-2.5 px-3 text-right">Disc</th>
                      <th className="py-2.5 px-3 text-right">GST</th>
                      <th className="py-2.5 pl-3 text-right">Net Taxable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {invoice.items.map((item, idx) => (
                      <tr key={`${item.productId}-${idx}`}>
                        <td className="py-3 pr-3 font-mono text-xs text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-500">
                            {item.category} · SKU: <span className="font-mono">{item.sku}</span>
                            {item.lensUpgradeLabel ? ` · ${item.lensUpgradeLabel}` : ''}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-slate-600">{item.hsnCode}</td>
                        <td className="py-3 px-3 text-right font-mono">{item.quantity}</td>
                        <td className="py-3 px-3 text-right font-mono">
                          {fmt(item.unitPrice + item.lensUpgradePrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {item.discount > 0 ? `-${fmt(item.discount)}` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs text-slate-600">
                          {item.gstRate}%
                        </td>
                        <td className="py-3 pl-3 text-right font-mono font-semibold text-slate-900">
                          {fmt(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Tax Summary */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-slate-200">
                <div className="md:col-span-7 flex flex-col justify-between text-xs text-slate-500 space-y-2">
                  <p className="leading-relaxed">{settings.footerTerms}</p>
                  <p className="font-medium text-slate-700 pt-2">
                    Thank you for choosing {settings.storeName}. Clear vision guaranteed.
                  </p>
                </div>

                <div className="md:col-span-5 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal (Frame + Lens)</span>
                    <span className="font-mono">{fmt(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-xs">
                    <span>CGST (Central Tax)</span>
                    <span className="font-mono">{fmt(invoice.cgstAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-xs">
                    <span>SGST (State Tax)</span>
                    <span className="font-mono">{fmt(invoice.sgstAmount)}</span>
                  </div>
                  {invoice.totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Staff Discount</span>
                      <span className="font-mono">-{fmt(invoice.totalDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Grand Total</span>
                    <span className="font-mono">{fmt(invoice.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-700 pt-1">
                    <span>Amount Paid ({invoice.paymentMethod})</span>
                    <span className="font-mono font-semibold text-emerald-700">
                      {fmt(invoice.amountPaid)}
                    </span>
                  </div>
                  {invoice.balanceDue > 0 && (
                    <div className="flex justify-between text-sm font-semibold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200">
                      <span>Balance Due on Pickup</span>
                      <span className="font-mono">{fmt(invoice.balanceDue)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
