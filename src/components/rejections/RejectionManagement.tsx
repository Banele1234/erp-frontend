import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/api';
import { MaterialRejection, Customer, Product, Order, Warehouse } from '../../types';
import { Card, Button, Badge, Modal, Input, Select, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableCell } from '../common/StatusBadge';
import { Plus, Search, AlertTriangle, Check, X, Clock } from 'lucide-react';

export default function RejectionManagement() {
  const { user } = useAuth();
  const [rejections, setRejections] = useState<MaterialRejection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedRejection, setSelectedRejection] = useState<MaterialRejection | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // For create modal
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    fetchRejections();
  }, []);

  const fetchRejections = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: 1,
        limit: 100,
      };
      if (filterStatus) {
        params.status = filterStatus;
      }

      const response = await apiService.getRejections(params);
      const data = response.data?.data || response.data?.content || response.data || [];
      setRejections(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching rejections:', error);
      setRejections([]);
    }
    setIsLoading(false);
  };

  const fetchOptions = async () => {
    if (loadingOptions) return;
    setLoadingOptions(true);
    try {
      const [custRes, prodRes, whRes, orderRes] = await Promise.all([
        apiService.getCustomers({ limit: 500 }),
        apiService.getProducts({ limit: 500 }),
        apiService.getWarehouses(),
        apiService.getOrders({ limit: 500 }),
      ]);
      setCustomers(Array.isArray(custRes) ? custRes : []);
      setProducts(Array.isArray(prodRes) ? prodRes : []);
      setWarehouses(Array.isArray(whRes) ? whRes : []);
      setOrders(Array.isArray(orderRes) ? orderRes : []);
    } catch (err) {
      console.error('Failed to load options:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  const openCreateModal = () => {
    fetchOptions();
    setShowCreateModal(true);
  };

  // ✅ Fixed: use camelCase field names (rejectionNumber, rejectionDate, creditIssued, customer.companyName, product.name)
  const filteredRejections = rejections.filter((r) => {
    if (!r) return false;
    const searchLower = searchQuery.toLowerCase().trim();
    const rejectionNumber = (r.rejectionNumber || '').toLowerCase();
    const companyName = (r.customer?.companyName || '').toLowerCase();
    const matchesSearch = rejectionNumber.includes(searchLower) || companyName.includes(searchLower);
    const matchesStatus = !filterStatus || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return `E ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)}`;
  };

  const pendingCount = rejections.filter(r => r.status === 'pending').length;
  const resolvedCount = rejections.filter(r => r.status === 'resolved').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const canCreate = user?.role === 'admin' || user?.role === 'warehouse_staff' || user?.role === 'management';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Material Rejections</h1>
          <p className="text-slate-500 mt-1">Track and manage customer rejections</p>
        </div>
        {canCreate && (
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Create Rejection
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Rejections</p>
              <p className="text-2xl font-bold text-slate-900">{rejections.length}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Resolved</p>
              <p className="text-2xl font-bold text-emerald-600">{resolvedCount}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Credit Issued</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(rejections.reduce((sum, r) => sum + (r.creditIssued || 0), 0))}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search rejections..."
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
              { value: 'pending', label: 'Pending' },
              { value: 'in_review', label: 'In Review' },
              { value: 'resolved', label: 'Resolved' },
            ]}
            className="w-40"
          />
        </div>

        {filteredRejections.length === 0 ? (
          <EmptyState message="No rejections found" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Rejection #</TableCell>
                <TableCell header>Customer</TableCell>
                <TableCell header>Product</TableCell>
                <TableCell header>Qty</TableCell>
                <TableCell header>Reason</TableCell>
                <TableCell header>Date</TableCell>
                <TableCell header>Status</TableCell>
                <TableCell header>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRejections.map((rejection) => (
                <TableRow key={rejection.id}>
                  <TableCell className="font-medium">{rejection.rejectionNumber}</TableCell>
                  <TableCell>{rejection.customer?.companyName}</TableCell>
                  <TableCell>{rejection.product?.name}</TableCell>
                  <TableCell>{rejection.quantity}</TableCell>
                  <TableCell className="max-w-xs truncate">{rejection.reason}</TableCell>
                  <TableCell>
                    {rejection.rejectionDate ? new Date(rejection.rejectionDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      rejection.status === 'pending' ? 'warning' :
                      rejection.status === 'resolved' ? 'success' : 'info'
                    }>
                      {rejection.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {rejection.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRejection(rejection);
                          setShowDetailModal(true);
                        }}
                      >
                        Resolve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <ResolveRejectionModal
        rejection={selectedRejection}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedRejection(null);
        }}
        onSuccess={() => {
          setShowDetailModal(false);
          fetchRejections();
        }}
      />

      <CreateRejectionModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
        }}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchRejections();
        }}
        customers={customers}
        products={products}
        warehouses={warehouses}
        orders={orders}
        loading={loadingOptions}
      />
    </div>
  );
}

