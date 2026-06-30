import { useState, useEffect } from 'react';
import { apiService } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Payment, Invoice, Customer } from '../../types';
import { Card, Button, Badge, Modal, Input, Select, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableCell } from '../common/StatusBadge';
import { Plus, Search, CreditCard, DollarSign, Check, Calendar, Building } from 'lucide-react';

// ---- Helper functions for robust field extraction ----
const getPaymentNumber = (p: any) => p.payment_number ?? p.paymentNumber ?? 'N/A';
const getPaymentDate = (p: any) => p.payment_date ?? p.paymentDate ?? null;
const getCustomerName = (p: any) => {
  if (p.customer) {
    if (p.customer.company_name) return p.customer.company_name;
    if (p.customer.companyName) return p.customer.companyName;
    if (p.customer.name) return p.customer.name;
    if (p.customer.full_name) return p.customer.full_name;
    if (p.customer.fullName) return p.customer.fullName;
    if (p.customer.business_name) return p.customer.business_name;
  }
  if (p.customerName) return p.customerName;
  if (p.customer_name) return p.customer_name;
  return 'N/A';
};
const getPaymentMethod = (p: any) => p.payment_method ?? p.paymentMethod ?? 'N/A';
const getAmount = (p: any) => p.amount ?? 0;
const getInvoiceNumber = (p: any) => {
  if (p.invoice?.invoice_number) return p.invoice.invoice_number;
  if (p.invoice?.invoiceNumber) return p.invoice.invoiceNumber;
  if (p.invoiceNumber) return p.invoiceNumber;
  if (p.invoice_number) return p.invoice_number;
  return 'N/A';
};
const getReferenceNumber = (p: any) => p.reference_number ?? p.referenceNumber ?? 'N/A';

const formatCurrency = (amount: number) => {
  return `E ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount || 0)}`;
};
const formatDate = (date: any) => date ? new Date(date).toLocaleDateString() : 'Invalid Date';

