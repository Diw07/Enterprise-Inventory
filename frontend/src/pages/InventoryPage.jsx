import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, SlidersHorizontal, History } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader, Spinner, Modal, Empty, Field } from '../components/ui';

const fmt = (n) => `₹${parseFloat(n).toLocaleString('en-IN')}`;

export const InventoryPage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab]         = useState('all');
  const [adjusting, setAdjusting] = useState(null);
  const [history, setHistory] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ qty: '', notes: '' });

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => api.get('/inventory').then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => api.get('/inventory/low-stock').then(r => r.data.data),
  });

  const { data: movements } = useQuery({
    queryKey: ['movements', history?.product_id],
    queryFn: () => api.get(`/inventory/${history?.product_id}/movements`).then(r => r.data.data),
    enabled: !!history,
  });

  const adjustMutation = useMutation({
    mutationFn: (data) => api.post('/inventory/adjust', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['kpis'] });
      setAdjusting(null);
      setAdjustForm({ qty: '', notes: '' });
    },
  });

  const displayed = tab === 'low' ? lowStock : inventory;
  const canAdjust = ['admin', 'warehouse'].includes(user?.role);

  const stockBar = (qty, max) => {
    const pct = Math.min((qty / Math.max(max * 3, 1)) * 100, 100);
    const color = qty === 0 ? 'bg-red-500' : qty <= max ? 'bg-amber-400' : 'bg-green-500';
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`text-xs font-semibold tabular-nums ${qty === 0 ? 'text-red-600' : qty <= max ? 'text-amber-600' : 'text-green-700'}`}>
          {qty}
        </span>
      </div>
    );
  };

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Real-time stock levels across all products" />

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        {[['all', 'All Stock'], ['low', `Low Stock (${lowStock?.length ?? 0})`]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {isLoading ? <Spinner /> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th><th>SKU</th><th>Category</th>
                <th>Stock</th><th>Reorder Level</th>
                <th>Location</th><th>Value</th>
                {canAdjust && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {displayed?.length ? displayed.map(item => (
                <tr key={item.id}>
                  <td className="font-medium text-gray-900">{item.product_name}</td>
                  <td className="font-mono text-xs text-gray-500">{item.sku}</td>
                  <td><span className="badge-gray">{item.category}</span></td>
                  <td className="w-36">{stockBar(item.quantity_on_hand, item.reorder_level)}</td>
                  <td className="text-gray-500 text-xs">{item.reorder_level}</td>
                  <td className="text-xs text-gray-500">{item.warehouse_location || '—'}</td>
                  <td className="font-medium text-sm">{fmt(item.quantity_on_hand * item.unit_price)}</td>
                  {canAdjust && (
                    <td>
                      <div className="flex gap-2">
                        <button className="btn-ghost btn-sm" title="Adjust stock"
                          onClick={() => setAdjusting(item)}><SlidersHorizontal size={14}/></button>
                        <button className="btn-ghost btn-sm" title="Movement history"
                          onClick={() => setHistory(item)}><History size={14}/></button>
                      </div>
                    </td>
                  )}
                </tr>
              )) : (
                <tr><td colSpan={8}><Empty message="No inventory records" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Modal */}
      {adjusting && (
        <Modal title={`Adjust Stock — ${adjusting.product_name}`} onClose={() => setAdjusting(null)} size="sm">
          <p className="text-sm text-gray-500 mb-4">
            Current: <strong>{adjusting.quantity_on_hand}</strong> units.
            Enter a positive number to add, negative to subtract.
          </p>
          <form onSubmit={(e) => {
            e.preventDefault();
            adjustMutation.mutate({
              product_id: adjusting.product_id,
              qty: parseInt(adjustForm.qty),
              notes: adjustForm.notes,
            });
          }}>
            <Field label="Adjustment Quantity (+ or -)">
              <input className="input" type="number" required placeholder="e.g. 50 or -10"
                value={adjustForm.qty}
                onChange={e => setAdjustForm(f => ({ ...f, qty: e.target.value }))} />
            </Field>
            <Field label="Notes">
              <input className="input" placeholder="Reason for adjustment"
                value={adjustForm.notes}
                onChange={e => setAdjustForm(f => ({ ...f, notes: e.target.value }))} />
            </Field>
            {adjustMutation.error && (
              <p className="text-sm text-red-600 mb-3">{adjustMutation.error.response?.data?.message}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button type="button" className="btn-secondary" onClick={() => setAdjusting(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={adjustMutation.isPending}>
                {adjustMutation.isPending ? 'Saving…' : 'Apply Adjustment'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* History Modal */}
      {history && (
        <Modal title={`Stock History — ${history.product_name}`} onClose={() => setHistory(null)} size="lg">
          {!movements ? <Spinner /> : movements.length ? (
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Type</th><th>Change</th><th>By</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {movements.map(m => (
                  <tr key={m.id}>
                    <td className="text-xs text-gray-500">{new Date(m.created_at).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={m.movement_type === 'in' ? 'badge-green' : m.movement_type === 'out' ? 'badge-red' : 'badge-blue'}>
                        {m.movement_type}
                      </span>
                    </td>
                    <td className={`font-semibold tabular-nums ${m.change_qty > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {m.change_qty > 0 ? '+' : ''}{m.change_qty}
                    </td>
                    <td className="text-xs">{m.performed_by_name}</td>
                    <td className="text-xs text-gray-500">{m.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty message="No movement history" />}
        </Modal>
      )}
    </div>
  );
};
