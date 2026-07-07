// src/components/common/ProfilePage.tsx

import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Button, LoadingSpinner, Input } from '../common/StatusBadge';
import { User, Mail, Phone, Building, MapPin, Calendar, AlertCircle, Save, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiService } from '../../lib/api';

export default function ProfilePage() {
  const { user, customer, isLoading, updateUser } = useAuth();   // ✅ get updateUser
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state – snake_case to match backend
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gst_number: '',
  });

  // Populate form when user/customer data loads
  useEffect(() => {
    if (user && customer) {
      setFormData({
        full_name: user.full_name || user.fullName || '',
        company_name: customer.companyName || customer.company_name || '',
        phone: user.phone || user.phone_number || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        pincode: customer.pincode || customer.postal_code || '',
        gst_number: customer.gstNumber || customer.gst_number || '',
      });
    }
  }, [user, customer]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600">User not found. Please log in again.</p>
        </div>
      </div>
    );
  }

  const email = user.email || 'Not available';
  const memberSince = user.created_at || user.createdAt || user.created_date || 'N/A';
  const isActive = user.is_active !== undefined ? user.is_active : (user.active !== undefined ? user.active : false);
  const userType = user.role || user.user_type || 'N/A';
  const rating = customer?.rating || 'N/A';
  const customerType = customer?.customerType || customer?.customer_type || '—';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const updateData = {
        full_name: formData.full_name,
        company_name: formData.company_name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        gst_number: formData.gst_number,
      };

      const response = await apiService.updateProfile(updateData);
      // ✅ Extract updated user from response
      // Response format: { data: { ...user }, success: true }
      const updatedUser = response?.data || response;
      if (updatedUser) {
        updateUser(updatedUser);   // ✅ update auth context immediately
      }

      setSuccess('✅ Profile updated successfully!');
      setIsEditing(false);

      // Keep success message visible for 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to current data
    setFormData({
      full_name: user.full_name || user.fullName || '',
      company_name: customer?.companyName || customer?.company_name || '',
      phone: user.phone || user.phone_number || '',
      address: customer?.address || '',
      city: customer?.city || '',
      state: customer?.state || '',
      pincode: customer?.pincode || customer?.postal_code || '',
      gst_number: customer?.gstNumber || customer?.gst_number || '',
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
          <p className="text-slate-500 mt-1">Manage your account details</p>
        </div>
        {!isEditing ? (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button onClick={handleSave} isLoading={isSaving}>
              <Save className="w-4 h-4 mr-1" /> Save Changes
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Personal Information</h3>
          </div>

          {!isEditing ? (
            // View mode
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Full Name</p>
                <p className="font-medium text-slate-900">{formData.full_name || 'Not available'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-medium text-slate-900">{email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Company</p>
                <p className="font-medium text-slate-900">{formData.company_name || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Phone</p>
                <p className="font-medium text-slate-900">{formData.phone || 'Not available'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Address</p>
                <p className="font-medium text-slate-900">{formData.address || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">City</p>
                <p className="font-medium text-slate-900">{formData.city || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">State</p>
                <p className="font-medium text-slate-900">{formData.state || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Pincode</p>
                <p className="font-medium text-slate-900">{formData.pincode || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">GST Number</p>
                <p className="font-medium text-slate-900">{formData.gst_number || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Member Since</p>
                <p className="font-medium text-slate-900">
                  {memberSince !== 'N/A' ? new Date(memberSince).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          ) : (
            // Edit mode
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <Input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <Input value={email} disabled className="bg-slate-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                <Input
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Company Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone Number"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street Address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <Input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                <Input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State/Province"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
                <Input
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="Postal Code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">GST Number</label>
                <Input
                  name="gst_number"
                  value={formData.gst_number}
                  onChange={handleChange}
                  placeholder="GST Number"
                />
              </div>
            </div>
          )}
        </Card>

        {/* Account Details */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Account Details</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Account Status</p>
              <Badge variant={isActive ? 'success' : 'danger'} className="mt-1">
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-slate-500">User Type</p>
              <p className="font-medium text-slate-900 capitalize">{userType}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Customer Type</p>
              <p className="font-medium text-slate-900">{customerType}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Rating</p>
              <Badge variant="default" className="mt-1">
                {rating}
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}