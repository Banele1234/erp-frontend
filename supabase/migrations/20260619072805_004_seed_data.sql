-- Create default admin user (password would be set via Supabase Auth)
-- This creates a user record that links to Supabase Auth

-- Insert sample factories
INSERT INTO factories (factory_code, name, location, city, state, phone, manager_name) VALUES
('FAC001', 'Factory - North', 'Industrial Area A', 'Delhi', 'Delhi', '+91-11-12345678', 'Rajesh Kumar'),
('FAC002', 'Factory - West', 'Industrial Zone B', 'Mumbai', 'Maharashtra', '+91-22-23456789', 'Priya Sharma'),
('FAC003', 'Factory - South', 'Tech Park C', 'Chennai', 'Tamil Nadu', '+91-44-34567890', 'Anand Krishnan'),
('FAC004', 'Factory - East', 'Industrial Estate D', 'Kolkata', 'West Bengal', '+91-33-45678901', 'Amit Das');

-- Insert sample warehouses
INSERT INTO warehouses (warehouse_code, name, location, city, state, phone, manager_name, capacity_units, current_utilization) VALUES
('WH001', 'Central Warehouse', 'Industrial Area, Sector 15', 'Delhi', 'Delhi', '+91-9876543210', 'Suresh Verma', 50000, 35000),
('WH002', 'Mumbai Distribution Hub', 'Andheri East', 'Mumbai', 'Maharashtra', '+91-9876543211', 'Neha Patel', 40000, 28000),
('WH003', 'Chennai Depot', 'Guindy Industrial Estate', 'Chennai', 'Tamil Nadu', '+91-9876543212', 'Karthik Rajan', 35000, 22000),
('WH004', 'Kolkata Storage', 'New Town', 'Kolkata', 'West Bengal', '+91-9876543213', 'Subrata Roy', 30000, 18000);

-- Insert sample products
INSERT INTO products (product_code, name, description, category, unit, unit_price, cost_price, gst_percentage, reorder_level, eoq, weight_kg) VALUES
('PRD001', 'Brake Pad Assembly', 'Front brake pad assembly for two-wheelers', 'fast_moving', 'SET', 1250.00, 900.00, 18, 500, 2000, 1.5),
('PRD002', 'Clutch Plate Set', 'Heavy duty clutch plate set', 'fast_moving', 'SET', 850.00, 600.00, 18, 400, 1500, 0.8),
('PRD003', 'Air Filter Element', 'High efficiency air filter', 'regular', 'PCS', 350.00, 220.00, 18, 300, 1000, 0.3),
('PRD004', 'Oil Filter Cartridge', 'Premium oil filter cartridge', 'fast_moving', 'PCS', 280.00, 180.00, 18, 600, 2500, 0.25),
('PRD005', 'Spark Plug - Standard', 'Copper core spark plug', 'regular', 'PCS', 150.00, 90.00, 18, 1000, 4000, 0.1),
('PRD006', 'Spark Plug - Platinum', 'Long life platinum spark plug', 'regular', 'PCS', 380.00, 250.00, 18, 200, 800, 0.1),
('PRD007', 'Disc Brake Rotor', 'Vented disc brake rotor', 'slow_moving', 'PCS', 2200.00, 1600.00, 18, 50, 200, 3.5),
('PRD008', 'Shock Absorber - Front', 'Gas charged front shock absorber pair', 'seasonal', 'PAIR', 3500.00, 2500.00, 18, 100, 400, 4.2),
('PRD009', 'Drive Chain Kit', 'Heavy duty drive chain with sprockets', 'fast_moving', 'SET', 1800.00, 1200.00, 18, 300, 1200, 2.0),
('PRD010', 'Battery - 12V 5Ah', 'Maintenance free two-wheeler battery', 'fast_moving', 'PCS', 1500.00, 1000.00, 18, 400, 1600, 3.0),
('PRD011', 'Headlamp Assembly', 'LED headlamp unit complete', 'regular', 'SET', 2800.00, 1800.00, 18, 150, 600, 1.2),
('PRD012', 'Tail Lamp LED', 'LED tail lamp with indicators', 'regular', 'PCS', 1200.00, 750.00, 18, 200, 800, 0.4),
('PRD013', 'Engine Oil - 20W50', 'Synthetic engine oil 1L', 'fast_moving', 'LTR', 450.00, 300.00, 18, 2000, 8000, 0.9),
('PRD014', 'Coolant - Concentrate', 'Engine coolant concentrate 1L', 'slow_moving', 'LTR', 350.00, 220.00, 18, 100, 500, 0.95),
('PRD015', 'Brake Fluid - DOT4', 'Premium brake fluid 500ml', 'regular', 'LTR', 280.00, 180.00, 18, 300, 1200, 0.55);

