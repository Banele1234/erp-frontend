import { useState, useEffect } from 'react';
import { PackageCheck, Truck, Clock3, MapPin, Loader2, AlertTriangle } from 'lucide-react';
import { apiService } from '../../lib/api';

// Types for order data
interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  status: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_pincode?: string;
  customer?: {
    id: string;
    company_name: string;
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

  useEffect(() => {
    fetchDispatchData();
  }, []);

  const fetchDispatchData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.getOrders({ limit: 200 });
      
      // ✅ Safely extract array from different response shapes
      const allOrders = response.data?.data || response.data?.content || response.data || [];
      const ordersArray = Array.isArray(allOrders) ? allOrders : [];

      const dispatchStatuses = ['ready_for_dispatch', 'in_transit', 'delivered', 'cancelled'];
      const dispatchOrders = ordersArray.filter((o: Order) => 
        o && dispatchStatuses.includes(o.status)
      );

      setOrders(dispatchOrders);

      // Count by status
      const ready = dispatchOrders.filter((o: Order) => o.status === 'ready_for_dispatch').length;
      const transit = dispatchOrders.filter((o: Order) => o.status === 'in_transit').length;
      const delivered = dispatchOrders.filter((o: Order) => o.status === 'delivered').length;
      const delayed = 0; // Could compute if needed

      setStats({ readyToDispatch: ready, inTransit: transit, delayed, delivered });
    } catch (err: any) {
      console.error('Dispatch fetch error:', err);
      setError(err.message || 'Failed to load dispatch data');
    } finally {
      setLoading(false);
    }
  };

  // Helper to format status label
  const formatStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      ready_for_dispatch: 'Ready to Dispatch',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return map[status] || status.replace(/_/g, ' ');
  };

  // Helper to get status icon
  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      ready_for_dispatch: PackageCheck,
      in_transit: Truck,
      delivered: MapPin,
      cancelled: Clock3,
    };
    return icons[status] || Truck;
  };

  // Helper to get status color class
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ready_for_dispatch: 'bg-emerald-100 text-emerald-700',
      in_transit: 'bg-blue-100 text-blue-700',
      delivered: 'bg-slate-100 text-slate-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  // For card background colors (stat cards)
  const cardColors: Record<string, string> = {
    readyToDispatch: 'bg-emerald-50 text-emerald-700',
    inTransit: 'bg-blue-50 text-blue-700',
    delayed: 'bg-amber-50 text-amber-700',
    delivered: 'bg-slate-50 text-slate-700',
  };

  // Destination string from order
  const getDestination = (order: Order) => {
    if (order.shipping_city) {
      let dest = order.shipping_city;
      if (order.shipping_state) dest += `, ${order.shipping_state}`;
      return dest;
    }
    if (order.shipping_address) return order.shipping_address;
    return 'N/A';
  };

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

  const dispatchCards = [
    { key: 'readyToDispatch', label: 'Ready to Dispatch', value: stats.readyToDispatch },
    { key: 'inTransit', label: 'In Transit', value: stats.inTransit },
    { key: 'delayed', label: 'Delayed', value: stats.delayed },
    { key: 'delivered', label: 'Delivered', value: stats.delivered },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Logistics</p>
        <h1 className="text-2xl font-bold text-slate-900">Dispatches</h1>
      </div>

      {/* Stats Cards */}
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

      {/* Dispatch Schedule Table */}
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
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    No dispatch records found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const Icon = getStatusIcon(order.status);
                  return (
                    <tr key={order.id} className="border-t border-slate-100">
                      <td className="px-5 py-3 font-medium text-slate-900">
                        DSP-{order.order_number?.slice(-4) || order.id.slice(0, 4)}
                      </td>
                      <td className="px-5 py-3 text-slate-700">{order.order_number}</td>
                      <td className="px-5 py-3 text-slate-700">
                        {order.customer?.company_name || 'N/A'}
                      </td>
                      <td className="px-5 py-3 text-slate-700">{getDestination(order)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${getStatusColor(order.status)}`}>
                          <Icon className="w-4 h-4" />
                          {formatStatusLabel(order.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}