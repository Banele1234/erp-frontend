import { useState, useEffect, useRef } from 'react';
import { apiService } from '../../lib/api';
import { Inventory, Warehouse, MovementType, Product } from '../../types';
import { Card, Button, Badge, Modal, Input, Select, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableCell } from '../common/StatusBadge';
import { Plus, Search, Package, Warehouse as WarehouseIcon, ArrowUp, ArrowDown, ArrowRight, AlertTriangle, X, RefreshCw, CheckCircle } from 'lucide-react';

export default function InventoryManagement() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [invRes, whRes] = await Promise.all([
        apiService.getInventory({ page: 1, limit: 200 }),
        apiService.getWarehouses(),
      ]);

      console.log('📦 Raw inventory response:', invRes);
      console.log('📦 Raw warehouses response:', whRes);

      // ---- Exhaustive extraction for inventory ----
      let invData = null;
      const invRoot = invRes || {};
      if (Array.isArray(invRoot)) {
        invData = invRoot;
      } else if (invRoot.data) {
        if (Array.isArray(invRoot.data)) {
          invData = invRoot.data;
        } else if (typeof invRoot.data === 'object') {
          const nested = invRoot.data;
          console.log('🔍 Nested inventory object keys:', Object.keys(nested));
          const possibleKeys = ['content', 'items', 'results', 'data', 'list', 'records', 'rows', 'inventory'];
          for (const key of possibleKeys) {
            if (Array.isArray(nested[key])) {
              invData = nested[key];
              console.log(`✅ Found inventory in response.data.${key} (length: ${invData.length})`);
              break;
            }
          }
          if (nested.totalElements !== undefined) {
            setPaginationInfo(nested);
          }
          if (!invData && Array.isArray(nested)) {
            invData = nested;
          }
        }
      } else {
        const topKeys = ['content', 'items', 'results', 'data', 'list', 'records', 'rows', 'inventory'];
        for (const key of topKeys) {
          if (Array.isArray(invRoot[key])) {
            invData = invRoot[key];
            console.log(`✅ Found inventory in response.${key} (length: ${invData.length})`);
            break;
          }
        }
      }
      // Fallback for response.data.content
      if (!invData && invRes?.data?.content) {
        invData = invRes.data.content;
        console.log(`✅ Fallback: found inventory in response.data.content (length: ${invData.length})`);
        if (invRes.data.totalElements !== undefined) {
          setPaginationInfo(invRes.data);
        }
      }
      if (!invData) {
        console.warn('⚠️ No inventory array found – using empty array.');
        invData = [];
      }

      // ---- Exhaustive extraction for warehouses ----
      let whData = null;
      const whRoot = whRes || {};
      if (Array.isArray(whRoot)) {
        whData = whRoot;
      } else if (whRoot.data) {
        if (Array.isArray(whRoot.data)) {
          whData = whRoot.data;
        } else if (typeof whRoot.data === 'object') {
          const nested = whRoot.data;
          const possibleKeys = ['content', 'items', 'results', 'data', 'list', 'records', 'rows'];
          for (const key of possibleKeys) {
            if (Array.isArray(nested[key])) {
              whData = nested[key];
              console.log(`✅ Found warehouses in response.data.${key} (length: ${whData.length})`);
              break;
            }
          }
          if (!whData && Array.isArray(nested)) {
            whData = nested;
          }
        }
      } else {
        const topKeys = ['content', 'items', 'results', 'data', 'list', 'records', 'rows'];
        for (const key of topKeys) {
          if (Array.isArray(whRoot[key])) {
            whData = whRoot[key];
            console.log(`✅ Found warehouses in response.${key} (length: ${whData.length})`);
            break;
          }
        }
      }
      if (!whData) {
        whData = [];
      }

      console.log('✅ Final inventory data:', invData);
      console.log('✅ Final warehouses data:', whData);

      setInventory(Array.isArray(invData) ? invData : []);
      setWarehouses(Array.isArray(whData) ? whData : []);
    } catch (error) {
      console.error('❌ Error fetching inventory:', error);
      setInventory([]);
      setWarehouses([]);
    }
    setIsLoading(false);
  };

  // ---- Robust filtering ----
  const filteredInventory = inventory.filter((inv) => {
    if (!inv) return false;
    const searchLower = searchQuery.toLowerCase().trim();
    const productName = (inv.product?.name || '').toLowerCase();
    const productCode = (inv.product?.product_code || '').toLowerCase();
    const matchesSearch = productName.includes(searchLower) || productCode.includes(searchLower);

    let matchesWarehouse = true;
    if (filterWarehouse) {
      const invWarehouseId = inv.warehouse_id ?? inv.warehouseId ?? inv.warehouse?.id;
      matchesWarehouse = invWarehouseId === filterWarehouse;
    }
    return matchesSearch && matchesWarehouse;
  });

  const formatCurrency = (amount: number) => {
    return `E ${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(amount || 0)}`;
  };

  const getStockStatus = (item: Inventory) => {
    const reorderLevel = item.product?.reorder_level || 100;
    if (item.available_quantity === 0) return { label: 'Out of Stock', color: 'danger' };
    if (item.available_quantity < reorderLevel) return { label: 'Low Stock', color: 'warning' };
    return { label: 'In Stock', color: 'success' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalElements = paginationInfo?.totalElements ?? inventory.length;
  const lowStockCount = inventory.filter(i =>
    i.available_quantity < (i.product?.reorder_level || 100)
  ).length;
  const outOfStockCount = inventory.filter(i => i.available_quantity === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-500 mt-1">Track and manage stock levels across warehouses</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAdjustModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adjust Inventory
          </Button>
        </div>
      </div>

      {paginationInfo && (
        <div className="text-sm text-slate-500 bg-slate-50 p-2 rounded">
          Total inventory records: <strong>{totalElements}</strong>
          {totalElements > 0 && inventory.length === 0 && (
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
              <p className="text-sm text-slate-500">Total SKUs</p>
              <p className="text-2xl font-bold text-slate-900">{inventory.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Warehouses</p>
              <p className="text-2xl font-bold text-slate-900">{warehouses.length}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <WarehouseIcon className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Low Stock Items</p>
              <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <Package className="w-6 h-6 text-red-600" />
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
            value={filterWarehouse}
            onChange={(e) => setFilterWarehouse(e.target.value)}
            className="w-48 rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Warehouses</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <Button variant="outline" onClick={() => {
            setSearchQuery('');
            setFilterWarehouse('');
            fetchData();
          }} className="whitespace-nowrap">
            Reset Filters
          </Button>
        </div>

        {filteredInventory.length === 0 ? (
          <EmptyState
            message={
              totalElements > 0 && inventory.length === 0
                ? "Your search or filter is too restrictive – try resetting filters."
                : "No inventory items found."
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Product</TableCell>
                <TableCell header>Warehouse</TableCell>
                <TableCell header>On Hand</TableCell>
                <TableCell header>Reserved</TableCell>
                <TableCell header>Available</TableCell>
                <TableCell header>Unit Price</TableCell>
                <TableCell header>Value</TableCell>
                <TableCell header>Status</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => {
                const status = getStockStatus(item);
                const unitPrice = item.product?.unit_price ?? 0;
                const value = (item.quantity || 0) * unitPrice;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{item.product?.name || 'Unknown'}</p>
                          <p className="text-sm text-slate-500">{item.product?.product_code || ''}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <WarehouseIcon className="w-4 h-4 text-slate-400" />
                        <span>{item.warehouse?.name || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.quantity}</TableCell>
                    <TableCell className="text-amber-600">{item.reserved_quantity}</TableCell>
                    <TableCell className="font-semibold text-emerald-600">{item.available_quantity}</TableCell>
                    <TableCell>{formatCurrency(unitPrice)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(value)}</TableCell>
                    <TableCell>
                      <Badge variant={status.color as any}>{status.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <AdjustInventoryModal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        warehouses={warehouses}
        onSuccess={() => {
          setShowAdjustModal(false);
          fetchData();
        }}
      />
    </div>
  );
}

// ========== Adjust Inventory Modal with improved error handling ==========
function AdjustInventoryModal({
  isOpen,
  onClose,
  warehouses,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  warehouses: Warehouse[];
  onSuccess: () => void;
}) {
  const [movementType, setMovementType] = useState<MovementType>('in');
  const [warehouseId, setWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Product search
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductLoading, setIsProductLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch products on search
  useEffect(() => {
    if (!productSearch.trim()) {
      setProducts([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsProductLoading(true);
      try {
        const res = await apiService.getProducts({ search: productSearch, limit: 50 });
        let data = res.data?.data || res.data?.content || res.data || [];
        if (!Array.isArray(data)) {
          data = [];
        }
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setIsProductLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductSearch(product.name);
    setShowDropdown(false);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (!selectedProduct) {
      setErrorMessage('Please select a product.');
      return;
    }
    if (!warehouseId) {
      setErrorMessage('Please select a warehouse.');
      return;
    }
    if (movementType === 'transfer' && !toWarehouseId) {
      setErrorMessage('Please select destination warehouse.');
      return;
    }
    if (quantity <= 0) {
      setErrorMessage('Quantity must be greater than zero.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        product_id: selectedProduct.id,
        warehouse_id: warehouseId,
        movement_type: movementType,
        quantity: quantity,
        notes: notes,
      };
      if (movementType === 'transfer') {
        payload.to_warehouse_id = toWarehouseId;
      }
      console.log('📤 Adjusting inventory with payload:', payload);
      await apiService.adjustInventory(payload);

      setSuccessMessage('✅ Inventory adjusted successfully!');
      setTimeout(() => {
        onSuccess();
        // Reset form
        setMovementType('in');
        setWarehouseId('');
        setToWarehouseId('');
        setQuantity(1);
        setNotes('');
        setProductSearch('');
        setSelectedProduct(null);
        setProducts([]);
        setShowDropdown(false);
        setSuccessMessage('');
        setErrorMessage('');
        onClose();
      }, 1500);
    } catch (error: any) {
      let msg = 'Failed to adjust inventory. Please try again.';
      if (error.status === 403) {
        msg = 'You do not have permission to adjust inventory. Please contact your administrator.';
      } else if (error.status === 404) {
        msg = 'Product or warehouse not found. Please check your selection.';
      } else if (error.message) {
        msg = error.message;
      }
      setErrorMessage(msg);
      console.error('Adjust inventory error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMovementType('in');
    setWarehouseId('');
    setToWarehouseId('');
    setQuantity(1);
    setNotes('');
    setProductSearch('');
    setSelectedProduct(null);
    setProducts([]);
    setShowDropdown(false);
    setSuccessMessage('');
    setErrorMessage('');
    onClose();
  };

  const getUnitPrice = (product: any): number => {
    return product.unit_price ?? product.unitPrice ?? product.price ?? 0;
  };

  const formatCurrency = (amount: number) => {
    return `E ${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(amount || 0)}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Adjust Inventory" size="md">
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

        <div className="flex gap-2 mb-4">
          {[
            { type: 'in', label: 'Stock In', icon: ArrowDown },
            { type: 'out', label: 'Stock Out', icon: ArrowUp },
            { type: 'transfer', label: 'Transfer', icon: ArrowRight },
          ].map((option) => (
            <button
              key={option.type}
              type="button"
              onClick={() => {
                setMovementType(option.type as MovementType);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                movementType === option.type
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <option.icon className="w-4 h-4" />
              {option.label}
            </button>
          ))}
        </div>

        <Select
          label="Warehouse"
          value={warehouseId}
          onChange={(e) => {
            setWarehouseId(e.target.value);
            if (movementType === 'transfer' && e.target.value === toWarehouseId) {
              setToWarehouseId('');
            }
            setErrorMessage('');
            setSuccessMessage('');
          }}
          options={warehouses.map(w => ({ value: w.id, label: w.name }))}
          placeholder="Select source warehouse"
          required
        />

        {movementType === 'transfer' && (
          <Select
            label="To Warehouse"
            value={toWarehouseId}
            onChange={(e) => {
              setToWarehouseId(e.target.value);
              setErrorMessage('');
              setSuccessMessage('');
            }}
            options={warehouses
              .filter(w => w.id !== warehouseId)
              .map(w => ({ value: w.id, label: w.name }))}
            placeholder="Select destination warehouse"
            required
          />
        )}

        <div className="relative" ref={dropdownRef}>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Product <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setShowDropdown(true);
                if (e.target.value === '') {
                  setSelectedProduct(null);
                }
                setErrorMessage('');
                setSuccessMessage('');
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search product by name or code..."
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {selectedProduct && (
              <button
                type="button"
                onClick={() => {
                  setSelectedProduct(null);
                  setProductSearch('');
                  setProducts([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {showDropdown && productSearch.trim() !== '' && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {isProductLoading ? (
                <div className="p-4 text-center text-slate-500">
                  <LoadingSpinner size="sm" />
                </div>
              ) : products.length === 0 ? (
                <div className="p-4 text-center text-slate-500">
                  No products found.
                </div>
              ) : (
                products.map((product) => {
                  const price = getUnitPrice(product);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelectProduct(product)}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors flex items-center gap-2 border-b border-slate-100 last:border-0"
                    >
                      <Package className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.product_code} – {formatCurrency(price)}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
          {selectedProduct && (
            <p className="text-xs text-emerald-600 mt-1">
              Selected: <strong>{selectedProduct.name}</strong> – {formatCurrency(getUnitPrice(selectedProduct))}
            </p>
          )}
        </div>

        <Input
          label="Quantity"
          type="number"
          value={quantity}
          onChange={(e) => {
            setQuantity(Number(e.target.value));
            setErrorMessage('');
            setSuccessMessage('');
          }}
          min={1}
          required
        />

        <Input
          label="Notes"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setErrorMessage('');
            setSuccessMessage('');
          }}
          placeholder="Optional notes"
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Confirm Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
}