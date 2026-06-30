-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles enum
CREATE TYPE user_role AS ENUM ('admin', 'management', 'warehouse_staff', 'customer', 'production');

-- Customer types enum
CREATE TYPE customer_type AS ENUM ('oem', 'regular_dealer', 'exclusive_dealer');

-- Customer rating enum
CREATE TYPE customer_rating AS ENUM ('gold', 'silver', 'bronze');

-- Order status enum
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'in_production', 'quality_check', 'ready_for_dispatch', 'in_transit', 'delivered', 'cancelled');

-- Payment status enum
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid', 'overdue');

-- Product movement type enum
CREATE TYPE movement_type AS ENUM ('in', 'out', 'transfer');

-- Product category enum
CREATE TYPE product_category AS ENUM ('fast_moving', 'slow_moving', 'seasonal', 'regular');

-- ==================== USERS TABLE ====================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== CUSTOMERS TABLE ====================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  customer_code VARCHAR(50) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  pincode VARCHAR(20),
  gst_number VARCHAR(50),
  pan_number VARCHAR(50),
  customer_type customer_type NOT NULL DEFAULT 'regular_dealer',
  rating customer_rating DEFAULT 'bronze',
  credit_limit DECIMAL(15,2) DEFAULT 0,
  current_outstanding DECIMAL(15,2) DEFAULT 0,
  total_purchases DECIMAL(15,2) DEFAULT 0,
  payment_days INTEGER DEFAULT 30,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== WAREHOUSES TABLE ====================
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  warehouse_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  phone VARCHAR(50),
  manager_name VARCHAR(255),
  capacity_units INTEGER DEFAULT 10000,
  current_utilization INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== PRODUCTS TABLE ====================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category product_category DEFAULT 'regular',
  unit VARCHAR(50) DEFAULT 'PCS',
  unit_price DECIMAL(15,2) NOT NULL,
  cost_price DECIMAL(15,2),
  gst_percentage DECIMAL(5,2) DEFAULT 18,
  reorder_level INTEGER DEFAULT 100,
  eoq INTEGER DEFAULT 500,
  weight_kg DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== INVENTORY TABLE ====================
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  last_movement_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, warehouse_id)
);

-- ==================== INVENTORY MOVEMENTS TABLE ====================
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  warehouse_id UUID REFERENCES warehouses(id),
  to_warehouse_id UUID REFERENCES warehouses(id),
  movement_type movement_type NOT NULL,
  quantity INTEGER NOT NULL,
  reference_type VARCHAR(50),
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== ORDERS TABLE ====================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  required_date TIMESTAMP WITH TIME ZONE,
  status order_status DEFAULT 'pending',
  priority INTEGER DEFAULT 5,
  subtotal DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  shipping_address TEXT,
  shipping_city VARCHAR(100),
  shipping_state VARCHAR(100),
  shipping_pincode VARCHAR(20),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== ORDER ITEMS TABLE ====================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  tax_percentage DECIMAL(5,2) DEFAULT 0,
  line_total DECIMAL(15,2) DEFAULT 0,
  dispatched_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== INVOICES TABLE ====================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id),
  customer_id UUID REFERENCES customers(id),
  invoice_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  subtotal DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  amount_paid DECIMAL(15,2) DEFAULT 0,
  amount_due DECIMAL(15,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  payment_status payment_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== PAYMENTS TABLE ====================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_id UUID REFERENCES invoices(id),
  customer_id UUID REFERENCES customers(id),
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  amount DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'bank_transfer',
  reference_number VARCHAR(100),
  bank_name VARCHAR(100),
  cheque_number VARCHAR(100),
  notes TEXT,
  received_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== MATERIAL REJECTIONS TABLE ====================
CREATE TABLE material_rejections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rejection_number VARCHAR(50) UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id),
  invoice_id UUID REFERENCES invoices(id),
  customer_id UUID REFERENCES customers(id),
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  rejection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending',
  resolution VARCHAR(50),
  resolution_date TIMESTAMP WITH TIME ZONE,
  credit_issued DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== PRODUCTION TRACKING TABLE ====================
CREATE TABLE production_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  batch_number VARCHAR(100),
  planned_quantity INTEGER NOT NULL,
  produced_quantity INTEGER DEFAULT 0,
  rejected_quantity INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  expected_completion_date TIMESTAMP WITH TIME ZONE,
  actual_completion_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'planned',
  factory VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== NOTIFICATIONS TABLE ====================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  reference_type VARCHAR(50),
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== AUDIT LOG TABLE ====================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(100),
  record_id UUID,
  action VARCHAR(50),
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES users(id),
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== FACTORY TABLE ====================
CREATE TABLE factories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  factory_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  phone VARCHAR(50),
  manager_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== DISPATCH TRACKING TABLE ====================
CREATE TABLE dispatches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispatch_number VARCHAR(50) UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id),
  warehouse_id UUID REFERENCES warehouses(id),
  dispatch_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  transporter_name VARCHAR(255),
  vehicle_number VARCHAR(50),
  driver_name VARCHAR(255),
  driver_phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'dispatched',
  expected_delivery_date TIMESTAMP WITH TIME ZONE,
  actual_delivery_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== DISPATCH ITEMS TABLE ====================
CREATE TABLE dispatch_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispatch_id UUID REFERENCES dispatches(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  order_item_id UUID REFERENCES order_items(id),
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== ENABLE RLS ON ALL TABLES ====================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_rejections ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE factories ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_items ENABLE ROW LEVEL SECURITY;