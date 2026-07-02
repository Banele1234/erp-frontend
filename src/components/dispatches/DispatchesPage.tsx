import { useState, useEffect } from 'react';
import { PackageCheck, Truck, Clock3, MapPin, Loader2, AlertTriangle, Edit } from 'lucide-react';
import { apiService } from '../../lib/api';
import { Button, Modal, Input, Card, Badge, LoadingSpinner, EmptyState } from '../common/StatusBadge';

// Helper: safely extract a field (handles nested objects)
const getField = (obj: any, keys: string[], fallback: any = 'N/A') => {
  if (!obj) return fallback;
  for (const key of keys) {
    // Support dot notation for nested paths
    const parts = key.split('.');
    let value = obj;
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        value = undefined;
        break;
      }
    }
    if (value !== undefined && value !== null) return value;
  }
  return fallback;
};

// Types for order data
interface Order {
  id: string;
  order_number: string;
  orderNumber?: string;
  customer_id: string;
  status: string;
  shipping_address?: string;
  shippingAddress?: string;
  shipping_city?: string;
  shippingCity?: string;
  shipping_state?: string;
  shippingState?: string;
  shipping_pincode?: string;
  shippingPincode?: string;
  warehouse?: {
    id: string;
    name: string;
    location?: string;
  };
  customer?: {
    id: string;
    company_name?: string;
    companyName?: string;
    contact_person?: string;
  };
  created_at: string;
  total_amount: number;
}

