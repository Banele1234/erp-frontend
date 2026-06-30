import { useEffect, useState } from 'react';
import { apiService } from '../../lib/api';
import { Card, Button, LoadingSpinner } from '../common/StatusBadge';
import { Plus, ShieldCheck, Mail, UserCircle, Briefcase, RefreshCw } from 'lucide-react';

interface UserRecord {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    created_at: string;
}

const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    management: 'Management',
    warehouse_staff: 'Warehouse Staff',
    production: 'Production',
};

export default function UserManagement() {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'management',
    });

    const fetchUsers = async () => {
        setError('');
        setIsLoading(true);
        try {
            const response = await apiService.getUsers();
            // ✅ Safely extract array
            const data = response.data?.data || response.data?.content || response.data || [];
            setUsers(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('Failed to fetch users:', err);
            // ✅ Clear user‑friendly messages for 403
            if (err.status === 403) {
                setError('You do not have permission to view users. Contact your administrator.');
            } else if (err.status === 401) {
                setError('Authentication failed. Please log out and log in again.');
            } else {
                setError(err.message || 'Failed to load users');
            }
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsCreating(true);

        try {
            await apiService.createInternalUser(formData);
            setSuccess('User created successfully');
            setFormData({
                full_name: '',
                email: '',
                password: '',
                role: 'management',
            });
            await fetchUsers();
        } catch (err: any) {
            console.error('Failed to create user:', err);
            setError(err.message || 'Failed to create user');
        } finally {
            setIsCreating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
                    <p className="text-slate-500 mt-1">Create and manage internal users</p>
                </div>
                <Button variant="outline" onClick={fetchUsers} className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </Button>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
                    <span>{error}</span>
                    {error.includes('Authentication') && (
                        <button
                            onClick={() => window.location.reload()}
                            className="text-red-600 underline hover:text-red-800"
                        >
                            Reload page
                        </button>
                    )}
                </div>
            )}
            {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                </div>
            )}

            <div className="grid gap-6 xl:grid-cols-3">
                <Card className="xl:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <Plus className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-slate-900">Create User</h2>
                    </div>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
                            <input
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="management">Management</option>
                                <option value="warehouse_staff">Warehouse Staff</option>
                                <option value="production">Production</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <Button type="submit" isLoading={isCreating} className="w-full">
                            Create User
                        </Button>
                    </form>
                </Card>

                <div className="xl:col-span-2 space-y-4">
                    {users.length === 0 ? (
                        <Card>
                            <div className="text-center py-8 text-slate-500">
                                <p>No users found</p>
                                {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                            </div>
                        </Card>
                    ) : (
                        users.map((user) => (
                            <Card key={user.id}>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                                            <UserCircle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{user.full_name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <Mail className="w-4 h-4" />
                                                {user.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                                            <ShieldCheck className="w-4 h-4" />
                                            {roleLabels[user.role] || user.role}
                                        </span>
                                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                            <Briefcase className="w-4 h-4" />
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}