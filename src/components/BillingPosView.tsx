import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  UserPlus,
  Eye,
  Check,
  Receipt,
  RotateCcw,
  Glasses,
} from 'lucide-react';
import {
  Product,
  Customer,
  CartItem,
  EyewearCategory,
  OpticalPrescription,
  PaymentMethod,
  OrderStatus,
  SalesInvoice,
  StoreSettings,
} from '../types';

interface BillingPosViewProps {
  products: Product[];
  customers: Customer[];
  settings: StoreSettings;
  initialCategory?: EyewearCategory | 'All';
  preselectedCustomerId?: string | null;
  onCompleteSale: (
    invoice: Omit<SalesInvoice, 'id' | 'invoiceNumber' | 'createdAt'>,
    newCustomer?: Omit<Customer, 'id' | 'totalSpent' | 'ordersCount' | 'lastVisit'>
  ) => void;
  onNavigateToProducts?: () => void;
}

const LENS_UPGRADE_OPTIONS = [
  { label: 'Standard Included Lens', price: 0 },
  { label: 'Zero-Power Blue Cut 420nm', price: 600 },
  { label: 'Single Vision Anti-Glare + UV', price: 1400 },
  { label: 'Photochromic Day/Night Transition', price: 2200 },
  { label: 'Digital Progressive High-Index 1.67', price: 3200 },
];

const DEFAULT_RX: OpticalPrescription = {
  rightEye: { sph: '-1.00', cyl: '-0.25', axis: '180', add: '+0.00' },
  leftEye: { sph: '-1.25', cyl: '-0.25', axis: '175', add: '+0.00' },
  pd: '63',
  lensType: 'Single Vision Anti-Glare',
  notes: '',
  recordedAt: new Date().toISOString().slice(0, 10),
};

