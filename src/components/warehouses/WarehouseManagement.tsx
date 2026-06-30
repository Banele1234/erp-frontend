import { useState, useEffect } from 'react';
import { apiService } from '../../lib/api';
import { Warehouse } from '../../types';
import { Card, Button, Badge, Modal, Input, LoadingSpinner, EmptyState } from '../common/StatusBadge';
import { Plus, Edit, Warehouse as WarehouseIcon, MapPin, Phone, User, Package } from 'lucide-react';

export default function WarehouseManagement() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getWarehouses();
      setWarehouses(response.data || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
    setIsLoading(false);
  };

  const getUtilizationPercent = (warehouse: Warehouse) => {
    if (warehouse.capacity_units === 0) return 0;
    return Math.round((warehouse.current_utilization / warehouse.capacity_units) * 100);
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
          <h1 className="text-2xl font-bold text-slate-900">Warehouses</h1>
          <p className="text-slate-500 mt-1">Manage warehouse locations</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Warehouse
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {warehouses.map((warehouse) => (
          <Card key={warehouse.id} className="relative overflow-hidden">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                  <WarehouseIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{warehouse.name}</h3>
                  <p className="text-sm text-slate-500">{warehouse.warehouse_code}</p>
                </div>
              </div>
              <Badge variant={warehouse.is_active ? 'success' : 'danger'}>
                {warehouse.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="space-y-2 text-sm text-slate-600 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{warehouse.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{warehouse.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span>{warehouse.manager_name || 'N/A'}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Capacity Utilization</span>
                <span className="font-medium">{getUtilizationPercent(warehouse)}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    getUtilizationPercent(warehouse) > 80 ? 'bg-red-500' :
                    getUtilizationPercent(warehouse) > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${getUtilizationPercent(warehouse)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>{warehouse.current_utilization} units</span>
                <span>{warehouse.capacity_units} capacity</span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-16"
              onClick={() => {
                setSelectedWarehouse(warehouse);
                setShowEditModal(true);
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
          </Card>
        ))}
      </div>

      {warehouses.length === 0 && (
        <EmptyState message="No warehouses found" />
      )}

      <AddWarehouseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchWarehouses();
        }}
      />

      <EditWarehouseModal
        warehouse={selectedWarehouse}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedWarehouse(null);
        }}
        onSuccess={() => {
          setShowEditModal(false);
          fetchWarehouses();
        }}
      />
    </div>
  );
}

// ========== Add Warehouse Modal (FIXED) ==========
function AddWarehouseModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    city: '',
    phone: '',
    manager_name: '',
    capacity_units: 10000,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const warehouseCode = `WH-${Date.now().toString(36).toUpperCase()}`;

      // Use API to create warehouse
      await apiService.createWarehouse({
        warehouse_code: warehouseCode,
        name: formData.name,
        city: formData.city,
        location: formData.location,
        phone: formData.phone,
        manager_name: formData.manager_name,
        capacity_units: formData.capacity_units,
        // 'state' is intentionally omitted
      });

      // Success – close modal and refresh
      onSuccess();
      // Reset form
      setFormData({
        name: '',
        location: '',
        city: '',
        phone: '',
        manager_name: '',
        capacity_units: 10000,
      });
    } catch (error: any) {
      console.error('Error adding warehouse:', error);
      const message = error?.response?.data?.error || error?.message || 'Failed to add warehouse. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Warehouse" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}

        <Input
          label="Warehouse Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="City"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />
          <Input
            label="Location/Address"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Manager Name"
            value={formData.manager_name}
            onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
          />
        </div>

        <Input
          label="Capacity (units)"
          type="number"
          value={formData.capacity_units}
          onChange={(e) => setFormData({ ...formData, capacity_units: Number(e.target.value) })}
          required
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Add Warehouse
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ========== Edit Warehouse Modal (uses API) ==========
function EditWarehouseModal({
  warehouse,
  isOpen,
  onClose,
  onSuccess,
}: {
  warehouse: Warehouse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Warehouse>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (warehouse) {
      // Remove state from form data if it exists
      const { state, ...rest } = warehouse;
      setFormData(rest);
    }
  }, [warehouse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouse) return;
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await apiService.updateWarehouse(warehouse.id, formData);
      onSuccess();
    } catch (error: any) {
      console.error('Error updating warehouse:', error);
      const message = error?.response?.data?.error || error?.message || 'Failed to update warehouse. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!warehouse) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Warehouse" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}

        <Input
          label="Warehouse Name"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="City"
            value={formData.city || ''}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
          <Input
            label="Location"
            value={formData.location || ''}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Phone"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Manager Name"
            value={formData.manager_name || ''}
            onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
          />
        </div>

        <Input
          label="Capacity (units)"
          type="number"
          value={formData.capacity_units || 0}
          onChange={(e) => setFormData({ ...formData, capacity_units: Number(e.target.value) })}
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active !== undefined ? formData.is_active : true}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="rounded border-slate-300"
          />
          <label htmlFor="is_active" className="text-sm text-slate-700">Warehouse is active</label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}