export default function PaymentManagement() {
  const { user, customer } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [user, customer]);

  // ===== UPDATED fetchPayments – no more "undefined" =====
  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      // ✅ Build params conditionally
      const params: any = {
        page: 1,
        limit: 100,
      };
      // Only add customer_id if user is a customer and has an ID
      if (user?.role === 'customer' && customer?.id) {
        params.customer_id = customer.id;
      }
      console.log('📤 Payments params:', params);  // debug

      const response = await apiService.getPayments(params);
      console.log('📦 Raw payments response:', response);

      let data = null;
      const root = response || {};
      if (Array.isArray(root)) {
        data = root;
      } else if (root.data) {
        if (Array.isArray(root.data)) {
          data = root.data;
        } else if (typeof root.data === 'object') {
          const nested = root.data;
          const possibleKeys = ['content', 'items', 'results', 'data', 'list', 'records', 'rows', 'payments'];
          for (const key of possibleKeys) {
            if (Array.isArray(nested[key])) {
              data = nested[key];
              console.log(`✅ Found payments in response.data.${key} (length: ${data.length})`);
              break;
            }
          }
          if (!data && Array.isArray(nested)) data = nested;
        }
      } else {
        const topKeys = ['content', 'items', 'results', 'data', 'list', 'records', 'rows', 'payments'];
        for (const key of topKeys) {
          if (Array.isArray(root[key])) {
            data = root[key];
            console.log(`✅ Found payments in response.${key} (length: ${data.length})`);
            break;
          }
        }
      }
      if (!data && response?.data?.content) {
        data = response.data.content;
        console.log('✅ Fallback: found payments in response.data.content');
      }
      if (!data) {
        console.warn('⚠️ No payments array found – using empty array.');
        data = [];
      }

      setPayments(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        console.log('🔍 First payment sample:', data[0]);
        console.log('🔍 Customer object in payment:', data[0].customer);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
    }
    setIsLoading(false);
  };

  const filteredPayments = payments.filter((p) => {
    if (!p) return false;
    const searchLower = searchQuery.toLowerCase().trim();
    const paymentNumber = getPaymentNumber(p).toLowerCase();
    const customerName = getCustomerName(p).toLowerCase();
    return paymentNumber.includes(searchLower) || customerName.includes(searchLower);
  });

  const totalReceived = payments.reduce((sum, p) => sum + getAmount(p), 0);

  const thisMonthPayments = payments.filter(p => {
    const date = getPaymentDate(p);
    if (!date) return false;
    const d = new Date(date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthTotal = thisMonthPayments.reduce((sum, p) => sum + getAmount(p), 0);

  const bankTransferCount = payments.filter(p => {
    const method = getPaymentMethod(p);
    return method === 'bank_transfer' || method === 'bankTransfer';
  }).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const isCustomerView = user?.role === 'customer';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="text-slate-500 mt-1">{isCustomerView ? 'Your payment history' : 'Track customer payments'}</p>
        </div>
        {!isCustomerView && (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Payments</p>
              <p className="text-2xl font-bold text-slate-900">{payments.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">{isCustomerView ? 'Total Paid' : 'Total Received'}</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalReceived)}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">This Month</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(thisMonthTotal)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Bank Transfers</p>
              <p className="text-2xl font-bold text-slate-900">{bankTransferCount}</p>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl">
              <Building className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <EmptyState message="No payments found" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Payment #</TableCell>
                <TableCell header>Customer</TableCell>
                <TableCell header>Invoice</TableCell>
                <TableCell header>Date</TableCell>
                <TableCell header>Amount</TableCell>
                <TableCell header>Method</TableCell>
                <TableCell header>Reference</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium">{getPaymentNumber(payment)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getCustomerName(payment)}</TableCell>
                  <TableCell>{getInvoiceNumber(payment)}</TableCell>
                  <TableCell>{formatDate(getPaymentDate(payment))}</TableCell>
                  <TableCell className="font-semibold text-emerald-600">{formatCurrency(getAmount(payment))}</TableCell>
                  <TableCell>
                    <Badge variant="default">{getPaymentMethod(payment)}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{getReferenceNumber(payment)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <AddPaymentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchPayments();
        }}
      />
    </div>
  );
}

// ========== Add Payment Modal ==========
function AddPaymentModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_id: '',
    amount: 0,
    payment_method: 'bank_transfer',
    reference_number: '',
    bank_name: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCustomersAndInvoices();
    }
  }, [isOpen]);

  const fetchCustomersAndInvoices = async () => {
    setLoadingCustomers(true);
    setLoadingInvoices(true);
    setError('');
    try {
      const custRes = await apiService.getCustomers({ page: 1, limit: 200 });
      const custData = custRes.data?.data || custRes.data?.content || custRes.data || [];
      const activeCustomers = (Array.isArray(custData) ? custData : []).filter((c: any) => c.is_active !== false);
      setCustomers(activeCustomers);
      console.log('✅ Customers loaded:', activeCustomers.length);

      const invRes = await apiService.getInvoices({ page: 1, limit: 200 });
      const invData = invRes.data?.data || invRes.data?.content || invRes.data || [];
      const pendingInvoices = (Array.isArray(invData) ? invData : []).filter((i: any) =>
        ['pending', 'partial'].includes(i.payment_status)
      );
      setInvoices(pendingInvoices);
      console.log('✅ Invoices loaded:', pendingInvoices.length);
    } catch (err: any) {
      console.error('❌ Error loading data:', err);
      setError(err.message || 'Failed to load customers or invoices.');
    } finally {
      setLoadingCustomers(false);
      setLoadingInvoices(false);
    }
  };

  const filteredInvoices = formData.customer_id
    ? invoices.filter(i => i.customer_id === formData.customer_id)
    : [];

  const handleCustomerChange = (customerId: string) => {
    setFormData({
      ...formData,
      customer_id: customerId,
      invoice_id: '',
      amount: 0,
    });
  };

  const handleInvoiceChange = (invoiceId: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    setFormData({
      ...formData,
      invoice_id: invoiceId,
      amount: invoice ? invoice.amount_due : formData.amount,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.customer_id) {
      setError('Please select a customer.');
      return;
    }
    if (formData.amount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    setIsSubmitting(true);

    try {
      await apiService.createPayment({
        invoice_id: formData.invoice_id || undefined,
        customer_id: formData.customer_id,
        amount: formData.amount,
        payment_method: formData.payment_method,
        reference_number: formData.reference_number,
        bank_name: formData.bank_name,
        notes: formData.notes,
      });

      onSuccess();
      setFormData({
        customer_id: '',
        invoice_id: '',
        amount: 0,
        payment_method: 'bank_transfer',
        reference_number: '',
        bank_name: '',
        notes: '',
      });
    } catch (err: any) {
      console.error('Error recording payment:', err);
      setError(err.message || 'Failed to record payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Customer <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.customer_id}
            onChange={(e) => handleCustomerChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loadingCustomers}
          >
            <option value="">{loadingCustomers ? 'Loading customers...' : 'Select customer'}</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.company_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Apply to Invoice (optional)
          </label>
          <select
            value={formData.invoice_id}
            onChange={(e) => handleInvoiceChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!formData.customer_id || loadingInvoices}
          >
            <option value="">{loadingInvoices ? 'Loading invoices...' : 'Select invoice (optional)'}</option>
            {filteredInvoices.map((i) => (
              <option key={i.id} value={i.id}>
                {i.invoice_number} - Due: {formatCurrency(i.amount_due)}
              </option>
            ))}
          </select>
          {formData.customer_id && filteredInvoices.length === 0 && !loadingInvoices && (
            <p className="text-xs text-amber-600 mt-1">No pending invoices for this customer.</p>
          )}
        </div>

        <Input
          label="Amount"
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
          min={1}
          required
        />

        <Select
          label="Payment Method"
          value={formData.payment_method}
          onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
          options={[
            { value: 'bank_transfer', label: 'Bank Transfer' },
            { value: 'cheque', label: 'Cheque' },
            { value: 'cash', label: 'Cash' },
            { value: 'upi', label: 'UPI' },
          ]}
        />

        <Input
          label="Reference Number"
          value={formData.reference_number}
          onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
          placeholder="UTR/Transaction ID"
        />

        <Input
          label="Bank Name"
          value={formData.bank_name}
          onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
        />

        <Input
          label="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}