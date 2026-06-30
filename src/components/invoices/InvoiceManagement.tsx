import { useState, useEffect } from 'react';
import { apiService } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Invoice } from '../../types';
import { Card, Button, Badge, Modal, Input, Select, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableCell } from '../common/StatusBadge';
import { RefreshCw, FileText, Eye, CreditCard, AlertTriangle, CheckCircle, Search, DollarSign } from 'lucide-react';

const paymentStatusColors: Record<string, string> = {
  pending: 'warning',
  partial: 'info',
  paid: 'success',
  overdue: 'danger',
};

// ---- Helper functions for robust field extraction ----
const getTotal = (inv: any) => inv.total_amount ?? inv.totalAmount ?? 0;
const getPaid = (inv: any) => inv.amount_paid ?? inv.amountPaid ?? 0;
const getAmountDue = (inv: any) => getTotal(inv) - getPaid(inv);
const getInvoiceNumber = (inv: any) => inv.invoice_number ?? inv.invoiceNumber ?? 'N/A';
const getInvoiceDate = (inv: any) => inv.invoice_date ?? inv.invoiceDate ?? null;
const getDueDate = (inv: any) => inv.due_date ?? inv.dueDate ?? null;
const getCustomerName = (inv: any) => {
  if (inv.customer?.companyName) return inv.customer.companyName;
  if (inv.customer?.company_name) return inv.customer.company_name;
  if (inv.customer?.name) return inv.customer.name;
  if (inv.customerName) return inv.customerName;
  return 'N/A';
};
const getCustomerId = (inv: any) => inv.customer_id ?? inv.customerId ?? inv.customer?.id ?? null;

const formatCurrency = (amount: number) => `E ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount || 0)}`;
const formatDate = (date: any) => date ? new Date(date).toLocaleDateString() : 'N/A';

