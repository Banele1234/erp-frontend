import { useState, useEffect } from 'react';
import { apiService } from '../../lib/api';
import { Customer } from '../../types';
import { Card, Button, Badge, Modal, Input, Select, LoadingSpinner, EmptyState } from '../common/StatusBadge';
import {
  Plus,
  Search,
  Edit,
  Eye,
  Building,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Star,
  Filter,
  CheckCircle,
  AlertCircle,
  Trash2,
  RefreshCw,
} from 'lucide-react';

const customerTypeLabels: Record<string, string> = {
  oem: 'OEM Customer',
  regular_dealer: 'Regular Dealer',
  exclusive_dealer: 'Exclusive Dealer',
};

const ratingColors: Record<string, string> = {
  gold: 'bg-amber-100 text-amber-700',
  silver: 'bg-slate-100 text-slate-700',
  bronze: 'bg-orange-100 text-orange-700',
};

const ratingDiscount: Record<string, number> = {
  gold: 20,
  silver: 10,
  bronze: 5,
};

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState<any>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (resetFilters?: boolean) => {
    setIsLoading(true);
    try {
      const params: any = {
        page: 1,
        limit: 100,
      };

      if (!resetFilters) {
        if (searchQuery && searchQuery.trim()) {
          params.search = searchQuery.trim();
        }
        if (filterType) {
          params.type = filterType;
        }
      }

      console.log('📤 Fetching customers with params:', params);

      const response = await apiService.getCustomers(params);
      console.log('📦 Raw customers response:', response);

      setPaginationInfo(response?.pagination || null);

      const data = response?.data || [];
      if (Array.isArray(data)) {
        setCustomers(data);
        if (data.length > 0) {
          console.log('🔍 First customer sample:', data[0]);
        }
      } else {
        console.error('❌ Response data is not an array:', data);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    }
    setIsLoading(false);
  };

  const handleRefresh = () => {
    fetchCustomers(false);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterType('');
    fetchCustomers(true);
  };

  const getCustomerType = (c: any): string => {
    return c.customer_type || c.customerType || c.type || '';
  };

  const filteredCustomers = customers.filter((c) => {
    if (!c) return false;
    const searchLower = searchQuery.toLowerCase().trim();
    const companyName = (c.company_name || c.companyName || '').toLowerCase();
    const customerCode = (c.customer_code || c.customerCode || '').toLowerCase();
    const contactPerson = (c.contact_person || c.contactPerson || '').toLowerCase();
    const matchesSearch =
      !searchLower ||
      companyName.includes(searchLower) ||
      customerCode.includes(searchLower) ||
      contactPerson.includes(searchLower);
    const customerType = getCustomerType(c);
    const matchesFilter = !filterType || customerType === filterType;
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (amount: number) => {
    return `E ${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(amount || 0)}`;
  };

  const getUtilizationPercent = (customer: Customer) => {
    if (customer.credit_limit === 0) return 0;
    return Math.round((customer.current_outstanding / customer.credit_limit) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalElements = paginationInfo?.totalElements ?? customers.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1">Manage your customer base</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {paginationInfo && (
        <div className="text-sm text-slate-500 bg-slate-50 p-2 rounded">
          Total customers in database: <strong>{paginationInfo.totalElements}</strong>
          {paginationInfo.totalElements > 0 && customers.length === 0 && (
            <span className="text-amber-600 ml-2">
              (But none loaded – check your search/filters)
            </span>
          )}
        </div>
      )}

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-48 rounded-lg border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Types</option>
            <option value="oem">OEM Customers</option>
            <option value="regular_dealer">Regular Dealers</option>
            <option value="exclusive_dealer">Exclusive Dealers</option>
          </select>

          <Button variant="outline" onClick={handleResetFilters} className="whitespace-nowrap">
            Reset Filters
          </Button>
        </div>

        {filteredCustomers.length === 0 ? (
          <EmptyState
            message={
              totalElements > 0 && customers.length === 0
                ? "Your search or filter is too restrictive – try resetting filters."
                : "No customers found."
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedCustomer(customer);
                  setShowModal(true);
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                      <Building className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{customer.company_name || customer.companyName}</h3>
                      <p className="text-sm text-slate-500">{customer.customer_code || customer.customerCode}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ratingColors[customer.rating]}`}>
                    {customer.rating.charAt(0).toUpperCase() + customer.rating.slice(1)}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4" />
                    <span>{customer.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4" />
                    <span>{customer.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Star className="w-4 h-4" />
                    <span>{ratingDiscount[customer.rating]}% Discount Eligible</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">Credit Utilization</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(customer.current_outstanding)} / {formatCurrency(customer.credit_limit)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        getUtilizationPercent(customer) > 80 ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(getUtilizationPercent(customer), 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <CustomerDetailsModal
        customer={selectedCustomer}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedCustomer(null);
        }}
        onUpdate={handleRefresh}
      />

      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}

// ========== Customer Details Modal ==========
function CustomerDetailsModal({
  customer,
  isOpen,
  onClose,
  onUpdate,
}: {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData(customer);
    }
  }, [customer]);

  const handleSave = async () => {
    if (!customer) return;

    try {
      await apiService.updateCustomer(customer.id, formData);
      onUpdate();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  const handleDelete = async () => {
    if (!customer) return;
    if (!window.confirm(`Are you sure you want to delete customer "${customer.company_name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await apiService.deleteCustomer(customer.id);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Failed to delete customer. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `E ${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(amount || 0)}`;
  };

  if (!customer) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customer Details" size="lg">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
            <Building className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            {isEditing ? (
              <Input
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="text-lg font-semibold"
              />
            ) : (
              <>
                <h3 className="text-xl font-semibold text-slate-900">{customer.company_name}</h3>
                <p className="text-slate-500">{customer.customer_code}</p>
              </>
            )}
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave}>Save</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-500">Rating</p>
            <span className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium ${ratingColors[customer.rating]}`}>
              {customer.rating.toUpperCase()}
            </span>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-500">Type</p>
            <p className="mt-1 font-medium text-slate-900">{customerTypeLabels[customer.customer_type]}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-500">Discount</p>
            <p className="mt-1 font-medium text-slate-900">{ratingDiscount[customer.rating]}%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-slate-700">Contact Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">{customer.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">{customer.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">{customer.address || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">{customer.city || ''}</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-slate-700">Financials</h4>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-slate-500">Credit Limit</p>
                <p className="font-medium text-slate-900">{formatCurrency(customer.credit_limit)}</p>
              </div>
              <div>
                <p className="text-slate-500">Outstanding</p>
                <p className="font-medium text-red-600">{formatCurrency(customer.current_outstanding)}</p>
              </div>
              <div>
                <p className="text-slate-500">Total Purchases</p>
                <p className="font-medium text-emerald-600">{formatCurrency(customer.total_purchases)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ========== Add Customer Modal ==========
function AddCustomerModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',       // ✅ Password field included
    company_name: '',
    contact_person: '',
    phone: '',
    address: '',
    city: '',
    customer_type: 'regular_dealer' as const,
    credit_limit: 100000,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.company_name.trim()) {
      setErrorMessage('Company Name is required.');
      return;
    }
    if (!formData.contact_person.trim()) {
      setErrorMessage('Contact Person is required.');
      return;
    }
    if (!formData.email.trim()) {
      setErrorMessage('Email is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMessage('Phone is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        email: formData.email.trim(),
        password: formData.password.trim() || undefined,  // ✅ Password sent
        companyName: formData.company_name.trim(),
        contactPerson: formData.contact_person.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        customerType: formData.customer_type,
        creditLimit: formData.credit_limit,
      };

      console.log('📤 Sending payload:', payload);

      await apiService.createCustomer(payload);

      setSuccessMessage(
        formData.password
          ? '✅ Customer created! They can now log in with the provided password.'
          : '✅ Customer created! An invite email with login instructions has been sent.'
      );

      setTimeout(() => {
        onSuccess();
        onClose();
        setFormData({
          email: '',
          password: '',
          company_name: '',
          contact_person: '',
          phone: '',
          address: '',
          city: '',
          customer_type: 'regular_dealer',
          credit_limit: 100000,
        });
      }, 1500);
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || 'Failed to create customer. Please try again.';
      setErrorMessage(message);
      console.error('Error adding customer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Customer" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            <AlertCircle className="w-4 h-4" />
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 border border-green-200">
            <CheckCircle className="w-4 h-4" />
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Company Name"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            required
          />
          <Input
            label="Contact Person"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            helper="This will be the login username"
          />
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            helper="Leave blank to auto‑generate and email"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
          <Select
            label="Customer Type"
            value={formData.customer_type}
            onChange={(e) => setFormData({ ...formData, customer_type: e.target.value as any })}
            options={[
              { value: 'oem', label: 'OEM Customer' },
              { value: 'regular_dealer', label: 'Regular Dealer' },
              { value: 'exclusive_dealer', label: 'Exclusive Dealer' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Credit Limit"
            type="number"
            value={formData.credit_limit}
            onChange={(e) => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
            required
          />
        </div>

        <Input
          label="Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />

        <Input
          label="City"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Add Customer
          </Button>
        </div>
      </form>
    </Modal>
  );
}