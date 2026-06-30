import { useState, useEffect } from 'react';
import { apiService } from '../../lib/api';
import { Product, Warehouse } from '../../types';
import { Card, Button, Badge, Modal, Input, Select, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableCell } from '../common/StatusBadge';
import { Plus, Search, Edit, Package, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

const categoryLabels: Record<string, string> = {
  fast_moving: 'Fast Moving',
  slow_moving: 'Slow Moving',
  seasonal: 'Seasonal',
  regular: 'Regular',
};

const categoryColors: Record<string, string> = {
  fast_moving: 'bg-emerald-100 text-emerald-700',
  slow_moving: 'bg-amber-100 text-amber-700',
  seasonal: 'bg-blue-100 text-blue-700',
  regular: 'bg-slate-100 text-slate-700',
};

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const trimmedSearch = searchQuery.trim();
      const params: any = { page: 1, limit: 100 };
      if (trimmedSearch) params.search = trimmedSearch;
      if (filterCategory) params.category = filterCategory;

      console.log('📤 Fetching products with params:', params);

      const response = await apiService.getProducts(params);
      console.log('📦 Raw products response:', response);

      const pagination = response?.pagination || response?.data || null;
      setPaginationInfo(pagination);
      if (pagination && typeof pagination.totalElements !== 'undefined') {
        console.log(`📊 Backend totalElements: ${pagination.totalElements}`);
      }

      let data = null;
      const root = response || {};

      if (Array.isArray(root)) {
        data = root;
      } else if (root.data) {
        if (Array.isArray(root.data)) {
          data = root.data;
        } else if (typeof root.data === 'object') {
          const nested = root.data;
          console.log('🔍 Nested data object keys:', Object.keys(nested));
          const possibleKeys = ['content', 'items', 'results', 'products', 'list', 'records', 'rows'];
          for (const key of possibleKeys) {
            if (Array.isArray(nested[key])) {
              data = nested[key];
              console.log(`✅ Found array in response.data.${key} (length: ${data.length})`);
              break;
            }
          }
          if (!data && Array.isArray(nested)) {
            data = nested;
          }
        }
      } else {
        const topKeys = ['content', 'items', 'results', 'products', 'list', 'records', 'rows'];
        for (const key of topKeys) {
          if (Array.isArray(root[key])) {
            data = root[key];
            console.log(`✅ Found array in response.${key} (length: ${data.length})`);
            break;
          }
        }
      }

      if (!data) {
        console.warn('⚠️ No array found – using empty array.');
        data = [];
      }

      if (Array.isArray(data)) {
        setProducts(data);
        if (data.length > 0) {
          console.log('🔍 First product sample:', data[0]);
          const sample = data[0];
          console.log('📊 Price fields:', {
            unit_price: sample.unit_price,
            unitPrice: sample.unitPrice,
            price: sample.price,
            cost_price: sample.cost_price,
            costPrice: sample.costPrice,
          });
          console.log('📊 GST fields:', {
            gst_percentage: sample.gst_percentage,
            gstPercentage: sample.gstPercentage,
            gst: sample.gst,
            tax_percentage: sample.tax_percentage,
            taxPercentage: sample.taxPercentage,
          });
        }
      } else {
        console.error('❌ Extracted data is not an array:', data);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
    setIsLoading(false);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterCategory('');
    setTimeout(() => fetchProducts(), 0);
  };

  const getUnitPrice = (product: any): number => {
    const price = product.unit_price ?? product.unitPrice ?? product.price ?? product.cost_price ?? product.costPrice;
    return price != null ? Number(price) : 0;
  };

  const getGstPercentage = (product: any): number => {
    const gst = product.gst_percentage ?? product.gstPercentage ?? product.gst ?? product.tax_percentage ?? product.taxPercentage;
    return gst != null ? Number(gst) : 0;
  };

  const filteredProducts = products.filter((p) => {
    if (!p) return false;
    const searchLower = searchQuery.toLowerCase().trim();
    const name = (p.name || '').toLowerCase();
    const code = (p.product_code || '').toLowerCase();
    const matchesSearch = !searchLower || name.includes(searchLower) || code.includes(searchLower);
    const matchesFilter = !filterCategory || p.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (amount: number) => {
    return `E ${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(amount || 0)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalElements = paginationInfo?.totalElements ?? products.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-500 mt-1">Manage your product catalog</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {paginationInfo && (
        <div className="text-sm text-slate-500 bg-slate-50 p-2 rounded">
          Total products in database: <strong>{totalElements}</strong>
          {totalElements > 0 && products.length === 0 && (
            <span className="text-amber-600 ml-2">
              (But none loaded – check your search/filters)
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Products</p>
              <p className="text-2xl font-bold text-slate-900">{products.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Fast Moving</p>
              <p className="text-2xl font-bold text-emerald-600">
                {products.filter(p => p.category === 'fast_moving').length}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Slow Moving</p>
              <p className="text-2xl font-bold text-amber-600">
                {products.filter(p => p.category === 'slow_moving').length}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <TrendingDown className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Seasonal</p>
              <p className="text-2xl font-bold text-blue-600">
                {products.filter(p => p.category === 'seasonal').length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-48 rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Categories</option>
            <option value="fast_moving">Fast Moving</option>
            <option value="slow_moving">Slow Moving</option>
            <option value="seasonal">Seasonal</option>
            <option value="regular">Regular</option>
          </select>
          <Button variant="outline" onClick={resetFilters} className="whitespace-nowrap">
            Reset Filters
          </Button>
        </div>

        {filteredProducts.length === 0 ? (
          <EmptyState
            message={
              totalElements > 0 && products.length === 0
                ? "Your search or filter is too restrictive – try resetting filters."
                : "No products found."
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Product</TableCell>
                <TableCell header>Category</TableCell>
                <TableCell header>Unit Price</TableCell>
                <TableCell header>GST %</TableCell>
                <TableCell header>EOQ</TableCell>
                <TableCell header>Reorder Level</TableCell>
                <TableCell header>Status</TableCell>
                <TableCell header>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const unitPrice = getUnitPrice(product);
                const gst = getGstPercentage(product);
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{product.name}</p>
                          <p className="text-sm text-slate-500">{product.product_code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors[product.category]}`}>
                        {categoryLabels[product.category]}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(unitPrice)}</TableCell>
                    <TableCell>{gst}%</TableCell>
                    <TableCell>{product.eoq}</TableCell>
                    <TableCell>{product.reorder_level}</TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? 'success' : 'danger'}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchProducts();
        }}
      />

      <EditProductModal
        product={selectedProduct}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProduct(null);
        }}
        onSuccess={() => {
          setShowEditModal(false);
          fetchProducts();
        }}
      />
    </div>
  );
}