export default function DispatchesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    readyToDispatch: 0,
    inTransit: 0,
    delayed: 0,
    delivered: 0,
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchDispatchData();
  }, []);

  const fetchDispatchData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.getOrders({ limit: 200 });
      
      const allOrders = response.data?.data || response.data?.content || response.data || [];
      const ordersArray = Array.isArray(allOrders) ? allOrders : [];

      const dispatchStatuses = ['ready_for_dispatch', 'in_transit', 'delivered', 'cancelled'];
      const dispatchOrders = ordersArray.filter((o: Order) => 
        o && dispatchStatuses.includes(o.status)
      );

      setOrders(dispatchOrders);

      const ready = dispatchOrders.filter((o: Order) => o.status === 'ready_for_dispatch').length;
      const transit = dispatchOrders.filter((o: Order) => o.status === 'in_transit').length;
      const delivered = dispatchOrders.filter((o: Order) => o.status === 'delivered').length;
      const delayed = 0;

      setStats({ readyToDispatch: ready, inTransit: transit, delayed, delivered });
    } catch (err: any) {
      console.error('Dispatch fetch error:', err);
      setError(err.message || 'Failed to load dispatch data');
    } finally {
      setLoading(false);
    }
  };

  const formatStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      ready_for_dispatch: 'Ready to Dispatch',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return map[status] || status.replace(/_/g, ' ');
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      ready_for_dispatch: PackageCheck,
      in_transit: Truck,
      delivered: MapPin,
      cancelled: Clock3,
    };
    return icons[status] || Truck;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ready_for_dispatch: 'bg-emerald-100 text-emerald-700',
      in_transit: 'bg-blue-100 text-blue-700',
      delivered: 'bg-slate-100 text-slate-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getCustomerName = (order: Order) => {
    return getField(order, ['customer.companyName', 'customer.company_name', 'customerName', 'customer_name'], 'N/A');
  };

  // === FIXED: prioritise shipping address ===
  const getDestination = (order: Order) => {
    // 1. If we have shippingAddress, use it
    const shippingAddr = getField(order, ['shippingAddress', 'shipping_address'], null);
    if (shippingAddr) return shippingAddr;

    // 2. If we have shippingCity + shippingState, combine them
    const city = getField(order, ['shippingCity', 'shipping_city'], null);
    const state = getField(order, ['shippingState', 'shipping_state'], null);
    if (city) {
      return state ? `${city}, ${state}` : city;
    }

    // 3. Fallback to warehouse location
    const warehouseLocation = getField(order, ['warehouse.location', 'warehouse.location'], null);
    if (warehouseLocation) return warehouseLocation;
    const warehouseName = getField(order, ['warehouse.name'], null);
    if (warehouseName) return warehouseName;

    return 'N/A';
  };

  const getDispatchId = (order: Order) => {
    const orderNum = getField(order, ['order_number', 'orderNumber'], order.id);
    return `DSP-${orderNum.slice(-4)}`;
  };

  const handleEditClick = (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleSaveDelivery = async (data: any) => {
    console.log('Saving delivery details for order:', selectedOrder?.id, data);
    // TODO: Call API to update dispatch
    setShowModal(false);
    setSelectedOrder(null);
    await fetchDispatchData();
  };

  const cardColors: Record<string, string> = {
    readyToDispatch: 'bg-emerald-50 text-emerald-700',
    inTransit: 'bg-blue-50 text-blue-700',
    delayed: 'bg-amber-50 text-amber-700',
    delivered: 'bg-slate-50 text-slate-700',
  };

  const dispatchCards = [
    { key: 'readyToDispatch', label: 'Ready to Dispatch', value: stats.readyToDispatch },
    { key: 'inTransit', label: 'In Transit', value: stats.inTransit },
    { key: 'delayed', label: 'Delayed', value: stats.delayed },
    { key: 'delivered', label: 'Delivered', value: stats.delivered },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchDispatchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Logistics</p>
        <h1 className="text-2xl font-bold text-slate-900">Dispatches</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {dispatchCards.map((card) => (
          <div key={card.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{card.label}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-2xl font-semibold text-slate-900">{card.value}</span>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${cardColors[card.key] || 'bg-slate-50 text-slate-700'}`}>
                {card.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Dispatch Schedule</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Dispatch ID</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Order</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Customer</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Destination</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Status</th>
                <th className="px-5 py-3 text-left font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No dispatch records found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const Icon = getStatusIcon(order.status);
                  const dispatchId = getDispatchId(order);
                  const customerName = getCustomerName(order);
                  const destination = getDestination(order);
                  const orderNumber = getField(order, ['order_number', 'orderNumber'], order.id);

                  return (
                    <tr key={order.id} className="border-t border-slate-100">
                      <td className="px-5 py-3 font-medium text-slate-900">{dispatchId}</td>
                      <td className="px-5 py-3 text-slate-700">{orderNumber}</td>
                      <td className="px-5 py-3 text-slate-700">{customerName}</td>
                      <td className="px-5 py-3 text-slate-700">{destination}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${getStatusColor(order.status)}`}>
                          <Icon className="w-4 h-4" />
                          {formatStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(order)}
                          title="Update delivery details"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedOrder && (
        <DeliveryModal
          order={selectedOrder}
          onClose={() => {
            setShowModal(false);
            setSelectedOrder(null);
          }}
          onSave={handleSaveDelivery}
        />
      )}
    </div>
  );
}

// ---------- Delivery Modal (unchanged) ----------
function DeliveryModal({ order, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    trackingNumber: order.dispatchTracking || '',
    courier: order.dispatchCourier || '',
    estimatedDelivery: order.dispatchEstimatedDelivery || '',
    notes: order.dispatchNotes || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Update Delivery Details</h2>
        <p className="text-sm text-slate-500 mb-4">Order: {order.order_number || order.orderNumber}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Tracking Number</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.trackingNumber}
              onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
              placeholder="e.g., TRK-12345"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Courier</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.courier}
              onChange={(e) => setFormData({ ...formData, courier: e.target.value })}
              placeholder="e.g., DHL, FedEx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Estimated Delivery Date</label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.estimatedDelivery}
              onChange={(e) => setFormData({ ...formData, estimatedDelivery: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Notes</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>Save Delivery</Button>
          </div>
        </form>
      </div>
    </div>
  );
}