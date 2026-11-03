import React, { useState } from 'react';
import { Search, UserPlus, ShoppingBag, Eye, X, Trash2, Users } from 'lucide-react';
import { Customer, OpticalPrescription, StoreSettings } from '../types';

interface CustomersViewProps {
  customers: Customer[];
  invoices?: any[];
  settings: StoreSettings;
  onAddCustomer: (
    customer: Omit<Customer, 'id' | 'totalSpent' | 'ordersCount' | 'lastVisit'>,
    customAmount?: number,
    customDate?: string,
    customAdvance?: number,
    customOrderCount?: number
  ) => void;
  onUpdateCustomerRx: (customerId: string, rx: OpticalPrescription) => void;
  onUpdateCustomer?: (customer: Customer) => void;
  onBillCustomerInPos: (customerId: string) => void;
  onDeleteCustomer?: (customerId: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  invoices,
  settings,
  onAddCustomer,
  onUpdateCustomerRx,
  onUpdateCustomer,
  onBillCustomerInPos,
  onDeleteCustomer,
}) => {
  const [search, setSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [ordersCount, setOrdersCount] = useState('1');
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  // Customer & Rx form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [lensType, setLensType] =
    useState<OpticalPrescription['lensType']>('Single Vision Anti-Glare');
  const [pd, setPd] = useState('');
  const [notes, setNotes] = useState('');
  const [odSph, setOdSph] = useState('');
  const [odCyl, setOdCyl] = useState('');
  const [odAxis, setOdAxis] = useState('');
  const [odAdd, setOdAdd] = useState('');
  const [osSph, setOsSph] = useState('');
  const [osCyl, setOsCyl] = useState('');
  const [osAxis, setOsAxis] = useState('');
  const [osAdd, setOsAdd] = useState('');

  const openNewCustomerModal = () => {
    setEditingCustomerId(null);
    setName('');
    setPhone('');
    setEmail('');
    setAge('');
    setAmount('');
    setAdvanceAmount('');
    setOrdersCount('');
    setVisitDate(new Date().toISOString().slice(0, 10));
    setLensType('Single Vision Anti-Glare');
    setPd('');
    setNotes('');
    setOdSph('');
    setOdCyl('');
    setOdAxis('');
    setOdAdd('');
    setOsSph('');
    setOsCyl('');
    setOsAxis('');
    setOsAdd('');
    setIsModalOpen(true);
  };

  const openEditRxModal = (cust: Customer) => {
    setEditingCustomerId(cust.id);
    setName(cust.name);
    setPhone(cust.phone.replace(/\D/g, '').slice(-10));
    setEmail(cust.email);
    setAge(String(cust.age || 35));
    setAmount(cust.totalSpent > 0 ? String(cust.totalSpent) : '');
    const custInv = invoices?.find((i: any) => i.customerId === cust.id);
    setAdvanceAmount(custInv?.amountPaid !== undefined ? String(custInv.amountPaid) : '');
    setOrdersCount(String(cust.ordersCount || 1));
    setVisitDate(cust.lastVisit || new Date().toISOString().slice(0, 10));
    const rx = cust.prescription;
    setLensType(rx?.lensType || 'Single Vision Anti-Glare');
    setPd(rx?.pd || '63');
    setNotes(rx?.notes || '');
    setOdSph(rx?.rightEye.sph || '');
    setOdCyl(rx?.rightEye.cyl || '');
    setOdAxis(rx?.rightEye.axis || '');
    setOdAdd(rx?.rightEye.add || '');
    setOsSph(rx?.leftEye.sph || '');
    setOsCyl(rx?.leftEye.cyl || '');
    setOsAxis(rx?.leftEye.axis || '');
    setOsAdd(rx?.leftEye.add || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Math.max(0, Number(amount) || 0);
    const parsedAdvance = advanceAmount !== '' ? Math.max(0, Number(advanceAmount) || 0) : parsedAmount;
    const parsedOrderCount = Math.max(1, Number(ordersCount) || 1);
    const chosenDate = visitDate || new Date().toISOString().slice(0, 10);
    const cleanDigits = phone.replace(/\D/g, '').slice(0, 10);
    if (!editingCustomerId && cleanDigits.length !== 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    const formattedPhone = cleanDigits.length === 10 ? `+91 ${cleanDigits}` : (cleanDigits ? `+91 ${cleanDigits}` : '+91 98400 00000');

    const rxPayload: OpticalPrescription = {
      rightEye: {
        sph: odSph.trim() || '0.00',
        cyl: odCyl.trim() || '0.00',
        axis: odAxis.trim() || '0',
        add: odAdd.trim() || '+0.00',
      },
      leftEye: {
        sph: osSph.trim() || '0.00',
        cyl: osCyl.trim() || '0.00',
        axis: osAxis.trim() || '0',
        add: osAdd.trim() || '+0.00',
      },
      pd: pd.trim() || '63',
      lensType,
      notes,
      recordedAt: chosenDate,
    };

    if (editingCustomerId) {
      if (onUpdateCustomer) {
        const existing = customers.find((c) => c.id === editingCustomerId);
        if (existing) {
          onUpdateCustomer({
            ...existing,
            name: name.trim() || existing.name,
            phone: formattedPhone || existing.phone,
            email: email.trim(),
            age: Number(age) || existing.age,
            totalSpent: parsedAmount || existing.totalSpent,
            ordersCount: parsedOrderCount,
            lastVisit: chosenDate,
            prescription: rxPayload,
          });
        }
      } else {
        onUpdateCustomerRx(editingCustomerId, rxPayload);
      }
    } else {
      if (!name.trim()) return;
      onAddCustomer(
        {
          name: name.trim(),
          phone: formattedPhone,
          email: email.trim(),
          age: Number(age) || undefined,
          prescription: rxPayload,
        },
        parsedAmount,
        chosenDate,
        parsedAdvance,
        parsedOrderCount
      );
    }
    setIsModalOpen(false);
  };

  const filteredCustomers = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
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
            Customers & Optometry Prescriptions (Rx)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Store OD/OS eye power measurements, pupillary distance (PD), and load directly into POS
          </p>
        </div>
        <button
          type="button"
          onClick={openNewCustomerModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          New Patient & Eye Test
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, phone number, or email..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
          />
        </div>
      </div>

      {/* Customer & Rx Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white border border-slate-200 rounded-xl space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">No Customers Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click &quot;New Patient &amp; Eye Test&quot; above to register your first patient and enter optical prescription measurements.
            </p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
          <div
            key={customer.id}
            className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {customer.name}
                    {customer.age ? (
                      <span className="text-xs font-normal text-slate-500 ml-2">
                        · {customer.age} yrs
                      </span>
                    ) : null}
                  </h3>
                  <div className="text-xs font-mono text-slate-600 mt-0.5">
                    {customer.phone} {customer.email ? `· ${customer.email}` : ''}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-slate-900">
                    {fmt(customer.totalSpent)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {customer.ordersCount} orders · Last: {customer.lastVisit}
                  </div>
                </div>
              </div>

              {/* Prescription Table */}
              {customer.prescription ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      {customer.prescription.lensType}
                    </span>
                    <span className="font-mono text-slate-600">
                      PD: {customer.prescription.pd} mm · Tested:{' '}
                      {customer.prescription.recordedAt}
                    </span>
                  </div>

                  <table className="w-full text-xs font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-1 text-left font-sans">Eye</th>
                        <th className="py-1 text-right">SPH</th>
                        <th className="py-1 text-right">CYL</th>
                        <th className="py-1 text-right">AXIS</th>
                        <th className="py-1 text-right">ADD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60">
                      <tr>
                        <td className="py-1.5 font-sans font-medium text-slate-800">
                          OD (Right Eye)
                        </td>
                        <td className="py-1.5 text-right">
                          {customer.prescription.rightEye.sph}
                        </td>
                        <td className="py-1.5 text-right">
                          {customer.prescription.rightEye.cyl}
                        </td>
                        <td className="py-1.5 text-right">
                          {customer.prescription.rightEye.axis}°
                        </td>
                        <td className="py-1.5 text-right">
                          {customer.prescription.rightEye.add}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-sans font-medium text-slate-800">
                          OS (Left Eye)
                        </td>
                        <td className="py-1.5 text-right">
                          {customer.prescription.leftEye.sph}
                        </td>
                        <td className="py-1.5 text-right">
                          {customer.prescription.leftEye.cyl}
                        </td>
                        <td className="py-1.5 text-right">
                          {customer.prescription.leftEye.axis}°
                        </td>
                        <td className="py-1.5 text-right">
                          {customer.prescription.leftEye.add}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {customer.prescription.notes && (
                    <p className="text-xs text-slate-600 pt-1 border-t border-slate-200/70">
                      Optometrist Note: {customer.prescription.notes}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-500 text-center">
                  No prescription recorded yet (Sunglasses / Zero-Power buyer).
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => openEditRxModal(customer)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                Update Eye Rx
              </button>
              <button
                type="button"
                onClick={() => onBillCustomerInPos(customer.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Load into Billing POS
              </button>
            </div>
          </div>
        )))}
      </div>

      {/* Add Customer / Update Rx Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full overflow-hidden shadow-xl my-2 sm:my-8 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white shrink-0">
              <h2 className="text-base font-semibold">
                {editingCustomerId
                  ? `Update Optometry Prescription · ${name}`
                  : 'Register Customer & Eye Prescription'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {!editingCustomerId && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Patient / Customer Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 30"
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Mobile Number (10 Digits)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-500 font-semibold select-none">
                        +91
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        required
                        maxLength={10}
                        minLength={10}
                        value={phone.replace(/\D/g, '').slice(0, 10)}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        onKeyDown={(e) => {
                          // Allow navigation, backspace, delete, tab
                          if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
                          // Block non-digit keys
                          if (!/^[0-9]$/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        placeholder="98401 23456"
                        className="w-full pl-11 pr-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Order Financials, Advance & Order Count */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">Order Financials & Advance Payment</span>
                  <span className="font-mono text-slate-600">
                    Balance Due:{' '}
                    <span className="font-bold text-amber-700">
                      {settings.currencySymbol}
                      {Math.max(
                        0,
                        (Number(amount) || 0) - (advanceAmount !== '' ? Number(advanceAmount) || 0 : (Number(amount) || 0))
                      ).toLocaleString('en-IN')}
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Total Amount ({settings.currencySymbol}) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                        {settings.currencySymbol}
                      </span>
                      <input
                        type="number"
                        min={0}
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g. 2500"
                        className="w-full pl-6 pr-2 py-1.5 text-xs font-mono font-bold bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Advance Paid ({settings.currencySymbol})
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                        {settings.currencySymbol}
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={advanceAmount}
                        onChange={(e) => setAdvanceAmount(e.target.value)}
                        placeholder="e.g. 1000"
                        className="w-full pl-6 pr-2 py-1.5 text-xs font-mono font-medium bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Order Count (Pcs)
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={ordersCount}
                      onChange={(e) => setOrdersCount(e.target.value)}
                      placeholder="1"
                      className="w-full px-2 py-1.5 text-xs font-mono text-center font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Test / Visit Date
                    </label>
                    <input
                      type="date"
                      required
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Recommended Lens Type
                  </label>
                  <select
                    value={lensType}
                    onChange={(e) =>
                      setLensType(e.target.value as OpticalPrescription['lensType'])
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Zero-Power Blue Cut">Zero-Power Blue Cut</option>
                    <option value="Single Vision Anti-Glare">Single Vision Anti-Glare</option>
                    <option value="Bifocal">Bifocal</option>
                    <option value="Progressive High-Index">Progressive High-Index</option>
                    <option value="Photochromic Transition">Photochromic Transition</option>
                    <option value="Standard Tint">Standard Tint</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Pupillary Dist (PD mm)
                  </label>
                  <input
                    type="text"
                    value={pd}
                    onChange={(e) => setPd(e.target.value)}
                    placeholder="e.g. 63"
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Diopter Entry Table */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  Diopter Measurements (SPH / CYL / AXIS / ADD)
                </div>
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200">
                      <th className="py-1.5 text-left font-sans">Eye</th>
                      <th className="py-1.5 text-center">SPH</th>
                      <th className="py-1.5 text-center">CYL</th>
                      <th className="py-1.5 text-center">AXIS</th>
                      <th className="py-1.5 text-center">ADD</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 font-sans font-semibold text-slate-800">
                        OD (Right)
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={odSph} placeholder="0.00" onChange={(e) => setOdSph(e.target.value)}
                          className="w-full px-2 py-1.5 text-center bg-white border border-slate-200 rounded"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={odCyl} placeholder="0.00" onChange={(e) => setOdCyl(e.target.value)}
                          className="w-full px-2 py-1.5 text-center bg-white border border-slate-200 rounded"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={odAxis} placeholder="0" onChange={(e) => setOdAxis(e.target.value)}
                          className="w-full px-2 py-1.5 text-center bg-white border border-slate-200 rounded"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={odAdd} placeholder="0.00" onChange={(e) => setOdAdd(e.target.value)}
                          className="w-full px-2 py-1.5 text-center bg-white border border-slate-200 rounded"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 font-sans font-semibold text-slate-800">
                        OS (Left)
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={osSph} placeholder="0.00" onChange={(e) => setOsSph(e.target.value)}
                          className="w-full px-2 py-1.5 text-center bg-white border border-slate-200 rounded"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={osCyl} placeholder="0.00" onChange={(e) => setOsCyl(e.target.value)}
                          className="w-full px-2 py-1.5 text-center bg-white border border-slate-200 rounded"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={osAxis} placeholder="0" onChange={(e) => setOsAxis(e.target.value)}
                          className="w-full px-2 py-1.5 text-center bg-white border border-slate-200 rounded"
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="text"
                          value={osAdd} placeholder="0.00" onChange={(e) => setOsAdd(e.target.value)}
                          className="w-full px-2 py-1.5 text-center bg-white border border-slate-200 rounded"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Optometrist Clinical Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Computer vision strain, recommends anti-reflective coating"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                >
                  Save Prescription Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