// ========== Add Product Modal (sends both camelCase & snake_case) ==========
function AddProductModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'regular',
    unit: 'PCS',
    unit_price: 0,
    cost_price: 0,
    gst_percentage: 18,
    reorder_level: 100,
    eoq: 500,
    weight_kg: 0,
  });
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [initialQuantity, setInitialQuantity] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      apiService.getWarehouses()
        .then(res => {
          const data = res.data?.data || res.data?.content || res.data || [];
          setWarehouses(Array.isArray(data) ? data : []);
        })
        .catch(err => console.error('Failed to fetch warehouses:', err));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Product Name is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const productCode = `PRD-${Date.now().toString(36).toUpperCase()}`;
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        unit: formData.unit,
        eoq: formData.eoq,

        unit_price: formData.unit_price,
        unitPrice: formData.unit_price,
        cost_price: formData.cost_price,
        costPrice: formData.cost_price,

        gst_percentage: formData.gst_percentage,
        gstPercentage: formData.gst_percentage,

        reorder_level: formData.reorder_level,
        reorderLevel: formData.reorder_level,

        weight_kg: formData.weight_kg,
        weightKg: formData.weight_kg,

        product_code: productCode,
        productCode: productCode,
        warehouse_id: selectedWarehouse || undefined,
        warehouseId: selectedWarehouse || undefined,
        initial_quantity: initialQuantity || 0,
        initialQuantity: initialQuantity || 0,
      };
      console.log('📤 Creating product with payload:', payload);
      await apiService.createProduct(payload);

      setSuccessMessage('✅ Product created successfully!');

      setTimeout(() => {
        onSuccess();
        onClose();
        setFormData({
          name: '',
          description: '',
          category: 'regular',
          unit: 'PCS',
          unit_price: 0,
          cost_price: 0,
          gst_percentage: 18,
          reorder_level: 100,
          eoq: 500,
          weight_kg: 0,
        });
        setSelectedWarehouse('');
        setInitialQuantity(0);
        setSuccessMessage('');
      }, 1500);
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || 'Failed to create product. Please try again.';
      setErrorMessage(message);
      console.error('Error adding product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Product" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            <AlertTriangle className="w-4 h-4" />
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 border border-green-200">
            <CheckCircle className="w-4 h-4" />
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input label="Product Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <Select label="Category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} options={[{ value: 'fast_moving', label: 'Fast Moving' }, { value: 'slow_moving', label: 'Slow Moving' }, { value: 'seasonal', label: 'Seasonal' }, { value: 'regular', label: 'Regular' }]} />
        </div>

        <Input label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />

        <div className="grid grid-cols-4 gap-4">
          <Input label="Unit" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="PCS, KG, LTR" />
          <Input label="Unit Price" type="number" value={formData.unit_price} onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })} required />
          <Input label="Cost Price" type="number" value={formData.cost_price} onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })} />
          <Input label="GST %" type="number" value={formData.gst_percentage} onChange={(e) => setFormData({ ...formData, gst_percentage: Number(e.target.value) })} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input label="Reorder Level" type="number" value={formData.reorder_level} onChange={(e) => setFormData({ ...formData, reorder_level: Number(e.target.value) })} helpText="Minimum stock before reorder" />
          <Input label="Economic Order Qty" type="number" value={formData.eoq} onChange={(e) => setFormData({ ...formData, eoq: Number(e.target.value) })} helpText="Optimal order quantity" />
          <Input label="Weight (KG)" type="number" step="0.01" value={formData.weight_kg} onChange={(e) => setFormData({ ...formData, weight_kg: Number(e.target.value) })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select label="Warehouse (optional)" value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)} options={warehouses.map(w => ({ value: w.id, label: w.name }))} placeholder="Select warehouse" />
          <Input label="Initial Quantity" type="number" value={initialQuantity} onChange={(e) => setInitialQuantity(Number(e.target.value))} min={0} helpText="If not set, stock will be 0" />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>Add Product</Button>
        </div>
      </form>
    </Modal>
  );
}

