import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../lib/api';
import { Button, Input, Select } from '../common/StatusBadge';
import { Factory, User, Building, Phone, Mail, Lock, MapPin } from 'lucide-react';

const customerTypes = [
  { value: 'oem', label: 'OEM Customer' },
  { value: 'regular_dealer', label: 'Regular Dealer' },
  { value: 'exclusive_dealer', label: 'Exclusive Dealer' },
];

export default function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    company_name: '',
    customer_type: 'regular_dealer',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gst_number: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Step 1 validation
    if (step === 1) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      setStep(2);
      return;
    }

    // Step 2: submit to backend
    setIsLoading(true);

    try {
      const response = await apiService.register({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        company_name: formData.company_name,
        customer_type: formData.customer_type,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        gst_number: formData.gst_number,
      });

      console.log('📦 Registration response:', response);

      // Check if email confirmation is required (unlikely, but keep)
      if (response.requiresConfirmation) {
        setConfirmEmail(response.email || formData.email);
        setShowConfirmation(true);
        setError('');
        return;
      }

      // ✅ Extract token – try root first, then nested
      const token = response.token || response.data?.token;
      if (token) {
        apiService.setToken(token);
        navigate('/');
      } else {
        setError('Registration failed – no token returned');
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Registration failed. Please try again.';
      setError(message);
    }

    setIsLoading(false);
  };

  // Show confirmation screen if needed
  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h2>
          <p className="text-slate-600 mb-4">
            We sent a confirmation link to <strong>{confirmEmail}</strong>.
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Please click the link in the email to activate your account, then you can log in.
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Normal registration form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl mb-3">
              <Factory className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Create Account</h1>
            <p className="text-slate-500 text-sm mt-1">Register as a customer</p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-slate-300'}`} />
            <div className="w-12 h-0.5 bg-slate-200" />
            <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-slate-300'}`} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {step === 1 && (
              <>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email address"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm Password"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Continue
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <Select
                  name="customer_type"
                  value={formData.customer_type}
                  onChange={handleChange}
                  label="Customer Type"
                  options={customerTypes}
                />

                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="Company Name"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone Number"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="Pincode"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    name="gst_number"
                    value={formData.gst_number}
                    onChange={handleChange}
                    placeholder="GST Number"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" isLoading={isLoading}>
                    Register
                  </Button>
                </div>
              </>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}