// ---------- Resolve Rejection Modal ----------
function ResolveRejectionModal({
  rejection,
  isOpen,
  onClose,
  onSuccess,
}: {
  rejection: MaterialRejection | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    resolution: '',
    credit_issued: 0,
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (rejection) {
      const creditAmount = (rejection.product?.unitPrice || 0) * (rejection.quantity || 0);
      setFormData({
        resolution: '',
        credit_issued: creditAmount,
        notes: '',
      });
    }
  }, [rejection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejection) return;
    setIsSubmitting(true);
    try {
      await apiService.updateRejection(rejection.id, {
        status: 'resolved',
        resolution: formData.resolution,
        credit_issued: formData.credit_issued,
        notes: formData.notes,
      });
      onSuccess();
    } catch (error) {
      console.error('Error resolving rejection:', error);
      alert('Failed to resolve rejection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!rejection) return null;

  const formatCurrency = (amount: number) => {
    return `E ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Resolve Rejection" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">{rejection.product?.name}</p>
              <p className="text-sm text-amber-700">Qty: {rejection.quantity} units rejected</p>
              <p className="text-sm text-amber-600 mt-1">Reason: {rejection.reason}</p>
            </div>
          </div>
        </div>

        <Select
          label="Resolution"
          value={formData.resolution}
          onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
          options={[
            { value: 'credit_issued', label: 'Credit Issued' },
            { value: 'replacement', label: 'Replacement Sent' },
            { value: 'rejected', label: 'Claim Rejected' },
          ]}
          placeholder="Select resolution"
          required
        />

        <Input
          label="Credit Amount"
          type="number"
          value={formData.credit_issued}
          onChange={(e) => setFormData({ ...formData, credit_issued: Number(e.target.value) })}
          helpText={`${rejection.quantity} x ${formatCurrency(rejection.product?.unitPrice || 0)} = ${formatCurrency((rejection.product?.unitPrice || 0) * (rejection.quantity || 0))}`}
        />

        <Input
          label="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes"
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>Resolve</Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Create Rejection Modal ----------
function CreateRejectionModal({
  isOpen,
  onClose,
  onSuccess,
  customers,
  products,
  warehouses,
  orders,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customers: Customer[];
  products: Product[];
  warehouses: Warehouse[];
  orders: Order[];
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    customer_id: '',
    product_id: '',
    warehouse_id: '',
    order_id: '',
    quantity: 1,
    reason: '',
    rejection_date: new Date().toISOString().split('T')[0],
    credit_issued: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.product_id || !formData.warehouse_id || formData.quantity <= 0) {
      alert('Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiService.createRejection({
        customerId: formData.customer_id,
        productId: formData.product_id,
        warehouseId: formData.warehouse_id,
        orderId: formData.order_id || undefined,
        quantity: formData.quantity,
        reason: formData.reason || 'No reason provided',
        rejectionDate: formData.rejection_date,
        creditIssued: formData.credit_issued || 0,
        status: 'pending',
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating rejection:', error);
      alert('Failed to create rejection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Rejection" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {loading && <p className="text-slate-500">Loading options...</p>}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Customer *"
            value={formData.customer_id}
            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
            options={customers.map(c => ({ value: c.id, label: c.company_name }))}
            required
          />
          <Select
            label="Product *"
            value={formData.product_id}
            onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
            options={products.map(p => ({ value: p.id, label: p.name }))}
            required
          />
          <Select
            label="Warehouse *"
            value={formData.warehouse_id}
            onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
            options={warehouses.map(w => ({ value: w.id, label: w.name }))}
            required
          />
          <Select
            label="Order (optional)"
            value={formData.order_id}
            onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
            options={[
              { value: '', label: 'None' },
              ...orders.map(o => ({ value: o.id, label: o.order_number }))
            ]}
          />
          <Input
            label="Quantity *"
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
            min={1}
            required
          />
          <Input
            label="Rejection Date"
            type="date"
            value={formData.rejection_date}
            onChange={(e) => setFormData({ ...formData, rejection_date: e.target.value })}
          />
          <div className="col-span-2">
            <Input
              label="Reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Reason for rejection"
            />
          </div>
          <Input
            label="Credit Issued (optional)"
            type="number"
            value={formData.credit_issued}
            onChange={(e) => setFormData({ ...formData, credit_issued: Number(e.target.value) })}
            min={0}
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>Create Rejection</Button>
        </div>
      </form>
    </Modal>
  );
}