// ========== Edit Product Modal (sends both camelCase & snake_case) ==========
function EditProductModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData(product);
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setIsSubmitting(true);

    try {
      // Build update payload with both snake_case and camelCase
      const payload: any = {};

      // Copy all fields from formData, but ensure we send both variants for numeric fields
      const keys = ['name', 'description', 'category', 'unit', 'eoq', 
                    'unit_price', 'unitPrice', 'cost_price', 'costPrice',
                    'gst_percentage', 'gstPercentage', 'reorder_level', 'reorderLevel',
                    'weight_kg', 'weightKg', 'is_active'];
      for (const key of keys) {
        if (formData[key] !== undefined && formData[key] !== null) {
          payload[key] = formData[key];
        }
      }

      // Also ensure both variants are present for price, GST, etc.
      if (formData.unit_price !== undefined) {
        payload.unitPrice = formData.unit_price;
      }
      if (formData.cost_price !== undefined) {
        payload.costPrice = formData.cost_price;
      }
      if (formData.gst_percentage !== undefined) {
        payload.gstPercentage = formData.gst_percentage;
      }
      if (formData.reorder_level !== undefined) {
        payload.reorderLevel = formData.reorder_level;
      }
      if (formData.weight_kg !== undefined) {
        payload.weightKg = formData.weight_kg;
      }

      console.log('📤 Updating product with payload:', payload);
      await apiService.updateProduct(product.id, payload);
      onSuccess();
    } catch (error) {
      console.error('Error updating product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Product" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Product Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <Select label="Category" value={formData.category || 'regular'} onChange={(e) => setFormData({ ...formData, category: e.target.value })} options={[{ value: 'fast_moving', label: 'Fast Moving' }, { value: 'slow_moving', label: 'Slow Moving' }, { value: 'seasonal', label: 'Seasonal' }, { value: 'regular', label: 'Regular' }]} />
        </div>

        <Input label="Description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />

        <div className="grid grid-cols-4 gap-4">
          <Input label="Unit" value={formData.unit || ''} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
          <Input label="Unit Price" type="number" value={formData.unit_price || 0} onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })} />
          <Input label="Cost Price" type="number" value={formData.cost_price || 0} onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })} />
          <Input label="GST %" type="number" value={formData.gst_percentage || 0} onChange={(e) => setFormData({ ...formData, gst_percentage: Number(e.target.value) })} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input label="Reorder Level" type="number" value={formData.reorder_level || 0} onChange={(e) => setFormData({ ...formData, reorder_level: Number(e.target.value) })} />
          <Input label="EOQ" type="number" value={formData.eoq || 0} onChange={(e) => setFormData({ ...formData, eoq: Number(e.target.value) })} />
          <Input label="Weight (KG)" type="number" step="0.01" value={formData.weight_kg || 0} onChange={(e) => setFormData({ ...formData, weight_kg: Number(e.target.value) })} />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_active" checked={formData.is_active ?? true} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="rounded border-slate-300" />
          <label htmlFor="is_active" className="text-sm text-slate-700">Product is active</label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}