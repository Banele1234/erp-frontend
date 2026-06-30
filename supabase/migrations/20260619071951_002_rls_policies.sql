-- ==================== RLS POLICIES FOR USERS ====================
CREATE POLICY "select_own_users" ON users FOR SELECT
  TO authenticated USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management')
  ));
CREATE POLICY "insert_users" ON users FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));
CREATE POLICY "update_own_users" ON users FOR UPDATE
  TO authenticated USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )) WITH CHECK (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));
CREATE POLICY "delete_users" ON users FOR DELETE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- ==================== RLS POLICIES FOR CUSTOMERS ====================
CREATE POLICY "select_own_customers" ON customers FOR SELECT
  TO authenticated USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management', 'warehouse_staff')
    )
  );
CREATE POLICY "insert_customers" ON customers FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management')
  ));
CREATE POLICY "update_customers" ON customers FOR UPDATE
  TO authenticated USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management')
    )
  );
CREATE POLICY "delete_customers" ON customers FOR DELETE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- ==================== RLS POLICIES FOR WAREHOUSES ====================
CREATE POLICY "select_warehouses" ON warehouses FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_warehouses" ON warehouses FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management')
  ));
CREATE POLICY "update_warehouses" ON warehouses FOR UPDATE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management', 'warehouse_staff')
  ));
CREATE POLICY "delete_warehouses" ON warehouses FOR DELETE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- ==================== RLS POLICIES FOR PRODUCTS ====================
CREATE POLICY "select_products" ON products FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management')
  ));
CREATE POLICY "update_products" ON products FOR UPDATE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management', 'warehouse_staff')
  ));
CREATE POLICY "delete_products" ON products FOR DELETE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- ==================== RLS POLICIES FOR INVENTORY ====================
CREATE POLICY "select_inventory" ON inventory FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_inventory" ON inventory FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management', 'warehouse_staff')
  ));
CREATE POLICY "update_inventory" ON inventory FOR UPDATE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management', 'warehouse_staff')
  ));
CREATE POLICY "delete_inventory" ON inventory FOR DELETE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- ==================== RLS POLICIES FOR INVENTORY MOVEMENTS ====================
CREATE POLICY "select_inventory_movements" ON inventory_movements FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_inventory_movements" ON inventory_movements FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management', 'warehouse_staff')
  ));
CREATE POLICY "delete_inventory_movements" ON inventory_movements FOR DELETE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- ==================== RLS POLICIES FOR ORDERS ====================
CREATE POLICY "select_own_orders" ON orders FOR SELECT
  TO authenticated USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management', 'warehouse_staff', 'production')
    )
  );
CREATE POLICY "insert_orders" ON orders FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_orders" ON orders FOR UPDATE
  TO authenticated USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management', 'warehouse_staff', 'production')
    )
  );
CREATE POLICY "delete_orders" ON orders FOR DELETE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management')
  ));

-- ==================== RLS POLICIES FOR ORDER ITEMS ====================
CREATE POLICY "select_order_items" ON order_items FOR SELECT
  TO authenticated USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    ) OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management', 'warehouse_staff', 'production')
    )
  );
CREATE POLICY "insert_order_items" ON order_items FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_order_items" ON order_items FOR UPDATE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management', 'warehouse_staff')
  ));
CREATE POLICY "delete_order_items" ON order_items FOR DELETE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management')
  ));

-- ==================== RLS POLICIES FOR INVOICES ====================
CREATE POLICY "select_own_invoices" ON invoices FOR SELECT
  TO authenticated USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management', 'warehouse_staff')
    )
  );
CREATE POLICY "insert_invoices" ON invoices FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management', 'warehouse_staff')
  ));
CREATE POLICY "update_invoices" ON invoices FOR UPDATE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management', 'warehouse_staff')
  ));

-- ==================== RLS POLICIES FOR PAYMENTS ====================
CREATE POLICY "select_own_payments" ON payments FOR SELECT
  TO authenticated USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management')
    )
  );
CREATE POLICY "insert_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management')
  ));
CREATE POLICY "update_payments" ON payments FOR UPDATE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management')
  ));

-- ==================== RLS POLICIES FOR MATERIAL REJECTIONS ====================
CREATE POLICY "select_rejections" ON material_rejections FOR SELECT
  TO authenticated USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management', 'warehouse_staff', 'production')
    )
  );
CREATE POLICY "insert_rejections" ON material_rejections FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_rejections" ON material_rejections FOR UPDATE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management', 'warehouse_staff')
  ));

-- ==================== RLS POLICIES FOR PRODUCTION TRACKING ====================
CREATE POLICY "select_production" ON production_tracking FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_production" ON production_tracking FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management', 'production')
  ));
CREATE POLICY "update_production" ON production_tracking FOR UPDATE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management', 'production')
  ));
CREATE POLICY "delete_production" ON production_tracking FOR DELETE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- ==================== RLS POLICIES FOR NOTIFICATIONS ====================
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (user_id = auth.uid());
CREATE POLICY "insert_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (user_id = auth.uid());
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ==================== RLS POLICIES FOR AUDIT LOG ====================
CREATE POLICY "select_audit_log" ON audit_log FOR SELECT
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));
CREATE POLICY "insert_audit_log" ON audit_log FOR INSERT
  TO authenticated WITH CHECK (true);

-- ==================== RLS POLICIES FOR FACTORIES ====================
CREATE POLICY "select_factories" ON factories FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_factories" ON factories FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management')
  ));
CREATE POLICY "update_factories" ON factories FOR UPDATE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management')
  ));
CREATE POLICY "delete_factories" ON factories FOR DELETE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- ==================== RLS POLICIES FOR DISPATCHES ====================
CREATE POLICY "select_dispatches" ON dispatches FOR SELECT
  TO authenticated USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    ) OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management', 'warehouse_staff')
    )
  );
CREATE POLICY "insert_dispatches" ON dispatches FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management', 'warehouse_staff')
  ));
CREATE POLICY "update_dispatches" ON dispatches FOR UPDATE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management', 'warehouse_staff')
  ));

-- ==================== RLS POLICIES FOR DISPATCH ITEMS ====================
CREATE POLICY "select_dispatch_items" ON dispatch_items FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_dispatch_items" ON dispatch_items FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management', 'warehouse_staff')
  ));
CREATE POLICY "delete_dispatch_items" ON dispatch_items FOR DELETE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'management', 'warehouse_staff')
  ));