export const BillingPosView: React.FC<BillingPosViewProps> = ({
  products,
  customers,
  settings,
  initialCategory = 'All',
  preselectedCustomerId,
  onCompleteSale,
  onNavigateToProducts,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<EyewearCategory | 'All'>(
    initialCategory
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Customer selection or quick walk-in creation
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    preselectedCustomerId || customers[0]?.id || 'walk-in'
  );
  const [isNewWalkIn, setIsNewWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');

  // Optical Prescription (Rx) toggle & values
  const activeCustomer = customers.find((c) => c.id === selectedCustomerId);
  const [attachRx, setAttachRx] = useState<boolean>(Boolean(activeCustomer?.prescription));
  const [rxData, setRxData] = useState<OpticalPrescription>(
    activeCustomer?.prescription || DEFAULT_RX
  );

  // Payment & Order Status
  const [extraBillDiscount, setExtraBillDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI / QR');
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('Completed');
  const [advancePaidInput, setAdvancePaidInput] = useState<string>('');
  const [staffName, setStaffName] = useState<string>('Suresh K.');
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');

  // Sync Rx when customer switches
  const handleSelectCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    setIsNewWalkIn(false);
    const found = customers.find((c) => c.id === custId);
    if (found?.prescription) {
      setRxData(found.prescription);
      setAttachRx(true);
    }
  };

  // Products available in Billing POS directly from Catalog
  const posProducts = useMemo(() => products, [products]);

  const filteredProducts = useMemo(() => {
    return posProducts.filter((p) => {
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.lensFeature.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [posProducts, selectedCategory, searchQuery]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        if (currentQty >= product.stock) return prev;
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: currentQty + 1,
        };
        return updated;
      }
      const defaultLens =
        product.category === 'Power Glasses'
          ? LENS_UPGRADE_OPTIONS[2]
          : LENS_UPGRADE_OPTIONS[0];
      return [
        ...prev,
        {
          product,
          quantity: 1,
          lensUpgradeLabel: defaultLens.label,
          lensUpgradePrice: defaultLens.price,
          itemDiscount: 0,
        },
      ];
    });

    if (product.category === 'Power Glasses') {
      setAttachRx(true);
      setOrderStatus('Lab Fitting');
    }
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          if (nextQty > item.product.stock) return item;
          return { ...item, quantity: nextQty };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateCartLens = (productId: string, lensLabel: string) => {
    const foundLens =
      LENS_UPGRADE_OPTIONS.find((o) => o.label === lensLabel) || LENS_UPGRADE_OPTIONS[0];
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              lensUpgradeLabel: foundLens.label,
              lensUpgradePrice: foundLens.price,
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Financial Calculations
  const calculations = useMemo(() => {
    let subtotal = 0;
    let itemLevelDiscounts = 0;
    let totalGst = 0;

    cart.forEach((item) => {
      if (!item || !item.product) return;
      const unitCombined = item.product.price + item.lensUpgradePrice;
      const grossLine = unitCombined * item.quantity;
      const netLine = Math.max(0, grossLine - item.itemDiscount);
      subtotal += grossLine;
      itemLevelDiscounts += item.itemDiscount;
      totalGst += (netLine * item.product.gstRate) / 100;
    });

    // GST is strictly calculated on products & lenses and does NOT change when Staff Discount is applied
    const totalGstRounded = Math.round(totalGst);
    const cgst = Math.round(totalGstRounded / 2);
    const sgst = totalGstRounded - cgst;

    const totalDiscount = itemLevelDiscounts + extraBillDiscount;

    // Staff Discount is subtracted directly from the Grand Total (Subtotal + GST - Staff Discount)
    const netBeforeStaffDiscount = Math.max(0, subtotal - itemLevelDiscounts) + cgst + sgst;
    const grandTotal = Math.max(0, Math.round(netBeforeStaffDiscount - extraBillDiscount));

    return {
      subtotal,
      itemLevelDiscounts,
      extraBillDiscount,
      totalDiscount,
      cgst,
      sgst,
      grandTotal,
    };
  }, [cart, extraBillDiscount]);

  const parsedAdvance =
    advancePaidInput.trim() === ''
      ? calculations.grandTotal
      : Math.min(calculations.grandTotal, Math.max(0, Number(advancePaidInput) || 0));

  const balanceDue = Math.max(0, calculations.grandTotal - parsedAdvance);

  const fmt = (val: number) =>
    `${settings.currencySymbol}${val.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    })}`;

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const customerName = isNewWalkIn
      ? walkInName.trim() || 'Walk-In Customer'
      : activeCustomer?.name || 'Walk-In Customer';
    const cleanWalkDigits = walkInPhone.replace(/\D/g, '').slice(0, 10);
    const customerPhone = isNewWalkIn
      ? (cleanWalkDigits.length === 10 ? `+91 ${cleanWalkDigits}` : (cleanWalkDigits ? `+91 ${cleanWalkDigits}` : '+91 90000 00000'))
      : activeCustomer?.phone || '+91 90000 00000';

    const deliveryDate = new Date(
      Date.now() + settings.defaultLabDays * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .slice(0, 10);

    onCompleteSale(
      {
        customerId: isNewWalkIn ? `cust-${Date.now()}` : selectedCustomerId,
        customerName,
        customerPhone,
        items: cart.map((c) => ({
          productId: c.product.id,
          sku: c.product.sku,
          name: c.product.name,
          category: c.product.category,
          hsnCode: c.product.hsnCode,
          quantity: c.quantity,
          unitPrice: c.product.price,
          lensUpgradeLabel: c.lensUpgradeLabel,
          lensUpgradePrice: c.lensUpgradePrice,
          discount: c.itemDiscount,
          gstRate: c.product.gstRate,
          lineTotal:
            (c.product.price + c.lensUpgradePrice) * c.quantity - c.itemDiscount,
        })),
        prescription: attachRx ? rxData : undefined,
        subtotal: calculations.subtotal,
        totalDiscount: calculations.totalDiscount,
        cgstAmount: calculations.cgst,
        sgstAmount: calculations.sgst,
        grandTotal: calculations.grandTotal,
        amountPaid: parsedAdvance,
        balanceDue,
        paymentMethod,
        orderStatus,
        deliveryDate: orderStatus !== 'Completed' ? deliveryDate : undefined,
        staffName,
      },
      isNewWalkIn && walkInName.trim()
        ? {
            name: walkInName.trim(),
            phone: (walkInPhone.replace(/\D/g, '').slice(0, 10) ? `+91 ${walkInPhone.replace(/\D/g, '').slice(0, 10)}` : '+91 90000 00000'),
            email: '',
            prescription: attachRx ? rxData : undefined,
          }
        : undefined
    );

    // Clear cart after billing
    setCart([]);
    setExtraBillDiscount(0);
    setAdvancePaidInput('');
  };

  const categories: (EyewearCategory | 'All')[] = [
    'All',
    'Sunglasses',
    'Cooling Glasses',
    'Power Glasses',
    'Lenses & Care',
  ];

  return (
    <div className="space-y-4">
      {/* Mobile-Only Tab Switcher (Catalog vs Active Bill) */}
      <div className="lg:hidden flex items-center p-1 bg-slate-200/90 rounded-xl text-xs font-semibold select-none shadow-xs">
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2.5 text-center rounded-lg transition-all cursor-pointer ${
            mobileTab === 'catalog'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          👓 Catalog ({filteredProducts.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2.5 text-center rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'cart'
              ? 'bg-slate-900 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🧾 Bill ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
          {cart.length > 0 && (
            <span className="font-mono text-amber-400">· {fmt(calculations.grandTotal)}</span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane (7 cols): Touch Product Selector */}
        <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'catalog' ? 'block' : 'hidden lg:block'}`}>
        {/* Search & Category Segmented Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Scan barcode, SKU (e.g. SUN-AV-901), frame brand, or lens feature..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white transition-colors"
            />
          </div>

          {/* Interactive Filter Controls */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat === 'All' ? 'All Eyewear' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tablet-Friendly Eyewear Grid */}
        {posProducts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Glasses className="w-6 h-6 stroke-[1.5]" />
            </div>
            <p className="text-base font-semibold text-slate-800">
              No Products in Catalog
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Only products added in the Product page appear in Billing POS. Please add eyewear models from the Product Catalog.
            </p>
            {onNavigateToProducts && (
              <button
                type="button"
                onClick={onNavigateToProducts}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Go to Product Page to Add
              </button>
            )}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
            <p className="text-base font-semibold text-slate-800">
              No matching optical products found
            </p>
            <p className="text-xs text-slate-500">
              Try clearing the search filter or switching eyewear categories.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50/80">
                    <th className="py-2.5 sm:py-3 px-3 sm:px-4">Product</th>
                    <th className="hidden sm:table-cell py-2.5 sm:py-3 px-3 sm:px-4">Category & Specs</th>
                    <th className="hidden md:table-cell py-2.5 sm:py-3 px-3 sm:px-4 font-mono">HSN / GST</th>
                    <th className="py-2.5 sm:py-3 px-2 sm:px-4 text-right">Price</th>
                    <th className="py-2.5 sm:py-3 px-2 sm:px-4 text-center">Stock</th>
                    <th className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredProducts.map((product) => {
                    const inCartQty =
                      cart.find((c) => c.product.id === product.id)?.quantity || 0;
                    const isOutOfStock = product.stock <= 0;
                    const isLowStock = product.stock > 0 && product.stock <= product.reorderLevel;

                    return (
                      <tr
                        key={product.id}
                        onClick={() => !isOutOfStock && addToCart(product)}
                        className={`transition-colors select-none ${
                          isOutOfStock
                            ? 'opacity-60 bg-slate-50/50 cursor-not-allowed'
                            : inCartQty > 0
                            ? 'bg-amber-50/60 hover:bg-amber-100/70 cursor-pointer'
                            : 'hover:bg-slate-50/80 cursor-pointer'
                        }`}
                      >
                        {/* 1. Product Name, SKU & Brand */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 line-clamp-1">
                            {product.name}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                            <span className="font-semibold text-slate-700">{product.sku}</span>
                            <span>·</span>
                            <span className="font-sans text-slate-600">{product.brand}</span>
                          </div>
                        </td>

                        {/* 2. Category & Specifications */}
                        <td className="hidden sm:table-cell py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase tracking-wider">
                              {product.category}
                            </span>
                            {product.category === 'Power Glasses' && (product.rightEyePower || product.leftEyePower) && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-100 text-amber-900 border border-amber-300">
                                R: {product.rightEyePower?.sph || '0'} | L: {product.leftEyePower?.sph || '0'}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 mt-1 truncate max-w-[220px]" title={`${product.frameShape} · ${product.frameMaterial}`}>
                            {product.frameShape} · {product.frameMaterial}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[220px]" title={product.lensFeature}>
                            {product.lensFeature}
                          </div>
                        </td>

                        {/* 3. HSN & GST */}
                        <td className="hidden md:table-cell py-3 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                          <div>{product.hsnCode}</div>
                          <div className="text-[11px] text-slate-400">{product.gstRate}% GST</div>
                        </td>

                        {/* 4. Unit Price */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {fmt(product.price)}
                        </td>

                        {/* 5. Stock Level Badge */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-1 rounded-full ${
                              isOutOfStock
                                ? 'bg-rose-100 text-rose-800'
                                : isLowStock
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isOutOfStock
                                  ? 'bg-rose-500'
                                  : isLowStock
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                            />
                            {isOutOfStock ? 'Out of Stock' : `${product.stock} in Stock`}
                          </span>
                        </td>

                        {/* 6. Action / In-Bill Status */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {inCartQty > 0 ? (
                            <div className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-xs font-mono font-semibold px-2.5 py-1.5 rounded-lg shadow-xs">
                              <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />
                              <span>{inCartQty} in Bill</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isOutOfStock}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isOutOfStock) addToCart(product);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Right Pane (5 cols): Active POS Bill, Prescription Matrix & Checkout */}
      <div className={`lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden lg:sticky lg:top-6 ${mobileTab === 'cart' ? 'block' : 'hidden lg:block'}`}>
        {/* POS Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Active Optical Counter Bill</h2>
            <p className="text-xs text-slate-400">
              Instant GST Calculation · Frame & Rx Lens Fitting
            </p>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => setCart([])}
              className="flex items-center gap-1 text-xs text-slate-300 hover:text-white cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear Bill
            </button>
          )}
        </div>

        <div className="p-5 space-y-5 max-h-[calc(100vh-120px)] overflow-y-auto">
          {/* 1. Customer Selection / Walk-In Input */}
          <div className="space-y-2.5 pb-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Customer & Patient Profile
              </label>
              <button
                type="button"
                onClick={() => setIsNewWalkIn(!isNewWalkIn)}
                className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-950 underline underline-offset-4 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {isNewWalkIn ? 'Select Existing Customer' : 'New Walk-In Customer'}
              </button>
            </div>

            {!isNewWalkIn ? (
              <select
                value={selectedCustomerId}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) {c.prescription ? '· Saved Rx' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="Customer Full Name"
                  className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-500 font-semibold select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={walkInPhone.replace(/\D/g, '').slice(0, 10)}
                    onChange={(e) => setWalkInPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyDown={(e) => {
                      if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
                      if (!/^[0-9]$/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    placeholder="98401 23456"
                    className="w-full pl-11 pr-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Optical Eye Prescription (OD / OS) Toggle & Matrix */}
          <div className="space-y-3 pb-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setAttachRx(!attachRx)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border ${
                    attachRx
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {attachRx && <Check className="w-3 h-3" />}
                </div>
                <Eye className="w-4 h-4 text-slate-600" />
                <span>Include Optical Prescription (OD / OS) on Invoice</span>
              </button>
              {attachRx && (
                <span className="text-[11px] font-mono text-slate-500">
                  PD: {rxData.pd}mm
                </span>
              )}
            </div>

            {attachRx && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Prescribed Lens Type
                    </label>
                    <select
                      value={rxData.lensType}
                      onChange={(e) =>
                        setRxData({
                          ...rxData,
                          lensType: e.target.value as OpticalPrescription['lensType'],
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                    >
                      <option value="Zero-Power Blue Cut">Zero-Power Blue Cut</option>
                      <option value="Single Vision Anti-Glare">Single Vision Anti-Glare</option>
                      <option value="Bifocal">Bifocal</option>
                      <option value="Progressive High-Index">Progressive High-Index</option>
                      <option value="Photochromic Transition">Photochromic Transition</option>
                      <option value="Standard Tint">Standard Polarized / Tint</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      PD (mm)
                    </label>
                    <input
                      type="text"
                      value={rxData.pd}
                      onChange={(e) => setRxData({ ...rxData, pd: e.target.value })}
                      placeholder="63"
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-md text-right"
                    />
                  </div>
                </div>

                {/* OD / OS Diopter Grid */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-200">
                        <th className="py-1 text-left font-sans">Eye</th>
                        <th className="py-1 text-center">SPH</th>
                        <th className="py-1 text-center">CYL</th>
                        <th className="py-1 text-center">AXIS</th>
                        <th className="py-1 text-center">ADD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60">
                      <tr>
                        <td className="py-1.5 font-sans font-semibold text-slate-800 pr-2">
                          OD (R)
                        </td>
                        {(['sph', 'cyl', 'axis', 'add'] as const).map((field) => (
                          <td key={field} className="p-1">
                            <input
                              type="text"
                              value={rxData.rightEye[field]}
                              onChange={(e) =>
                                setRxData({
                                  ...rxData,
                                  rightEye: { ...rxData.rightEye, [field]: e.target.value },
                                })
                              }
                              placeholder={field === "axis" ? "0" : "0.00"} className="w-full px-1.5 py-1 text-center bg-white border border-slate-200 rounded text-xs font-mono"
                            />
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-1.5 font-sans font-semibold text-slate-800 pr-2">
                          OS (L)
                        </td>
                        {(['sph', 'cyl', 'axis', 'add'] as const).map((field) => (
                          <td key={field} className="p-1">
                            <input
                              type="text"
                              value={rxData.leftEye[field]}
                              onChange={(e) =>
                                setRxData({
                                  ...rxData,
                                  leftEye: { ...rxData.leftEye, [field]: e.target.value },
                                })
                              }
                              className="w-full px-1.5 py-1 text-center bg-white border border-slate-200 rounded text-xs font-mono"
                            />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 3. Cart Line Items */}
          <div className="space-y-3 pb-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Eyewear & Lens Line Items ({cart.reduce((s, i) => s + i.quantity, 0)})
              </span>
              <span className="text-xs text-slate-500">Tap item card on left to add</span>
            </div>

            {cart.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-500">
                No eyewear frames or lenses in bill yet. Tap any product on the left to add.
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {item.product.name}
                        </div>
                        <div className="text-xs font-mono text-slate-500">
                          {item.product.sku} · Base: {fmt(item.product.price)} · GST{' '}
                          {item.product.gstRate}%
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        aria-label="Remove item"
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Lens Package Upgrade & Quantity Stepper */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                      <select
                        value={item.lensUpgradeLabel}
                        onChange={(e) => updateCartLens(item.product.id, e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                      >
                        {LENS_UPGRADE_OPTIONS.map((opt) => (
                          <option key={opt.label} value={opt.label}>
                            {opt.label} {opt.price > 0 ? `(+${fmt(opt.price)})` : '(Included)'}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="flex items-center border border-slate-200 rounded-md bg-white">
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.product.id, -1)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-mono font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.product.id, 1)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-sm font-mono font-bold text-slate-900 min-w-[72px] text-right">
                          {fmt(
                            (item.product.price + item.lensUpgradePrice) * item.quantity -
                              item.itemDiscount
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Payment Mode, Order Stage & Discount */}
          <div className="space-y-3 pb-4 border-b border-slate-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Staff Discount ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  min={0}
                  value={extraBillDiscount || ''}
                  onChange={(e) => setExtraBillDiscount(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Advance / Paid Now ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  min={0}
                  max={calculations.grandTotal}
                  value={advancePaidInput}
                  onChange={(e) => setAdvancePaidInput(e.target.value)}
                  placeholder={`${calculations.grandTotal} (Full)`}
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="UPI / QR">UPI / QR Scan</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Cash">Cash Counter</option>
                  <option value="Split Payment">Split Payment</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Order Handover Status
                </label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Completed">Instant Counter Delivery</option>
                  <option value="Lab Fitting">Send to Optical Lab</option>
                  <option value="Ready for Pickup">Ready for Pickup</option>
                </select>
              </div>
            </div>
          </div>

          {/* 5. Bill Summary & Complete CTA */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600 text-xs">
              <span>Subtotal (Frames + Lenses)</span>
              <span className="font-mono">{fmt(calculations.subtotal)}</span>
            </div>
            {calculations.itemLevelDiscounts > 0 && (
              <div className="flex justify-between text-emerald-700 text-xs">
                <span>Item Discount</span>
                <span className="font-mono">-{fmt(calculations.itemLevelDiscounts)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500 text-xs">
              <span>GST (CGST + SGST)</span>
              <span className="font-mono">
                {fmt(calculations.cgst + calculations.sgst)}
              </span>
            </div>
            {extraBillDiscount > 0 && (
              <div className="flex justify-between text-emerald-700 text-xs font-semibold">
                <span>Staff Discount</span>
                <span className="font-mono">-{fmt(extraBillDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Grand Total</span>
              <span className="font-mono">{fmt(calculations.grandTotal)}</span>
            </div>
            {balanceDue > 0 && (
              <div className="flex justify-between text-xs font-semibold text-amber-700 pt-1">
                <span>Advance: {fmt(parsedAdvance)}</span>
                <span className="font-mono">Balance on Pickup: {fmt(balanceDue)}</span>
              </div>
            )}

            <button
              type="button"
              disabled={cart.length === 0}
              onClick={handleCheckout}
              className="w-full mt-3 py-3.5 px-5 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              Generate Optical Tax Invoice ({fmt(calculations.grandTotal)})
            </button>
          </div>
        </div>
      </div>

      </div>

      {/* Mobile Floating Cart Summary Button */}
      {cart.length > 0 && mobileTab === 'catalog' && (
        <div className="lg:hidden fixed bottom-4 inset-x-3 z-30">
          <button
            type="button"
            onClick={() => setMobileTab('cart')}
            className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center justify-between border border-slate-800 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-950 font-mono font-bold text-xs px-2 py-0.5 rounded-full">
                {cart.reduce((s, i) => s + i.quantity, 0)} Items
              </span>
              <span className="text-xs text-slate-300">Total:</span>
              <span className="text-sm font-bold font-mono text-white">
                {fmt(calculations.grandTotal)}
              </span>
            </div>
            <span className="text-xs font-semibold text-amber-300 flex items-center gap-1">
              Checkout & Rx →
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
