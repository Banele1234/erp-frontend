import { useState, useEffect } from 'react';
import { apiService } from '../../lib/api';
import { ProductionTracking as Production, Product } from '../../types';
import { Card, Button, Badge, Modal, Input, Select, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableCell } from '../common/StatusBadge';
import { Plus, Search, Factory, Check, Clock, AlertTriangle, Play, Pause } from 'lucide-react';

export default function ProductionTrackingManagement() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchProductions();
  }, []);

  const fetchProductions = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getProduction({
        page: 1,
        limit: 100,
        status: filterStatus || undefined,
      });
      // ✅ Safely extract array
      const data = response.data?.data || response.data?.content || response.data || [];
      setProductions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching productions:', error);
      setProductions([]);
    }
    setIsLoading(false);
  };

  // ✅ Safe filtering with null checks
  const filteredProductions = productions.filter((p) => {
    if (!p) return false;
    const searchLower = searchQuery.toLowerCase().trim();
    const batchNumber = (p.batch_number || '').toLowerCase();
    const productName = (p.product?.name || '').toLowerCase();
    const matchesSearch = batchNumber.includes(searchLower) || productName.includes(searchLower);
    const matchesStatus = !filterStatus || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const inProgressCount = productions.filter(p => p.status === 'in_progress').length;
  const completedCount = productions.filter(p => p.status === 'completed').length;

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
          <h1 className="text-2xl font-bold text-slate-900">Production Tracking</h1>
          <p className="text-slate-500 mt-1">Monitor production batches</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Batches</p>
              <p className="text-2xl font-bold text-slate-900">{productions.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Factory className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">In Progress</p>
              <p className="text-2xl font-bold text-amber-600">{inProgressCount}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <Play className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Completed</p>
              <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Output</p>
              <p className="text-2xl font-bold text-blue-600">
                {productions.reduce((sum, p) => sum + (p.produced_quantity || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Factory className="w-6 h-6 text-blue-600" />
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
              placeholder="Search batches..."
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
              { value: 'planned', label: 'Planned' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'on_hold', label: 'On Hold' },
            ]}
            className="w-40"
          />
        </div>

        {filteredProductions.length === 0 ? (
          <EmptyState message="No production batches found" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Batch #</TableCell>
                <TableCell header>Product</TableCell>
                <TableCell header>Planned</TableCell>
                <TableCell header>Produced</TableCell>
                <TableCell header>Rejected</TableCell>
                <TableCell header>Progress</TableCell>
                <TableCell header>Status</TableCell>
                <TableCell header>Factory</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProductions.map((prod) => {
                const progress = prod.planned_quantity > 0
                  ? Math.round((prod.produced_quantity / prod.planned_quantity) * 100)
                  : 0;
                return (
                  <TableRow key={prod.id}>
                    <TableCell className="font-medium">{prod.batch_number}</TableCell>
                    <TableCell>{prod.product?.name}</TableCell>
                    <TableCell>{prod.planned_quantity}</TableCell>
                    <TableCell className="font-semibold">{prod.produced_quantity}</TableCell>
                    <TableCell>
                      {prod.rejected_quantity > 0 ? (
                        <span className="text-red-600">{prod.rejected_quantity}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        prod.status === 'completed' ? 'success' :
                        prod.status === 'in_progress' ? 'info' :
                        prod.status === 'on_hold' ? 'warning' : 'default'
                      }>
                        {prod.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{prod.factory}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}