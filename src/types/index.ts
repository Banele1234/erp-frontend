// src/types/index.ts
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  user_id: string;
  customer_code: string;
  company_name: string;
  contact_person?: string;
  contact_name?: string; // legacy
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst_number?: string;
  customer_type: 'oem' | 'regular_dealer' | 'exclusive_dealer';
  rating: 'gold' | 'silver' | 'bronze';
  credit_limit: number;
  current_outstanding: number;
  total_purchases: number;
  discount_percentage: number;
  country: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  product_code: string;
  name: string;
  description?: string;
  category: 'fast_moving' | 'slow_moving' | 'seasonal' | 'regular';
  unit: string;
  unit_price: number;
  cost_price: number;
  gst_percentage: number;
  reorder_level: number;
  eoq: number;
  weight_kg: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Warehouse {
  id: string;
  warehouse_code: string;
  name: string;
  location?: string;
  address?: string;
  city: string;
  state?: string;
  phone?: string;
  manager_name?: string;
  capacity_units: number;
  current_utilization: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  product?: Product;
  warehouse?: Warehouse;
  created_at: string;
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  tax_percentage: number;
  line_total: number;
  product?: Product;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  warehouse_id?: string;
  order_date: string;
  required_date?: string;
  priority: string;
  status: 'pending' | 'confirmed' | 'in_production' | 'quality_check' | 'ready_for_dispatch' | 'in_transit' | 'delivered' | 'cancelled';
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_pincode?: string;
  notes?: string;
  created_by?: string;
  customer?: Customer;
  warehouse?: Warehouse;
  items?: OrderItem[];
  itemCount?: number;
  created_at: string;
  updated_at?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  customer_id: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue';
  notes?: string;
  customer?: Customer;
  order?: Order;
  created_at: string;
  updated_at?: string;
}

export interface Payment {
  id: string;
  payment_number: string;
  invoice_id?: string;
  customer_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'bank_transfer' | 'cheque' | 'cash' | 'upi';
  reference_number?: string;
  bank_name?: string;
  notes?: string;
  status: string;
  received_by?: string;
  customer?: Customer;
  invoice?: Invoice;
  created_at: string;
}

export interface Rejection {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  reason: string;
  rejection_date: string;
  created_by?: string;
  product?: Product;
  warehouse?: Warehouse;
  created_at: string;
}

export interface Production {
  id: string;
  product_id: string;
  quantity_produced: number;
  production_date: string;
  raw_material_cost?: number;
  labor_cost?: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  product?: Product;
  created_at: string;
  updated_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message?: string;
  type: 'order' | 'dispatch' | 'payment' | 'rejection' | 'info' | 'invoice';   // ✅ added 'invoice'
  reference_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  outstandingPayments: number;
  lowStockProducts: number;
  totalCustomers: number;
  monthlyGrowth: number;
  recentOrders: any[];
  topProducts: any[];
}

export type MovementType = 'in' | 'out' | 'transfer';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    customerId?: string;
  };
}