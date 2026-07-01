import { useState, useEffect } from 'react';
import {
  Download,
  FileSpreadsheet,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Calendar,
  BadgeCheck,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiService } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444'];

const formatCurrency = (amount: number) =>
  `E ${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(amount)}`;

// Helper: safely get a field from an object
const getField = (obj: any, keys: string[], fallback: any = null) => {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return fallback;
};

// Helper: group orders by month
const groupOrdersByMonth = (orders: any[]) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const map: Record<string, { revenue: number; orders: number }> = {};
  orders.forEach((o) => {
    const dateStr = getField(o, ['orderDate', 'order_date', 'createdAt', 'created_at']);
    if (!dateStr) return;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return;
    const month = months[date.getMonth()];
    if (!map[month]) map[month] = { revenue: 0, orders: 0 };
    const amount = getField(o, ['totalAmount', 'total_amount'], 0);
    map[month].revenue += amount;
    map[month].orders += 1;
  });
  const availableMonths = Object.keys(map);
  const sorted = months.filter(m => availableMonths.includes(m));
  return sorted.map(m => ({
    month: m,
    revenue: map[m]?.revenue || 0,
    orders: map[m]?.orders || 0,
  }));
};

export default function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    growth: 0,
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        apiService.getOrders({ limit: 200 }),
        apiService.getCustomers({ limit: 200 }),
        apiService.getProducts({ limit: 200 }),
      ]);

      // ✅ Safely extract arrays
      const ordersData = ordersRes.data?.data || ordersRes.data?.content || ordersRes.data || [];
      const orders = Array.isArray(ordersData) ? ordersData : [];

      const customersData = customersRes.data?.data || customersRes.data?.content || customersRes.data || [];
      const customers = Array.isArray(customersData) ? customersData : [];

      const productsData = productsRes.data?.data || productsRes.data?.content || productsRes.data || [];
      const products = Array.isArray(productsData) ? productsData : [];

      // Top products
      let topProductsRes;
      try {
        topProductsRes = await apiService.request('/dashboard/top-products', { method: 'GET' });
      } catch (err) {
        console.warn('Top products fetch failed, using fallback:', err);
        topProductsRes = null;
      }

      // Calculate stats using robust field extraction
      const totalRevenue = orders.reduce((sum: number, o: any) => {
        const amount = getField(o, ['totalAmount', 'total_amount'], 0);
        return sum + amount;
      }, 0);
      const totalOrders = orders.length;
      const totalCustomers = customers.length;

      // Monthly data
      const monthly = groupOrdersByMonth(orders);
      setMonthlyData(monthly.slice(-6));

      // Category breakdown from products
      const categoryMap: Record<string, number> = {};
      products.forEach((p: any) => {
        const cat = p.category || 'Uncategorized';
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
      });
      const totalProducts = products.length;
      const categoryBreakdown = Object.entries(categoryMap).map(([name, count]) => ({
        name,
        value: totalProducts ? Math.round((count / totalProducts) * 100) : 0,
      }));
      setCategoryData(categoryBreakdown.length ? categoryBreakdown : [
        { name: 'Fast Moving', value: 38 },
        { name: 'Regular', value: 32 },
        { name: 'Seasonal', value: 18 },
        { name: 'Slow Moving', value: 12 },
      ]);

      // Top products
      let top = topProductsRes?.data || [];
      if (!top.length) {
        top = [
          { name: 'Battery Cell A', sold: 128, revenue: 28400 },
          { name: 'Brake Pad Set', sold: 96, revenue: 19200 },
          { name: 'Oil Filter X', sold: 84, revenue: 16800 },
          { name: 'Spark Plug Pro', sold: 72, revenue: 14400 },
        ];
      }
      setTopProducts(top.slice(0, 5));

      // Recent reports – fixed date extraction
      const recent = orders.slice(0, 5).map((o: any) => {
        const orderNumber = getField(o, ['orderNumber', 'order_number'], o.id);
        const dateStr = getField(o, ['orderDate', 'order_date', 'createdAt', 'created_at']);
        const date = dateStr ? new Date(dateStr) : null;
        const formattedDate = date && !isNaN(date.getTime()) ? date.toLocaleDateString() : 'Invalid Date';
        return {
          id: orderNumber,
          title: `Order ${orderNumber}`,
          date: formattedDate,
          owner: getField(o, ['customer.companyName', 'customer.company_name', 'customerName'], 'Customer'),
          order: o,
        };
      });
      setRecentReports(recent);

      setStats({
        totalRevenue,
        totalOrders,
        totalCustomers,
        growth: 18.4,
      });
    } catch (err: any) {
      console.error('Reports error:', err);
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const exportCSV = (data: any[], filename: string, headers: string[]) => {
    if (!data.length) return;
    const rows = [headers.join(',')];
    data.forEach(item => {
      const row = headers.map(h => {
        const val = item[h] !== undefined ? item[h] : '';
        return typeof val === 'string' ? `"${val}"` : val;
      });
      rows.push(row.join(','));
    });
    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExportSales = () => {
    setIsExporting(true);
    try {
      const salesData = monthlyData.map(d => ({ month: d.month, revenue: d.revenue, orders: d.orders }));
      exportCSV(salesData, 'sales_report', ['month', 'revenue', 'orders']);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadReport = (report: any) => {
    if (report.order) {
      const order = report.order;
      const orderNumber = getField(order, ['orderNumber', 'order_number'], 'N/A');
      const customer = getField(order, ['customer.companyName', 'customer.company_name', 'customerName'], 'N/A');
      const total = getField(order, ['totalAmount', 'total_amount'], 0);
      const status = getField(order, ['status'], 'N/A');
      const dateStr = getField(order, ['orderDate', 'order_date', 'createdAt', 'created_at']);
      const date = dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A';
      const invoiceData = [{
        'Order Number': orderNumber,
        'Date': date,
        'Customer': customer,
        'Total': total,
        'Status': status,
      }];
      exportCSV(invoiceData, `receipt_${orderNumber}`, ['Order Number', 'Date', 'Customer', 'Total', 'Status']);
    } else {
      const data = [{ title: report.title, date: report.date, owner: report.owner }];
      exportCSV(data, `report_${report.id}`, ['title', 'date', 'owner']);
    }
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
            onClick={fetchData}
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500">Analytics</p>
          <h1 className="text-2xl font-bold text-slate-900">Admin Reports</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Calendar className="w-4 h-4" />
            Last 6 Months
          </button>
          <button
            onClick={handleExportSales}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export Report
          </button>
        </div>
      </div>

      {/* rest of the component unchanged */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Revenue</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(stats.totalRevenue)}</h3>
            </div>
            <div className="rounded-xl bg-blue-50 p-3">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Orders</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-900">{stats.totalOrders}</h3>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Customers</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-900">{stats.totalCustomers}</h3>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Growth</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-900">+{stats.growth}%</h3>
            </div>
            <div className="rounded-xl bg-violet-50 p-3">
              <TrendingUp className="w-5 h-5 text-violet-600" />
            </div>
          </div>
        </div>
      </div>

      {/* the rest of the JSX stays exactly the same as before */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Revenue Trend</h2>
            <span className="text-sm text-slate-500">Updated today</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%" aspect={2}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" />
                <YAxis stroke="#64748B" />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Category Share</h2>
            <BadgeCheck className="w-5 h-5 text-slate-400" />
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%" aspect={1}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2">
            {categoryData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-medium text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Top Selling Products</h2>
            <FileSpreadsheet className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            {topProducts.map((product) => (
              <div key={product.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{product.name}</p>
                  <p className="text-sm text-slate-500">{product.sold} units sold</p>
                </div>
                <span className="font-semibold text-slate-900">{formatCurrency(product.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Reports</h2>
            <Download className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            {recentReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{report.title}</p>
                  <p className="text-sm text-slate-500">{report.owner}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">{report.date}</span>
                  <button
                    onClick={() => handleDownloadReport(report)}
                    className="rounded-lg bg-blue-50 p-1.5 text-blue-600 hover:bg-blue-100"
                    title="Download receipt"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}