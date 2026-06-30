// src/components/dashboard/Dashboard.tsx

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/api';
import { Card, StatCard, Badge, Button, LoadingSpinner } from '../common/StatusBadge';
import { DashboardStats } from '../../types';
import {
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
  Factory,
  ArrowRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

// Helper: safely extract a number
const getNumber = (obj: any, keys: string[]): number => {
  for (const key of keys) {
    const val = obj?.[key];
    if (val !== undefined && val !== null && !isNaN(Number(val))) {
      return Number(val);
    }
  }
  return 0;
};

// Helper: safely extract a string
const getString = (obj: any, keys: string[]): string => {
  for (const key of keys) {
    const val = obj?.[key];
    if (val !== undefined && val !== null) return String(val);
  }
  return '';
};

export default function Dashboard() {
  const { user, customer } = useAuth();
  const isCustomer = user?.role?.toLowerCase() === 'customer';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [salesData, setSalesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  // Customer‑only state
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [user, customer]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (isCustomer) {
        // -------- CUSTOMER DASHBOARD --------
        const response = await apiService.getCustomerDashboard();
        const data = response?.data || response || {};

        // Extract customer-specific stats
        const totalRevenue = getNumber(data, ['totalRevenue', 'total_revenue']);
        const totalOrders = getNumber(data, ['totalOrders', 'total_orders']);
        const pendingOrders = getNumber(data, ['pendingOrders', 'pending_orders']);
        const outstandingPayments = getNumber(data, ['outstandingPayments', 'outstanding_payments']);
        const recentOrders = data.recentOrders || data.recent_orders || [];

        setStats({
          totalOrders,
          pendingOrders,
          totalRevenue,
          outstandingPayments,
          recentOrders,
          totalCustomers: 0,
          lowStockProducts: 0,
          monthlyGrowth: 0,
          topProducts: [],
        });

        // Fetch invoices and payments – handle different response shapes
        if (customer?.id) {
          const [invoicesRes, paymentsRes] = await Promise.all([
            apiService.getInvoices({ page: 1, limit: 5, customer_id: customer.id }),
            apiService.getPayments({ page: 1, limit: 5, customer_id: customer.id }),
          ]);

          // ✅ invoicesRes.data might be an object with `content` array, or an array directly
          const invoicesArray = Array.isArray(invoicesRes?.data)
            ? invoicesRes.data
            : Array.isArray(invoicesRes?.data?.content)
            ? invoicesRes.data.content
            : [];

          // ✅ paymentsRes.data is usually an array directly
          const paymentsArray = Array.isArray(paymentsRes?.data)
            ? paymentsRes.data
            : Array.isArray(paymentsRes?.data?.content)
            ? paymentsRes.data.content
            : [];

          setRecentInvoices(invoicesArray);
          setRecentPayments(paymentsArray);
        }
      } else {
        // -------- ADMIN DASHBOARD --------
        const response = await apiService.getDashboardStats();
        const data = response?.data || response || {};

        const totalRevenue = getNumber(data, ['totalRevenue', 'total_revenue']);
        const totalOrders = getNumber(data, ['totalOrders', 'total_orders']);
        const pendingOrders = getNumber(data, ['pendingOrders', 'pending_orders']);
        const outstandingPayments = getNumber(data, ['outstandingPayments', 'outstanding_payments']);
        const lowStockProducts = getNumber(data, ['lowStockProducts', 'low_stock_products']);
        const totalCustomers = getNumber(data, ['totalCustomers', 'total_customers']);
        const monthlyGrowth = getNumber(data, ['monthlyGrowth', 'monthly_growth']);
        const recentOrders = data.recentOrders || data.recent_orders || [];
        const topProducts = data.topProducts || data.top_products || [];
        const salesChart = data.salesChart || data.sales_chart || [];
        const categoryDataArr = data.categoryData || data.category_data || [];

        setStats({
          totalOrders,
          pendingOrders,
          totalRevenue,
          outstandingPayments,
          lowStockProducts,
          totalCustomers,
          monthlyGrowth,
          recentOrders,
          topProducts,
        });
        setSalesData(salesChart);
        setCategoryData(categoryDataArr);
      }
    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- Loading ----------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // ---------- Error ----------
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ---------- Render Customer or Admin Dashboard ----------
  if (isCustomer) {
    return (
      <CustomerDashboard
        stats={stats}
        recentInvoices={recentInvoices}
        recentPayments={recentPayments}
        customer={customer}
      />
    );
  }

  // ---------- Admin Dashboard (only for non‑customer roles) ----------
  return <AdminDashboard stats={stats} salesData={salesData} categoryData={categoryData} user={user} />;
}

// ============================================================
// CUSTOMER DASHBOARD
// ============================================================
function CustomerDashboard({
  stats,
  recentInvoices,
  recentPayments,
  customer,
}: {
  stats: DashboardStats | null;
  recentInvoices: any[];
  recentPayments: any[];
  customer: any;
}) {
  const formatCurrency = (amount: number) =>
    `E ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount || 0)}`;

  const creditUtilization = customer?.creditLimit
    ? Math.round(((customer.currentOutstanding || 0) / customer.creditLimit) * 100)
    : 0;

  const getOrderTotal = (order: any) => order.totalAmount ?? order.total_amount ?? order.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome, {customer?.companyName || customer?.fullName || 'Customer'}
            </h1>
            <p className="text-blue-100 mt-1">Customer Code: {customer?.customerCode || 'N/A'}</p>
          </div>
          <div className="text-right">
            <Badge className="bg-white/20 text-white border-white/30">
              {customer?.rating?.toUpperCase() || 'N/A'} Partner
            </Badge>
            <p className="text-sm text-blue-100 mt-2">Credit Limit: {formatCurrency(customer?.creditLimit || 0)}</p>
          </div>
        </div>
        {customer?.creditLimit > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span>Credit Utilization</span>
              <span>{creditUtilization}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full rounded-full transition-all ${
                  creditUtilization > 80 ? 'bg-red-400' : creditUtilization > 60 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(creditUtilization, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          icon={<ShoppingCart className="w-6 h-6 text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Pending Orders"
          value={stats?.pendingOrders || 0}
          icon={<Clock className="w-6 h-6 text-amber-600" />}
          iconBg="bg-amber-100"
        />
        <StatCard
          title="Total Spent"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
          iconBg="bg-emerald-100"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats?.outstandingPayments || 0)}
          icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          iconBg="bg-red-100"
        />
      </div>

      {/* Recent Orders */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Recent Orders</h3>
          <Link to="/orders" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {stats?.recentOrders?.map((order: any) => (
            <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">{order.orderNumber || order.order_number || 'N/A'}</p>
                <p className="text-sm text-slate-500">
                  {new Date(order.orderDate || order.order_date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <Badge variant="info" size="sm">{order.status || 'N/A'}</Badge>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {formatCurrency(getOrderTotal(order))}
                </p>
              </div>
            </div>
          ))}
          {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
            <p className="text-center text-slate-500 py-4">No orders yet</p>
          )}
        </div>
      </Card>

      {/* Invoices & Payments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Recent Invoices</h3>
            <Link to="/invoices" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {recentInvoices.length === 0 ? (
            <p className="text-center text-slate-500 py-4">No invoices</p>
          ) : (
            <div className="space-y-3">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{inv.invoiceNumber || inv.invoice_number}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(inv.issueDate || inv.issue_date || inv.invoice_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={inv.paymentStatus === 'paid' ? 'success' : 'warning'} size="sm">
                      {inv.paymentStatus || inv.payment_status || 'N/A'}
                    </Badge>
                    <p className="text-sm font-semibold text-slate-900 mt-1">
                      {formatCurrency(inv.totalAmount ?? inv.total_amount ?? 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Recent Payments</h3>
            <Link to="/payments" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {recentPayments.length === 0 ? (
            <p className="text-center text-slate-500 py-4">No payments</p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((pmt) => (
                <div key={pmt.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{pmt.paymentNumber || pmt.payment_number}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(pmt.paymentDate || pmt.payment_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="default" size="sm">{pmt.paymentMethod || pmt.payment_method || 'N/A'}</Badge>
                    <p className="text-sm font-semibold text-emerald-600 mt-1">
                      {formatCurrency(pmt.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Discount & Rating */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-slate-500">Discount Percentage</p>
          <p className="text-2xl font-bold text-emerald-600">{customer?.discountPercentage || 0}%</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Customer Rating</p>
          <Badge className="mt-1 capitalize" variant="default">
            {customer?.rating || 'N/A'}
          </Badge>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Total Purchases</p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats?.totalRevenue || 0)}</p>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================
function AdminDashboard({
  stats,
  salesData,
  categoryData,
  user,
}: {
  stats: DashboardStats | null;
  salesData: any[];
  categoryData: any[];
  user: any;
}) {
  const formatCurrency = (amount: number) =>
    `E ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount || 0)}`;

  const displayName = user?.full_name || user?.email || 'Admin';

  // Build pipeline data from recent orders
  const statusCounts: Record<string, number> = {};
  (stats?.recentOrders || []).forEach((order: any) => {
    const status = order.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  const pipelineData = Object.entries(statusCounts).map(([status, count]) => {
    const color = {
      pending: 'bg-amber-500',
      confirmed: 'bg-blue-500',
      in_production: 'bg-purple-500',
      quality_check: 'bg-indigo-500',
      ready_for_dispatch: 'bg-cyan-500',
      in_transit: 'bg-blue-600',
      delivered: 'bg-emerald-500',
      cancelled: 'bg-red-500',
    }[status] || 'bg-slate-500';
    const Icon = {
      pending: Clock,
      confirmed: CheckCircle,
      in_production: Factory,
      quality_check: CheckCircle,
      ready_for_dispatch: Package,
      in_transit: Truck,
      delivered: CheckCircle,
      cancelled: AlertTriangle,
    }[status] || Clock;
    return { status: status.replace(/_/g, ' '), count, color, icon: Icon };
  });
  const totalPipeline = pipelineData.reduce((sum, item) => sum + item.count, 0) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {displayName}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Clock className="w-4 h-4 mr-2" />
            Today
          </Button>
          <Link to="/reports">
            <Button>
              <TrendingUp className="w-4 h-4 mr-2" />
              View Reports
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue || 0)}
          change={stats?.monthlyGrowth}
          icon={<DollarSign className="w-6 h-6 text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          icon={<ShoppingCart className="w-6 h-6 text-emerald-600" />}
          iconBg="bg-emerald-100"
        />
        <StatCard
          title="Active Customers"
          value={stats?.totalCustomers || 0}
          icon={<Users className="w-6 h-6 text-amber-600" />}
          iconBg="bg-amber-100"
        />
        <StatCard
          title="Outstanding Payments"
          value={formatCurrency(stats?.outstandingPayments || 0)}
          icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          iconBg="bg-red-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Sales Overview</h3>
            <span className="text-sm text-slate-500">
              {salesData.length > 0 ? 'Last 6 months' : 'No sales data available'}
            </span>
          </div>
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-slate-500">
              No sales data available
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Product Categories</h3>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {categoryData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-medium text-slate-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              No category data available
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Recent Orders</h3>
            <Link to="/orders" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {stats?.recentOrders?.map((order: any) => {
              const customerName = order.customer?.companyName || order.customerName || order.customer_name || 'N/A';
              const totalAmount = order.totalAmount ?? order.total_amount ?? order.total ?? 0;
              return (
                <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{order.orderNumber || order.order_number}</p>
                    <p className="text-sm text-slate-500">{customerName}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="info" size="sm">{order.status?.replace(/_/g, ' ') || 'N/A'}</Badge>
                    <p className="text-sm font-medium text-slate-900 mt-1">{formatCurrency(totalAmount)}</p>
                  </div>
                </div>
              );
            })}
            {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
              <p className="text-center text-slate-500 py-4">No recent orders</p>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Order Status Pipeline</h3>
          </div>
          <div className="space-y-3">
            {pipelineData.length > 0 ? (
              pipelineData.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.status} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${item.color} bg-opacity-20 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${item.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700">{item.status}</span>
                        <span className="text-sm font-semibold text-slate-900">{item.count}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all`}
                          style={{ width: `${(item.count / totalPipeline) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-slate-500 py-4">No order data available</p>
            )}
          </div>
        </Card>
      </div>

      {stats?.lowStockProducts && stats.lowStockProducts > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <div>
              <h3 className="font-semibold text-amber-900">Low Stock Alert</h3>
              <p className="text-sm text-amber-700">
                {stats.lowStockProducts} products are running low on stock. Review inventory levels.
              </p>
            </div>
            <Button variant="outline" className="ml-auto border-amber-300 text-amber-700 hover:bg-amber-100">
              View Products
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}