-- Insert sample customers
INSERT INTO customers (customer_code, company_name, contact_person, phone, address, city, state, country, pincode, gst_number, customer_type, rating, credit_limit, discount_percentage, payment_days) VALUES
('CUS001', 'Honda Motors India Pvt Ltd', 'Ramesh Singh', '+91-9988776655', 'Sector 18, Industrial Area', 'Gurgaon', 'Haryana', 'India', '122015', '06AABCH1234P1ZA', 'oem', 'gold', 5000000, 15, 45),
('CUS002', 'Hero MotoCorp Dealers', 'Vijay Kumar', '+91-9876543210', 'Karnal Road, Industrial Estate', 'Delhi', 'Delhi', 'India', '110033', '07AABCN5678R2PB', 'exclusive_dealer', 'gold', 2000000, 12, 30),
('CUS003', 'Bajaj Auto Parts Store', 'Amit Sharma', '+91-8765432109', 'Andheri West', 'Mumbai', 'Maharashtra', 'India', '400058', '27AABCB9012K3ZC', 'regular_dealer', 'silver', 1000000, 8, 30),
('CUS004', 'TVS Motors Distribution', 'Srinivas Rao', '+91-7654321098', 'Guindy', 'Chennai', 'Tamil Nadu', 'India', '600032', '33AABCT4567P1ZD', 'exclusive_dealer', 'silver', 1500000, 10, 45),
('CUS005', 'Royal Enfield Parts', 'Harpreet Kaur', '+91-6543210987', 'Vikas Nagar', 'Ludhiana', 'Punjab', 'India', '141001', '03AABCR8901L2ZE', 'regular_dealer', 'bronze', 500000, 5, 30),
('CUS006', 'Yamaha India Dealership', 'Kiran Desai', '+91-9876501234', 'Electronic City', 'Bangalore', 'Karnataka', 'India', '560100', '29AABCY2345M1ZF', 'exclusive_dealer', 'gold', 2500000, 15, 45),
('CUS007', 'Suzuki Two Wheeler Parts', 'Manoj Patel', '+91-9988123456', 'Sanath Nagar', 'Hyderabad', 'Telangana', 'India', '500018', '36AABCS6789N1ZG', 'regular_dealer', 'bronze', 800000, 5, 30),
('CUS008', 'Mahindra Auto Parts', 'Deepak Joshi', '+91-8877665544', 'Nigdi', 'Pune', 'Maharashtra', 'India', '411044', '27AABCM0123P4ZH', 'regular_dealer', 'silver', 1200000, 10, 30);

-- Insert initial inventory for products across warehouses
INSERT INTO inventory (product_id, warehouse_id, quantity, reserved_quantity)
SELECT p.id, w.id, 
  CASE 
    WHEN p.product_code IN ('PRD001', 'PRD002', 'PRD004', 'PRD009', 'PRD010', 'PRD013') THEN FLOOR(RANDOM() * 800 + 200)
    WHEN p.product_code = 'PRD007' THEN FLOOR(RANDOM() * 40 + 10)
    WHEN p.product_code = 'PRD008' THEN FLOOR(RANDOM() * 80 + 20)
    ELSE FLOOR(RANDOM() * 150 + 50)
  END,
  FLOOR(RANDOM() * 50)
FROM products p
CROSS JOIN warehouses w
WHERE w.warehouse_code IN ('WH001', 'WH002', 'WH003', 'WH004');

-- Function to update inventory
CREATE OR REPLACE FUNCTION adjust_inventory(
  p_product_id UUID,
  p_warehouse_id UUID,
  p_quantity INTEGER
)
RETURNS void AS $$
BEGIN
  INSERT INTO inventory (product_id, warehouse_id, quantity, reserved_quantity)
  VALUES (p_product_id, p_warehouse_id, p_quantity, 0)
  ON CONFLICT (product_id, warehouse_id)
  DO UPDATE SET
    quantity = inventory.quantity + p_quantity,
    last_movement_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get customer discount based on rating
CREATE OR REPLACE FUNCTION get_customer_discount(p_customer_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_rating customer_rating;
  v_discount DECIMAL(5,2);
BEGIN
  SELECT rating INTO v_rating FROM customers WHERE id = p_customer_id;
  
  CASE v_rating
    WHEN 'gold' THEN v_discount := 15;
    WHEN 'silver' THEN v_discount := 10;
    WHEN 'bronze' THEN v_discount := 5;
    ELSE v_discount := 0;
  END CASE;
  
  RETURN v_discount;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create notifications for new orders
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, reference_id)
  VALUES (
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    'New Order Received',
    CONCAT('Order ', NEW.order_number, ' has been placed'),
    'order',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_notification AFTER INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION notify_new_order();