export default function InvoiceManagement() {
  const { user, customer } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, [user, customer]);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getInvoices({
        page: 1,
        limit: 100,
        payment_status: filterStatus || undefined,
        customer_id: user?.role === 'customer' && customer ? customer.id : undefined,
      });

      console.log('📦 Raw invoices response:', response);

      let data = null;
      const root = response || {};
      if (Array.isArray(root)) {
        data = root;
      } else if (root.data) {
        if (Array.isArray(root.data)) {
          data = root.data;
        } else if (typeof root.data === 'object') {
          const nested = root.data;
          const possibleKeys = ['content', 'items', 'results', 'data', 'list', 'records', 'rows', 'invoices'];
          for (const key of possibleKeys) {
            if (Array.isArray(nested[key])) {
              data = nested[key];
              console.log(`✅ Found invoices in response.data.${key} (length: ${data.length})`);
              break;
            }
          }
          if (!data && Array.isArray(nested)) data = nested;
        }
      } else {
        const topKeys = ['content', 'items', 'results', 'data', 'list', 'records', 'rows', 'invoices'];
        for (const key of topKeys) {
          if (Array.isArray(root[key])) {
            data = root[key];
            console.log(`✅ Found invoices in response.${key} (length: ${data.length})`);
            break;
          }
        }
      }
      if (!data && response?.data?.content) {
        data = response.data.content;
        console.log('✅ Fallback: found invoices in response.data.content');
      }
      if (!data) {
        console.warn('⚠️ No invoices array found – using empty array.');
        data = [];
      }

      setInvoices(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        console.log('🔍 First invoice sample:', data[0]);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
    }
    setIsLoading(false);
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (!inv) return false;
    const searchLower = searchQuery.toLowerCase().trim();
    const invoiceNumber = getInvoiceNumber(inv).toLowerCase();
    const customerName = getCustomerName(inv).toLowerCase();
    const matchesSearch = invoiceNumber.includes(searchLower) || customerName.includes(searchLower);
    const matchesStatus = !filterStatus || inv.payment_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  console.log('🔍 Filtered invoices:', filteredInvoices);
  console.log('🔍 Total invoices:', invoices.length);

  const totalOutstanding = invoices
    .filter(i => i.payment_status !== 'paid')
    .reduce((sum, i) => sum + getAmountDue(i), 0);

  const isCustomer = user?.role === 'customer';
  const isAdmin = user?.role === 'admin' || user?.role === 'management';

  const handlePayClick = (invoice: Invoice) => {
    setPaymentInvoice(invoice);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setPaymentInvoice(null);
    fetchInvoices();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="text-slate-500 mt-1">Manage customer invoices</p>
        </div>
        <Button onClick={fetchInvoices}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Invoices</p>
              <p className="text-2xl font-bold text-slate-900">{invoices.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-2xl font-bold text-amber-600">
                {invoices.filter(i => i.payment_status === 'pending').length}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Paid</p>
              <p className="text-2xl font-bold text-emerald-600">
                {invoices.filter(i => i.payment_status === 'paid').length}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Outstanding</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-red-600" />
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
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-48 rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <Button variant="outline" onClick={() => { setSearchQuery(''); setFilterStatus(''); fetchInvoices(); }}>
            Reset Filters
          </Button>
        </div>

        {filteredInvoices.length === 0 ? (
          <EmptyState message="No invoices found" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Invoice</TableCell>
                <TableCell header>Customer</TableCell>
                <TableCell header>Date</TableCell>
                <TableCell header>Due Date</TableCell>
                <TableCell header>Total</TableCell>
                <TableCell header>Paid</TableCell>
                <TableCell header>Due</TableCell>
                <TableCell header>Status</TableCell>
                <TableCell header>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => {
                const customerName = getCustomerName(invoice);
                const total = getTotal(invoice);
                const paid = getPaid(invoice);
                const due = getAmountDue(invoice);
                const status = invoice.payment_status || 'pending';
                const showPayButton = (isCustomer || isAdmin) && due > 0;

                return (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{getInvoiceNumber(invoice)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{customerName}</TableCell>
                    <TableCell>{formatDate(getInvoiceDate(invoice))}</TableCell>
                    <TableCell>{formatDate(getDueDate(invoice))}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(total)}</TableCell>
                    <TableCell className="text-emerald-600">{formatCurrency(paid)}</TableCell>
                    <TableCell className="text-red-600 font-medium">{formatCurrency(due)}</TableCell>
                    <TableCell>
                      <Badge variant={paymentStatusColors[status] as any}>
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedInvoice(invoice); setShowDetailModal(true); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {showPayButton && (
                          <Button variant="ghost" size="sm" onClick={() => handlePayClick(invoice)} className="text-emerald-600">
                            <CreditCard className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <InvoiceDetailModal
        invoice={selectedInvoice}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onUpdate={fetchInvoices}
        onPay={handlePayClick}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        invoice={paymentInvoice}
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentInvoice(null);
        }}
        onSuccess={handlePaymentSuccess}
        customer={customer}
      />
    </div>
  );
}

// ========== Detail Modal ==========
function InvoiceDetailModal({
  invoice,
  isOpen,
  onClose,
  onUpdate,
  onPay,
}: any) {
  if (!invoice) return null;

  const total = getTotal(invoice);
  const paid = getPaid(invoice);
  const due = getAmountDue(invoice);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invoice Details" size="lg">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold">{getInvoiceNumber(invoice)}</h3>
          <p className="text-slate-600">{getCustomerName(invoice)}</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-500">Invoice Date</p>
            <p>{formatDate(getInvoiceDate(invoice))}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Due Date</p>
            <p>{formatDate(getDueDate(invoice))}</p>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between"><span>Total</span><span className="font-bold">{formatCurrency(total)}</span></div>
          <div className="flex justify-between"><span>Paid</span><span className="text-emerald-600">{formatCurrency(paid)}</span></div>
          <div className="flex justify-between text-red-600"><span>Due</span><span className="font-bold">{formatCurrency(due)}</span></div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {due > 0 && <Button onClick={() => onPay(invoice)}><CreditCard className="w-4 h-4 mr-2" /> Pay Now</Button>}
        </div>
      </div>
    </Modal>
  );
}

// ========== Payment Modal ==========
function PaymentModal({
  isOpen,
  invoice,
  onClose,
  onSuccess,
  customer,
}: {
  isOpen: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onSuccess: () => void;
  customer: any;
}) {
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const amountDue = invoice ? getAmountDue(invoice) : 0;

  useEffect(() => {
    if (invoice && amountDue > 0) setAmount(amountDue);
    else setAmount(0);
  }, [invoice, amountDue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!invoice) return;
    if (amount <= 0 || amount > amountDue) {
      setError(`Amount must be between 1 and ${formatCurrency(amountDue)}.`);
      return;
    }
    if (!customer?.id) {
      setError('Customer ID missing. Please refresh.');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiService.createPayment({
        invoiceId: invoice.id,
        customerId: customer.id,
        amount: amount,
        paymentMethod: paymentMethod,
        referenceNumber: referenceNumber || undefined,
        bankName: bankName || undefined,
        notes: notes || `Payment for invoice ${getInvoiceNumber(invoice)}`,
      });

      setSuccess('✅ Payment successful!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to process payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!invoice) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pay Invoice" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 p-3 rounded">{success}</div>}

        <div className="bg-slate-50 p-4 rounded-lg">
          <p className="text-sm text-slate-500">Invoice</p>
          <p className="font-semibold">{getInvoiceNumber(invoice)}</p>
          <p className="text-sm text-slate-500 mt-2">Amount Due</p>
          <p className="text-xl font-bold">{formatCurrency(amountDue)}</p>
        </div>

        <Input
          label="Amount to Pay"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          min={1}
          max={amountDue}
          required
          helperText={`Maximum: ${formatCurrency(amountDue)}`}
        />

        <Select
          label="Payment Method"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          options={[
            { value: 'bank_transfer', label: 'Bank Transfer' },
            { value: 'cheque', label: 'Cheque' },
            { value: 'cash', label: 'Cash' },
            { value: 'upi', label: 'UPI' },
          ]}
        />

        <Input
          label="Reference Number"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
        />
        <Input
          label="Bank Name"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
        />
        <Input
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes"
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>Confirm Payment</Button>
        </div>
      </form>
    </Modal>
  );
}