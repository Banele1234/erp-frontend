import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Order, Customer, Product, Warehouse } from '../../types';
import { Card, Button, Badge, Modal, Input, Select, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableCell } from '../common/StatusBadge';
import {
  Plus,
  Search,
  Eye,
  ShoppingCart,
  Clock,
  CheckCircle,
  Truck,
  Factory,
  Package,
  X,
  Send,
} from 'lucide-react';

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_production: 'In Production',
  quality_check: 'Quality Check',
  ready_for_dispatch: 'Ready for Dispatch',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const statusColors: Record<string, string> = {
  pending: 'warning',
  confirmed: 'info',
  in_production: 'primary',
  quality_check: 'info',
  ready_for_dispatch: 'info',
  in_transit: 'primary',
  delivered: 'success',
  cancelled: 'danger',
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  confirmed: CheckCircle,
  in_production: Factory,
  quality_check: CheckCircle,
  ready_for_dispatch: Package,
  in_transit: Truck,
  delivered: CheckCircle,
  cancelled: X,
};

// ============================================================
// CREATE ORDER MODAL
// ============================================================
function CreateOrderModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user, customer } = useAuth();
  const isCustomer = user?.role === 'customer';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<Customer | null>(null);
  const [loadingCustomerDetails, setLoadingCustomerDetails] = useState(false);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productSearchRef = useRef<HTMLDivElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<
    { 
      product_id: string; 
      quantity: number; 
      product_name: string; 
    }[]
  >([]);

  const [formData, setFormData] = useState({
    customer_id: '',
    warehouse_id: '',
    notes: '',
    required_date: '',
    shipping_address: '',
    shipping_city: '',
    shipping_state: '',
    shipping_pincode: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && isCustomer && customer?.id) {
      setFormData(prev => ({ ...prev, customer_id: customer.id }));
    }
  }, [isOpen, isCustomer, customer]);

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
      fetchAllProducts();
    }
  }, [isOpen]);

  const fetchAllProducts = async () => {
    if (isProductsLoading) return;
    setIsProductsLoading(true);
    try {
      const response = await apiService.getProducts({ limit: 500 });
      console.log('📦 Products API raw response:', response);
      let products = Array.isArray(response) ? response : [];
      setAllProducts(products);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setAllProducts([]);
    } finally {
      setIsProductsLoading(false);
    }
  };

  const fetchInitialData = async () => {
    setError('');
    setLoadingCustomerDetails(false);
    try {
      const whRes = await apiService.getWarehouses();
      let whArray: any[] = [];
      if (Array.isArray(whRes)) whArray = whRes;
      else if (whRes?.data && Array.isArray(whRes.data)) whArray = whRes.data;
      else if (whRes?.data?.data && Array.isArray(whRes.data.data)) whArray = whRes.data.data;
      const activeWarehouses = whArray.filter((w: any) => {
        const isActive = w.isActive !== undefined ? w.isActive : w.is_active;
        return isActive !== false;
      });
      setWarehouses(activeWarehouses);

      if (isCustomer && customer?.id) {
        setLoadingCustomerDetails(true);
        try {
          const custRes = await apiService.getCustomer(customer.id);
          const custData = custRes.data?.data || custRes.data?.content || custRes.data || custRes;
          if (custData) setCustomerDetails(custData);
          else setCustomerDetails(customer as Customer);
        } catch (err) {
          console.warn('Failed to fetch customer details, using context fallback:', err);
          setCustomerDetails(customer as Customer);
        } finally {
          setLoadingCustomerDetails(false);
        }
        if (!formData.customer_id) {
          setFormData(prev => ({ ...prev, customer_id: customer.id }));
        }
      }

      if (!isCustomer) {
        setLoadingCustomers(true);
        const custRes = await apiService.getCustomers({ page: 1, limit: 200 });
        const custData = custRes.data?.data || custRes.data?.content || custRes.data || [];
        setCustomers(Array.isArray(custData) ? custData : []);
        setLoadingCustomers(false);
      }
    } catch (err: any) {
      console.error('❌ Error loading data:', err);
      setError(err.message || 'Failed to load data. Please refresh.');
    }
  };

  const filteredProducts = allProducts.filter(p => {
    const searchLower = productSearch.toLowerCase().trim();
    if (!searchLower) return false;
    const nameMatch = (p.name || '').toLowerCase().includes(searchLower);
    const codeMatch = (p.product_code || '').toLowerCase().includes(searchLower);
    const isAlreadyAdded = items.some(i => i.product_id === p.id);
    return (nameMatch || codeMatch) && !isAlreadyAdded;
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (productSearchRef.current && !productSearchRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getProductPrice = (product: Product): number => {
    return product?.unit_price ?? product?.unitPrice ?? product?.price ?? 0;
  };

  const handleSelectProduct = (product: Product) => {
    if (items.some(i => i.product_id === product.id)) {
      setError('Product already added.');
      return;
    }
    setItems([
      ...items,
      {
        product_id: product.id,
        quantity: 1,
        product_name: product.name,
      },
    ]);
    setProductSearch('');
    setShowProductDropdown(false);
    setError('');
    productInputRef.current?.focus();
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].quantity = Math.max(1, quantity);
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.customer_id) {
      setError('Please select a customer.');
      return;
    }
    if (!formData.warehouse_id) {
      setError('Please select a warehouse.');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one product.');
      return;
    }
    setIsSubmitting(true);

    try {
      const orderItems = items.map(item => ({
        productId: item.product_id,
        quantity: item.quantity,
      }));

      const orderData = {
        customerId: formData.customer_id,
        warehouseId: formData.warehouse_id,
        requiredDate: formData.required_date || undefined,
        notes: formData.notes || '',
        items: orderItems,
        shippingAddress: formData.shipping_address,
        shippingCity: formData.shipping_city,
        shippingState: formData.shipping_state,
        shippingPincode: formData.shipping_pincode,
      };

      console.log('📦 Sending order data:', orderData);

      await apiService.createOrder(orderData);

      onSuccess();
      setItems([]);
      setFormData({ 
        customer_id: '', 
        warehouse_id: '', 
        notes: '', 
        required_date: '',
        shipping_address: '',
        shipping_city: '',
        shipping_state: '',
        shipping_pincode: '',
      });
      setProductSearch('');
      setCustomerDetails(null);
      setAllProducts([]);
    } catch (error: any) {
      console.error('Error creating order:', error);
      const msg = error.response?.data?.error || 'Failed to create order. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = () => {
    setProductSearch('');
    if (allProducts.length === 0) fetchAllProducts();
    setShowProductDropdown(true);
    setTimeout(() => productInputRef.current?.focus(), 100);
  };

  const getCustomerDisplayName = (): string => {
    if (loadingCustomerDetails) return 'Loading...';
    const cust = customerDetails || customer;
    if (cust) {
      return cust.companyName || cust.company_name || cust.name || cust.fullName || cust.full_name || 'Your Company';
    }
    return 'Your Company';
  };

  const formatCurrency = (amount: number) => {
    return `E ${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(amount || 0)}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Order" size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Customer <span className="text-red-500">*</span>
            </label>
            {isCustomer ? (
              <>
                <input
                  type="text"
                  value={getCustomerDisplayName()}
                  disabled
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-600"
                />
                <input type="hidden" name="customer_id" value={formData.customer_id} />
              </>
            ) : (
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loadingCustomers}
              >
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName || c.company_name || c.name || c.fullName || c.full_name || 'N/A'}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Warehouse <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.warehouse_id}
              onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a warehouse</option>
              {warehouses.length === 0 && (
                <option value="" disabled>No warehouses available</option>
              )}
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name || w.warehouse_name || w.warehouseName || 'Unnamed Warehouse'}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Required Date"
            type="date"
            value={formData.required_date}
            onChange={(e) => setFormData({ ...formData, required_date: e.target.value })}
          />
        </div>

        {/* Shipping Address Fields */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Shipping Address"
            value={formData.shipping_address}
            onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
            placeholder="Street address"
          />
          <Input
            label="Shipping City"
            value={formData.shipping_city}
            onChange={(e) => setFormData({ ...formData, shipping_city: e.target.value })}
            placeholder="City"
          />
          <Input
            label="Shipping State"
            value={formData.shipping_state}
            onChange={(e) => setFormData({ ...formData, shipping_state: e.target.value })}
            placeholder="State/Province"
          />
          <Input
            label="Shipping Pincode"
            value={formData.shipping_pincode}
            onChange={(e) => setFormData({ ...formData, shipping_pincode: e.target.value })}
            placeholder="Postal Code"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-700">Order Items</h4>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </div>

          <div className="relative" ref={productSearchRef}>
            <input
              ref={productInputRef}
              type="text"
              value={productSearch}
              onChange={(e) => {
                const value = e.target.value;
                setProductSearch(value);
                if (value.trim() !== '') {
                  if (allProducts.length === 0) fetchAllProducts();
                  setShowProductDropdown(true);
                } else {
                  setShowProductDropdown(false);
                }
              }}
              onFocus={() => {
                if (allProducts.length === 0) fetchAllProducts();
                if (productSearch.trim() !== '') setShowProductDropdown(true);
              }}
              placeholder="Search product by name or code..."
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {showProductDropdown && productSearch.trim() !== '' && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {isProductsLoading ? (
                  <div className="p-4 text-center text-slate-500">Loading products...</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">
                    {productSearch.trim() ? 'No products found' : 'Type to search'}
                  </div>
                ) : (
                  filteredProducts.map((p) => {
                    const price = getProductPrice(p);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProduct(p)}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors flex items-center gap-2 border-b border-slate-100 last:border-0"
                      >
                        <Package className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.product_code} – {formatCurrency(price)}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-4 bg-slate-50 rounded-lg text-slate-500 text-sm">
              No items added yet. Start typing above to add products.
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => {
                const product = allProducts.find(p => p.id === item.product_id);
                const price = product ? getProductPrice(product) : 0;
                const lineTotal = price * item.quantity;
                return (
                  <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{item.product_name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">Unit Price: {formatCurrency(price)}</p>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(index, Number(e.target.value))}
                        min={1}
                      />
                    </div>
                    <div className="w-32 text-right">
                      <p className="text-sm text-slate-500">Line Total</p>
                      <p className="font-semibold">{formatCurrency(lineTotal)}</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Input
          label="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Order notes"
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create Order
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================
// SHIPPING ADDRESS MODAL (Customer)
// ============================================================
function ShippingAddressModal({ order, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    shippingAddress: order.shipping_address || '',
    shippingCity: order.shipping_city || '',
    shippingState: order.shipping_state || '',
    shippingPincode: order.shipping_pincode || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await apiService.updateShipping(order.id, {
        shippingAddress: formData.shippingAddress,
        shippingCity: formData.shippingCity,
        shippingState: formData.shippingState,
        shippingPincode: formData.shippingPincode,
      });
      onSuccess();
    } catch (err: any) {
      console.error('Failed to update shipping address:', err);
      setError(err.message || 'Failed to update address');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Update Shipping Address" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        <p className="text-sm text-slate-500 mb-2">
          Order: <span className="font-medium">{order.order_number}</span>
        </p>
        <Input
          label="Address"
          value={formData.shippingAddress}
          onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
          placeholder="Street address"
        />
        <Input
          label="City"
          value={formData.shippingCity}
          onChange={(e) => setFormData({ ...formData, shippingCity: e.target.value })}
          placeholder="City"
        />
        <Input
          label="State"
          value={formData.shippingState}
          onChange={(e) => setFormData({ ...formData, shippingState: e.target.value })}
          placeholder="State/Province"
        />
        <Input
          label="Pincode"
          value={formData.shippingPincode}
          onChange={(e) => setFormData({ ...formData, shippingPincode: e.target.value })}
          placeholder="Postal Code"
        />
        <div className="flex justify-end gap-3 pt-3">
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>Save Address</Button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================
// DISPATCH DETAILS MODAL (Admin)
// ============================================================
function DispatchDetailsModal({ order, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    trackingNumber: order.dispatchTracking || '',
    courier: order.dispatchCourier || '',
    estimatedDelivery: order.dispatchEstimatedDelivery || '',
    notes: order.dispatchNotes || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await apiService.updateDispatch(order.id, {
        trackingNumber: formData.trackingNumber,
        courier: formData.courier,
        estimatedDelivery: formData.estimatedDelivery,
        notes: formData.notes,
      });
      onSuccess();
    } catch (err: any) {
      console.error('Failed to update dispatch details:', err);
      setError(err.message || 'Failed to save dispatch details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Update Dispatch Details" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        <p className="text-sm text-slate-500 mb-2">
          Order: <span className="font-medium">{order.order_number}</span>
        </p>
        <Input
          label="Tracking Number"
          value={formData.trackingNumber}
          onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
          placeholder="e.g., TRK-12345"
        />
        <Input
          label="Courier"
          value={formData.courier}
          onChange={(e) => setFormData({ ...formData, courier: e.target.value })}
          placeholder="e.g., DHL, FedEx"
        />
        <Input
          label="Estimated Delivery Date"
          type="date"
          value={formData.estimatedDelivery}
          onChange={(e) => setFormData({ ...formData, estimatedDelivery: e.target.value })}
        />
        <Input
          label="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes"
          textarea
          rows={2}
        />
        <div className="flex justify-end gap-3 pt-3">
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>Save Dispatch</Button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================
// ORDER DETAIL MODAL
// ============================================================
function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onUpdate,
}: {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!order) return null;

  const canUpdateStatus = user?.role && ['admin', 'management', 'warehouse_staff'].includes(user.role);

  const formatCurrency = (amount: number) => {
    return `E ${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(amount || 0)}`;
  };

  const updateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await apiService.updateOrderStatus(order.id, newStatus);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const statusSteps = [
    'pending', 'confirmed', 'in_production', 'quality_check', 'ready_for_dispatch', 'in_transit', 'delivered'
  ];
  const currentStepIndex = statusSteps.indexOf(order.status);

  const getCustomerName = (ord: any): string => {
    if (ord.customer?.companyName) return ord.customer.companyName;
    if (ord.customer?.company_name) return ord.customer.company_name;
    if (ord.customer?.name) return ord.customer.name;
    if (ord.customer?.fullName) return ord.customer.fullName;
    if (ord.customer?.full_name) return ord.customer.full_name;
    if (ord.customerName) return ord.customerName;
    return 'N/A';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Order Details" size="xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{order.order_number || order.orderNumber}</h3>
            <p className="text-slate-500">{getCustomerName(order)}</p>
          </div>
          <Badge variant={statusColors[order.status] as any} size="lg">
            {statusLabels[order.status]}
          </Badge>
        </div>

        <div className="relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200" />
          <div className="flex justify-between relative">
            {statusSteps.slice(0, 5).map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const Icon = statusIcons[step];
              return (
                <div key={step} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                    isCompleted ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className={`text-xs mt-2 ${isCompleted ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>
                    {statusLabels[step]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <p className="text-sm text-slate-500">Order Date</p>
            <p className="font-medium">
              {order.order_date || order.orderDate ?
                new Date(order.order_date || order.orderDate).toLocaleDateString() :
                'N/A'}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Required Date</p>
            <p className="font-medium">
              {order.required_date || order.requiredDate ?
                new Date(order.required_date || order.requiredDate).toLocaleDateString() :
                'N/A'}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Warehouse</p>
            <p className="font-medium">{order.warehouse?.name || 'N/A'}</p>
          </Card>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-medium text-slate-700 mb-3">Order Items</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Product</TableCell>
                <TableCell header>Qty</TableCell>
                <TableCell header>Unit Price</TableCell>
                <TableCell header>Tax</TableCell>
                <TableCell header>Total</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((item: any) => {
                const productName = item.product?.name || item.product_name || 'Unknown';
                const productCode = item.product?.productCode || item.product?.product_code || item.product_code || 'N/A';
                const quantity = item.quantity ?? 0;
                const unitPrice = item.unitPrice ?? item.unit_price ?? 0;
                const taxPercent = item.taxPercentage ?? item.tax_percentage ?? 0;
                const lineTotal = item.lineTotal ?? item.line_total ?? 0;

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{productName}</p>
                        <p className="text-sm text-slate-500">{productCode}</p>
                      </div>
                    </TableCell>
                    <TableCell>{quantity}</TableCell>
                    <TableCell>{formatCurrency(unitPrice)}</TableCell>
                    <TableCell>{taxPercent}%</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(lineTotal)}</TableCell>
                  </TableRow>
                );
              })}
              {(!order.items || order.items.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500">No items found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="border-t pt-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-500">Order Total</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(order.total_amount ?? order.totalAmount ?? 0)}
            </p>
          </div>
          <div className="flex gap-2">
            {(order.status === 'pending' || order.status === 'confirmed') && (
              <Button
                variant="outline"
                onClick={() => updateStatus('cancelled')}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Cancel Order
              </Button>
            )}
            {canUpdateStatus && order.status !== 'delivered' && order.status !== 'cancelled' && (
              <Button onClick={() => {
                const nextIndex = statusSteps.indexOf(order.status) + 1;
                if (nextIndex < statusSteps.length) {
                  updateStatus(statusSteps[nextIndex]);
                }
              }} isLoading={isUpdating}>
                <Send className="w-4 h-4 mr-2" />
                Update Status
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// MAIN ORDER MANAGEMENT COMPONENT
// ============================================================
export default function OrderManagement() {
  const { user, customer } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // States for notification modals
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingOrder, setShippingOrder] = useState<Order | null>(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchOrder, setDispatchOrder] = useState<Order | null>(null);

  const [searchParams] = useSearchParams();
  const orderIdFromUrl = searchParams.get('orderId');

  const getCustomerName = (order: any): string => {
    if (order.customer) {
      if (order.customer.companyName) return order.customer.companyName;
      if (order.customer.company_name) return order.customer.company_name;
      if (order.customer.name) return order.customer.name;
      if (order.customer.fullName) return order.customer.fullName;
      if (order.customer.full_name) return order.customer.full_name;
      if (order.customer.business_name) return order.customer.business_name;
    }
    if (order.customerName) return order.customerName;
    if (order.customer_name) return order.customer_name;
    return 'N/A';
  };

  const getOrderDate = (order: any): string => {
    const dateStr = order.order_date || order.orderDate || order.created_at || order.createdAt || null;
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const getItemCount = (order: any): string => {
    if (order.items && Array.isArray(order.items)) {
      return `${order.items.length} items`;
    }
    if (order.itemCount) return `${order.itemCount} items`;
    if (order.item_count) return `${order.item_count} items`;
    return '0 items';
  };

  const formatCurrency = (amount: number) => {
    return `E ${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(amount || 0)}`;
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: 0,
        limit: 100,
        status: filterStatus || undefined,
      };
      if (user?.role === 'customer' && customer?.id) {
        params.customerId = customer.id;
      }

      const response = await apiService.getOrders(params);
      console.log('📦 API response from getOrders:', response);
      const ordersArray = response.data || [];
      console.log('✅ Extracted orders:', ordersArray);
      setOrders(ordersArray);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [user, customer, filterStatus]);

  useEffect(() => {
    setFilterStatus('');
  }, [user]);

  // Handle notification click
  useEffect(() => {
    if (orderIdFromUrl) {
      const fetchOrderAndOpen = async () => {
        try {
          // ✅ `getOrder` returns the order object directly
          const order = await apiService.getOrder(orderIdFromUrl);
          if (!order) {
            throw new Error('Order not found');
          }
          // If order is ready_for_dispatch, open the appropriate modal
          if (order.status === 'ready_for_dispatch') {
            if (user?.role === 'customer') {
              setShippingOrder(order);
              setShowShippingModal(true);
            } else {
              setDispatchOrder(order);
              setShowDispatchModal(true);
            }
          } else {
            // Normal order detail view
            setSelectedOrder(order);
            setShowDetailModal(true);
          }
          window.history.replaceState({}, '', '/orders');
        } catch (e: any) {
          console.error('Failed to fetch order from notification:', e);
          let message = 'Failed to load order. Please try again.';
          if (e.status === 403) {
            if (user?.role === 'admin') {
              message = 'Order details are restricted. As an admin, you can view all orders from the list below.';
            } else {
              message = 'You do not have permission to view this order directly. Please contact support.';
            }
          }
          setToast({ message, type: 'error' });
          window.history.replaceState({}, '', '/orders');
          if (window.location.pathname !== '/orders') {
            navigate('/orders');
          }
        }
      };
      fetchOrderAndOpen();
    }
  }, [orderIdFromUrl, user, navigate]);

  const filteredOrders = orders.filter((o) => {
    if (!o) return false;
    const searchLower = searchQuery.toLowerCase().trim();
    const orderNumber = (o.order_number || '').toLowerCase();
    const customerName = getCustomerName(o).toLowerCase();
    const matchesSearch = orderNumber.includes(searchLower) || customerName.includes(searchLower);
    const matchesStatus = !filterStatus || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const canCreateOrder = user?.role && 
    ['admin', 'management', 'customer'].includes(user.role.toLowerCase());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`p-4 rounded-lg text-sm ${
          toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="float-right text-sm font-medium">×</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-slate-500 mt-1">Manage customer orders</p>
        </div>
        
        {canCreateOrder && (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusLabels).slice(0, 5).map(([key, label]) => {
          const count = orders.filter(o => o.status === key).length;
          const Icon = statusIcons[key];
          return (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${filterStatus === key ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setFilterStatus(filterStatus === key ? '' : key)}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  key === 'pending' ? 'bg-amber-100' :
                  key === 'in_production' ? 'bg-blue-100' :
                  key === 'delivered' ? 'bg-emerald-100' :
                  'bg-slate-100'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    key === 'pending' ? 'text-amber-600' :
                    key === 'in_production' ? 'text-blue-600' :
                    key === 'delivered' ? 'text-emerald-600' :
                    'text-slate-600'
                  }`} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-xl font-bold text-slate-900">{count}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: '', label: 'All Status' },
              ...Object.entries(statusLabels).map(([value, label]) => ({ value, label }))
            ]}
            className="w-48"
          />
        </div>

        {filteredOrders.length === 0 ? (
          <EmptyState message="No orders found" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Order</TableCell>
                <TableCell header>Customer</TableCell>
                <TableCell header>Date</TableCell>
                <TableCell header>Items</TableCell>
                <TableCell header>Amount</TableCell>
                <TableCell header>Status</TableCell>
                <TableCell header>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const customerName = getCustomerName(order);
                const orderDate = getOrderDate(order);
                const totalAmount = order.total_amount ?? order.totalAmount ?? 0;
                const priority = order.priority || 'Normal';
                const itemCount = getItemCount(order);

                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <ShoppingCart className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{order.order_number}</p>
                          <p className="text-xs text-slate-500">Priority: {priority}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{customerName}</TableCell>
                    <TableCell>{orderDate}</TableCell>
                    <TableCell>{itemCount}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(totalAmount)}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[order.status] as any}>
                        {statusLabels[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetailModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <CreateOrderModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchOrders();
        }}
      />

      <OrderDetailModal
        order={selectedOrder}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedOrder(null);
        }}
        onUpdate={fetchOrders}
      />

      {/* Shipping Address Modal (Customer) */}
      {showShippingModal && shippingOrder && (
        <ShippingAddressModal
          order={shippingOrder}
          onClose={() => {
            setShowShippingModal(false);
            setShippingOrder(null);
          }}
          onSuccess={() => {
            setShowShippingModal(false);
            setShippingOrder(null);
            fetchOrders();
            setToast({ message: 'Shipping address updated successfully!', type: 'success' });
          }}
        />
      )}

      {/* Dispatch Details Modal (Admin) */}
      {showDispatchModal && dispatchOrder && (
        <DispatchDetailsModal
          order={dispatchOrder}
          onClose={() => {
            setShowDispatchModal(false);
            setDispatchOrder(null);
          }}
          onSuccess={() => {
            setShowDispatchModal(false);
            setDispatchOrder(null);
            fetchOrders();
            setToast({ message: 'Dispatch details saved successfully!', type: 'success' });
          }}
        />
      )}
    </div>
  );
}