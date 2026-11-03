// Generate order-wise, sequential and strictly non-repeating SKU code
export const generateNextSequentialSku = (existingProducts: Product[]): string => {
  const existingSkus = new Set(existingProducts.map((p) => p.sku.trim().toUpperCase()));
  const optNums = existingProducts
    .map((p) => {
      const match = p.sku.match(/^OPT-(\d+)$/i);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter((n): n is number => n !== null);

  // Continue sequentially from max existing OPT- number, or start from 101
  let nextNum = optNums.length > 0 ? Math.max(...optNums) + 1 : 101;
  while (existingSkus.has(`OPT-${nextNum}`)) {
    nextNum++;
  }
  return `OPT-${nextNum}`;
};

import React, { useState, useMemo } from 'react';
import { Search, Plus, Edit3, Trash2, X, AlertTriangle, Glasses } from 'lucide-react';
import { Product, EyewearCategory, StoreSettings } from '../types';

interface ProductsViewProps {
  products: Product[];
  settings: StoreSettings;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onAdjustStock: (productId: string, delta: number) => void;
  initialFilter?: 'all' | 'low';
}


export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  settings,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAdjustStock,
  initialFilter = 'all',
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<EyewearCategory | 'All'>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low'>(initialFilter);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  React.useEffect(() => {
    if (!editingProduct) {
      setGstRate(String(settings.defaultGstRate || 12));
    }
  }, [settings.defaultGstRate, editingProduct]);

  // Form states
  const [sku, setSku] = useState('');
  const [skuError, setSkuError] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<EyewearCategory>('Sunglasses');
  const [frameMaterial, setFrameMaterial] = useState('');
  const [frameShape, setFrameShape] = useState('');
  const [lensFeature, setLensFeature] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [gstRate, setGstRate] = useState(String(settings.defaultGstRate || 12));
  const [stock, setStock] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');
  const [hsnCode, setHsnCode] = useState('90041000');

  // Power Glasses Left & Right Eye power states
  const [rightSph, setRightSph] = useState('');
  const [rightCyl, setRightCyl] = useState('');
  const [rightAxis, setRightAxis] = useState('');
  const [rightAdd, setRightAdd] = useState('');
  const [leftSph, setLeftSph] = useState('');
  const [leftCyl, setLeftCyl] = useState('');
  const [leftAxis, setLeftAxis] = useState('');
  const [leftAdd, setLeftAdd] = useState('');

  const openAddModal = () => {
    setEditingProduct(null);
    setSku(generateNextSequentialSku(products));
    setSkuError('');
    setName('');
    setBrand('');
    const initialCategory: EyewearCategory = categoryFilter !== 'All' ? categoryFilter : 'Power Glasses';
    setCategory(initialCategory);
    setFrameMaterial('');
    setFrameShape('');
    setLensFeature('');
    setPrice('');
    setCostPrice('');
    setGstRate(String(settings.defaultGstRate || 12));
    setStock('');
    setReorderLevel(String(settings.defaultLowStockThreshold || 5));
    setHsnCode(initialCategory === 'Power Glasses' ? '90031100' : '90041000');
    setRightSph('');
    setRightCyl('');
    setRightAxis('');
    setRightAdd('');
    setLeftSph('');
    setLeftCyl('');
    setLeftAxis('');
    setLeftAdd('');
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setSku(product.sku);
    setSkuError('');
    setName(product.name);
    setBrand(product.brand);
    setCategory(product.category);
    setFrameMaterial(product.frameMaterial);
    setFrameShape(product.frameShape);
    setLensFeature(product.lensFeature);
    setPrice(String(product.price));
    setCostPrice(String(product.costPrice));
    setGstRate(String(product.gstRate));
    setStock(String(product.stock));
    setReorderLevel(String(product.reorderLevel));
    setHsnCode(product.hsnCode);
    setRightSph(product.rightEyePower?.sph || '');
    setRightCyl(product.rightEyePower?.cyl || '');
    setRightAxis(product.rightEyePower?.axis || '');
    setRightAdd(product.rightEyePower?.add || '');
    setLeftSph(product.leftEyePower?.sph || '');
    setLeftCyl(product.leftEyePower?.cyl || '');
    setLeftAxis(product.leftEyePower?.axis || '');
    setLeftAdd(product.leftEyePower?.add || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) return;

    const isPowerGlasses = category === 'Power Glasses';
    const hasPowerValues = Boolean(
      rightSph.trim() ||
      rightCyl.trim() ||
      rightAxis.trim() ||
      rightAdd.trim() ||
      leftSph.trim() ||
      leftCyl.trim() ||
      leftAxis.trim() ||
      leftAdd.trim()
    );

    const payload: Omit<Product, 'id'> = {
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      brand: brand.trim() || 'House Brand',
      category,
      frameMaterial: frameMaterial.trim() || 'Acetate',
      frameShape: frameShape.trim() || 'Standard',
      lensFeature: lensFeature.trim() || (isPowerGlasses ? 'Single Vision Anti-Glare' : 'Polarized UV400'),
      price: Math.max(0, Number(price) || 0),
      costPrice: Math.max(0, Number(costPrice) || 0),
      gstRate: Number(gstRate) || settings.defaultGstRate || 12,
      stock: Math.max(0, Number(stock) || 0),
      reorderLevel: editingProduct ? (editingProduct.reorderLevel || settings.defaultLowStockThreshold || 5) : (settings.defaultLowStockThreshold || 5),
      hsnCode: hsnCode.trim() || (isPowerGlasses ? '90031100' : '90041000'),
      imageUrl: '',
      isUserAdded: true,
      ...(isPowerGlasses && hasPowerValues
        ? {
            rightEyePower: {
              sph: rightSph.trim() || '0.00',
              cyl: rightCyl.trim() || '0.00',
              axis: rightAxis.trim() || '180',
              add: rightAdd.trim() || '+0.00',
            },
            leftEyePower: {
              sph: leftSph.trim() || '0.00',
              cyl: leftCyl.trim() || '0.00',
              axis: leftAxis.trim() || '180',
              add: leftAdd.trim() || '+0.00',
            },
          }
        : {}),
    };

    if (editingProduct) {
      onUpdateProduct({ ...payload, id: editingProduct.id, isUserAdded: true });
    } else {
      onAddProduct(payload);
    }
    setIsModalOpen(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
      const matchesLow = stockFilter === 'all' || p.stock <= (settings.defaultLowStockThreshold || 5);
      const q = search.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.lensFeature.toLowerCase().includes(q);
      return matchesCat && matchesLow && matchesQuery;
    });
  }, [products, categoryFilter, stockFilter, search]);

  const lowStockThreshold = settings.defaultLowStockThreshold || 5;
  const isProductLowStock = (p: Product) => p.stock <= lowStockThreshold;
  const lowStockCount = products.filter(isProductLowStock).length;

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
            Eyewear Catalog & Stock Inventory
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage sunglasses, cooling glasses, power frames, and optical lenses
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add New Eyewear Model
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU, model name, brand, or lens feature..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {(
              [
                'All',
                'Sunglasses',
                'Cooling Glasses',
                'Power Glasses',
                'Lenses & Care',
              ] as const
            ).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          
        </div>
      </div>

      {/* High-Density Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50/70">
                <th className="py-3.5 px-4">Product / SKU</th>
                <th className="py-3.5 px-4">Category & Material</th>
                <th className="py-3.5 px-4">Lens Specification</th>
                <th className="py-3.5 px-4 text-right">Retail Price</th>
                <th className="py-3.5 px-4 text-right">GST / HSN</th>
                <th className="py-3.5 px-4 text-center">Stock Level</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 text-xs">
                    <Glasses className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No eyewear products found in catalog. Click &quot;Add New Eyewear Model&quot; to add your first product.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isCritical = isProductLowStock(product);
                return (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                          <Glasses className="w-5 h-5 stroke-[1.5]" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            <span>{product.name}</span>
                            {isOutOfStock ? (
                              <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                OUT OF STOCK
                              </span>
                            ) : isCritical ? (
                              <span className="text-[10px] font-mono font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                REORDER (≤{lowStockThreshold})
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {product.sku} · {product.brand}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{product.category}</div>
                      <div className="text-xs text-slate-500">
                        {product.frameMaterial} · {product.frameShape}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {product.lensFeature}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-semibold text-slate-900">{fmt(product.price)}</div>
                      <div className="text-xs text-slate-400">Cost: {fmt(product.costPrice)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-600">
                      <div>{product.gstRate}% GST</div>
                      <div className="text-slate-400">HSN {product.hsnCode}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onAdjustStock(product.id, -1)}
                            className="w-7 h-7 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 font-mono text-xs cursor-pointer"
                          >
                            -
                          </button>
                          <span
                            className={`font-mono font-bold text-sm min-w-[34px] text-center ${
                              isOutOfStock
                                ? 'text-rose-600'
                                : isCritical
                                ? 'text-amber-700'
                                : 'text-slate-900'
                            }`}
                          >
                            {product.stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => onAdjustStock(product.id, 1)}
                            className="w-7 h-7 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 font-mono text-xs cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Alert at: ≤{lowStockThreshold} units
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit Eyewear Details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(product.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full overflow-hidden shadow-xl my-2 sm:my-8 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white shrink-0">
              <h2 className="text-base font-semibold">
                {editingProduct ? 'Edit Eyewear Product' : 'Add New Eyewear Model'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const newCat = e.target.value as EyewearCategory;
                      setCategory(newCat);
                      if (newCat === 'Power Glasses') {
                        if (!hsnCode || hsnCode === '90041000') setHsnCode('90031100');
                        if (!lensFeature || lensFeature === 'Polarized UV400') setLensFeature('Single Vision Anti-Glare');
                      }
                    }}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="Sunglasses">Sunglasses</option>
                    <option value="Cooling Glasses">Cooling Glasses</option>
                    <option value="Power Glasses">Power Glasses</option>
                    <option value="Lenses & Care">Lenses & Care</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Power Glasses Eye Power Input Block (Right & Left Eye) */}
              {category === 'Power Glasses' && (
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-3.5 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Glasses className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                          Power Glasses Lens Prescription (Left & Right Eye Power)
                        </h4>
                        
                      </div>
                    </div>

                    {/* Copy OD to OS Helper */}
                    <button
                      type="button"
                      onClick={() => {
                        setLeftSph(rightSph);
                        setLeftCyl(rightCyl);
                        setLeftAxis(rightAxis);
                        setLeftAdd(rightAdd);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:text-blue-950 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-md transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                      title="Copy Right Eye power values to Left Eye"
                    >
                      Copy Right (OD) → Left (OS)
                    </button>
                  </div>

                  <div className="flex flex-col gap-3.5">
                    {/* Right Eye (OD) Input Card */}
                    <div className="bg-white p-3 rounded-lg border border-blue-200/70 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between border-b border-blue-100 pb-1.5">
                        <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                          Right Eye (OD - Oculus Dexter)
                        </span>
                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          OD (Right Eye) 
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            SPH (Power)
                          </label>
                          <input
                            type="text"
                            value={rightSph}
                            onChange={(e) => setRightSph(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            CYL (Cylindrical)
                          </label>
                          <input
                            type="text"
                            value={rightCyl}
                            onChange={(e) => setRightCyl(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            AXIS (1-180°)
                          </label>
                          <input
                            type="text"
                            value={rightAxis}
                            onChange={(e) => setRightAxis(e.target.value)}
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            ADD (Near)
                          </label>
                          <input
                            type="text"
                            value={rightAdd}
                            onChange={(e) => setRightAdd(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Left Eye (OS) Input Card */}
                    <div className="bg-white p-3 rounded-lg border border-indigo-200/70 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5">
                        <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          Left Eye (OS - Oculus Sinister)
                        </span>
                        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          OS (Left Eye) 
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            SPH (Power)
                          </label>
                          <input
                            type="text"
                            value={leftSph}
                            onChange={(e) => setLeftSph(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-indigo-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            CYL (Cylindrical)
                          </label>
                          <input
                            type="text"
                            value={leftCyl}
                            onChange={(e) => setLeftCyl(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-indigo-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            AXIS (1-180°)
                          </label>
                          <input
                            type="text"
                            value={leftAxis}
                            onChange={(e) => setLeftAxis(e.target.value)}
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-indigo-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            ADD (Near)
                          </label>
                          <input
                            type="text"
                            value={leftAdd}
                            onChange={(e) => setLeftAdd(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-indigo-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Classic Polarized Aviator"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. RayOptic"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Frame Material
                  </label>
                  <input
                    type="text"
                    value={frameMaterial}
                    onChange={(e) => setFrameMaterial(e.target.value)}
                    placeholder="e.g. Acetate & Alloy"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Frame Shape
                  </label>
                  <input
                    type="text"
                    value={frameShape}
                    onChange={(e) => setFrameShape(e.target.value)}
                    placeholder="e.g. Rectangular"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Lens Specification
                  </label>
                  <input
                    type="text"
                    value={lensFeature}
                    onChange={(e) => setLensFeature(e.target.value)}
                    placeholder="e.g. Single Vision Anti-Glare"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Retail Price ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 2800"
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Cost Price ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="e.g. 1450"
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
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
                  {editingProduct ? 'Save Changes' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
