// src/lib/api.ts

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
const TOKEN_KEY = 'token';

class ApiService {
  // ---- Token management ----
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string | null): void {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  // ---- Core request (private) ----
  private async _request<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth: boolean = true
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (requiresAuth) {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'include',
    };

    console.log(`🌐 ${options.method || 'GET'} ${url}`, { headers, body: options.body });

    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');
    let data: any = null;

    const text = await response.text();
    console.log(`📄 Response status: ${response.status} ${response.statusText}`);
    console.log(`📄 Raw response (first 500 chars): ${text.substring(0, 500)}`);

    if (text.length > 0 && contentType && contentType.includes('application/json')) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.warn('⚠️ Failed to parse JSON response:', e);
        data = { raw: text };
      }
    } else if (text.length > 0) {
      data = { raw: text };
    }

    if (!response.ok) {
      let errorMessage = response.statusText;
      if (data?.error) errorMessage = data.error;
      else if (data?.message) errorMessage = data.message;
      else if (data?.detail) errorMessage = data.detail;
      else if (data?.raw) errorMessage = data.raw;
      const error = new Error(errorMessage || `Request failed with status ${response.status}`);
      (error as any).status = response.status;
      (error as any).data = data;
      console.error(`❌ Request failed:`, error);
      throw error;
    }

    return data;
  }

  // ---- Public request method ----
  request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this._request<T>(endpoint, options, true);
  }

  // ---- Auth ----
  login(email: string, password: string) {
    console.log('📡 Login request with:', { email, password: '***' });
    return this._request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false);
  }

  logout() {
    this.removeToken();
    return Promise.resolve();
  }

  getMe() {
    return this._request<any>('/auth/me', { method: 'GET' }, true);
  }

  // ---- Profile ----
  updateProfile(data: {
    full_name: string;
    company_name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    gst_number: string;
  }) {
    return this._request<any>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true);
  }

  // ---- Dashboard ----
  getDashboardStats() {
    return this._request<any>('/dashboard/stats', { method: 'GET' }, true);
  }

  getTopProducts() {
    return this._request<any>('/dashboard/top-products', { method: 'GET' }, true);
  }

  getCustomerDashboard() {
    return this._request<any>('/dashboard/customer', { method: 'GET' }, true);
  }

  // ---- Notifications ----
  getNotifications(params?: { unread_only?: boolean }) {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this._request<any>(`/notifications${query}`, { method: 'GET' }, true);
  }

  createNotification(data: { title: string; message: string; type: string; referenceId?: string }) {
    return this._request<any>('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  markNotificationRead(id: string) {
    return this._request<any>(`/notifications/${id}/read`, {
      method: 'PATCH',
    }, true);
  }

  markAllNotificationsRead() {
    return this._request<any>('/notifications/read-all', {
      method: 'PATCH',
    }, true);
  }

  deleteNotification(id: string) {
    return this._request<any>(`/notifications/${id}`, {
      method: 'DELETE',
    }, true);
  }

  // ---- Users ----
  getUsers() {
    return this._request<any>('/users', { method: 'GET' }, true);
  }

  createInternalUser(data: any) {
    return this._request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  // ---- Customers ----
  getCustomers(params?: { page?: number; limit?: number; search?: string; type?: string }) {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this._request<any>(`/customers${query}`, { method: 'GET' }, true);
  }

  getCustomer(id: string) {
    return this._request<any>(`/customers/${id}`, { method: 'GET' }, true);
  }

  createCustomer(data: any) {
    return this._request<any>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  updateCustomer(id: string, data: any) {
    return this._request<any>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true);
  }

  deleteCustomer(id: string) {
    return this._request<any>(`/customers/${id}`, {
      method: 'DELETE',
    }, true);
  }

  // ---- Products ----
  getProducts(params?: { page?: number; limit?: number; search?: string; category?: string }) {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this._request<any>(`/products${query}`, { method: 'GET' }, true)
      .then(response => {
        console.log('🔍 getProducts raw response:', response);
        let products: any[] = [];

        if (Array.isArray(response)) {
          products = response;
        } else if (response?.data?.content && Array.isArray(response.data.content)) {
          products = response.data.content;
        } else if (response?.data && Array.isArray(response.data)) {
          products = response.data;
        } else if (response?.content && Array.isArray(response.content)) {
          products = response.content;
        } else if (response?.data?.items && Array.isArray(response.data.items)) {
          products = response.data.items;
        } else if (response?.items && Array.isArray(response.items)) {
          products = response.items;
        } else if (response && typeof response === 'object') {
          for (const key of Object.keys(response)) {
            if (Array.isArray(response[key])) {
              products = response[key];
              break;
            }
          }
        }

        console.log('✅ Extracted products:', products);
        return products;
      })
      .catch(error => {
        console.error('❌ getProducts error:', error);
        return [];
      });
  }

  createProduct(data: any) {
    return this._request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  updateProduct(id: string, data: any) {
    return this._request<any>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true);
  }

  deleteProduct(id: string) {
    return this._request<any>(`/products/${id}`, {
      method: 'DELETE',
    }, true);
  }

  // ---- Orders (FIXED with comprehensive extraction) ----
  getOrders(params?: { page?: number; limit?: number; status?: string; customer_id?: string }) {
    return this._request<any>(`/orders${params ? `?${new URLSearchParams(params as any).toString()}` : ''}`, { method: 'GET' }, true)
      .then(response => {
        console.log('🔍 getOrders raw response:', response);
        let orders: any[] = [];

        try {
          // 1) If response is already an array
          if (Array.isArray(response)) {
            orders = response;
          }
          // 2) If response.data is an array
          else if (response?.data && Array.isArray(response.data)) {
            orders = response.data;
          }
          // 3) If response.data has a content array (pagination)
          else if (response?.data?.content && Array.isArray(response.data.content)) {
            orders = response.data.content;
          }
          // 4) If response.data has an items array
          else if (response?.data?.items && Array.isArray(response.data.items)) {
            orders = response.data.items;
          }
          // 5) If response.data has a data array (nested)
          else if (response?.data?.data && Array.isArray(response.data.data)) {
            orders = response.data.data;
          }
          // 6) If response itself has a content or items array
          else if (response?.content && Array.isArray(response.content)) {
            orders = response.content;
          }
          else if (response?.items && Array.isArray(response.items)) {
            orders = response.items;
          }
          // 7) Fallback: scan all keys of response and response.data for an array
          else if (response && typeof response === 'object') {
            // First scan top-level keys
            for (const key of Object.keys(response)) {
              if (Array.isArray(response[key])) {
                orders = response[key];
                break;
              }
            }
            // If not found, scan response.data
            if (orders.length === 0 && response.data && typeof response.data === 'object') {
              for (const key of Object.keys(response.data)) {
                if (Array.isArray(response.data[key])) {
                  orders = response.data[key];
                  break;
                }
              }
            }
          }
        } catch (e) {
          console.error('Error extracting orders:', e);
        }

        console.log('✅ Extracted orders:', orders);
        return { data: orders };
      })
      .catch(error => {
        console.error('❌ getOrders error:', error);
        return { data: [] };
      });
  }

  getOrder(id: string) {
    return this._request<any>(`/orders/${id}`, { method: 'GET' }, true);
  }

  createOrder(data: any) {
    return this._request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  updateOrderStatus(id: string, status: string) {
    return this._request<any>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }, true);
  }

  // ---- Invoices ----
  getInvoices(params?: { page?: number; limit?: number; payment_status?: string; customer_id?: string }) {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this._request<any>(`/invoices${query}`, { method: 'GET' }, true);
  }

  // ---- Payments ----
  getPayments(params?: { page?: number; limit?: number; customer_id?: string }) {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this._request<any>(`/payments${query}`, { method: 'GET' }, true);
  }

  createPayment(data: any) {
    return this._request<any>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  // ---- Inventory ----
  getInventory(params?: { page?: number; limit?: number; warehouse_id?: string }) {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this._request<any>(`/inventory${query}`, { method: 'GET' }, true);
  }

  adjustInventory(data: any) {
    return this._request<any>('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  // ---- Warehouses ----
  getWarehouses() {
    return this._request<any>('/warehouses', { method: 'GET' }, true);
  }

  // ---- Production ----
  getProduction(params?: { page?: number; limit?: number; status?: string }) {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this._request<any>(`/production${query}`, { method: 'GET' }, true);
  }

  // ---- Rejections ----
  getRejections(params?: { page?: number; limit?: number; status?: string }) {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this._request<any>(`/rejections${query}`, { method: 'GET' }, true);
  }

  updateRejection(id: string, data: any) {
    return this._request<any>(`/rejections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
  }
}

export const apiService = new ApiService();