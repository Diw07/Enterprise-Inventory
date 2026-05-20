import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, CheckCircle, Trash2, ChevronDown } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader, Modal, Spinner, Empty, StatusBadge, Confirm, Field } from '../components/ui';

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN')}`;
const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export const OrdersPage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType,   setFilterType]   = useState('');
  const [viewing, setViewing]           = useState(null);
  const [creating, setCreating]         = useState(false);
  const [confirming, setConfirming]     = useState(null);
  const [deleting, setDeleting]         = useState(null);

  // New order form state
  const [orderType, setOrderType] = useState('sale');
  const [items, setItems]         = useState([{ product_id: '', quantity: 1 }]);
  const [notes, setNotes]         = useState('');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', filterStatus, filterType],
    queryFn: () => api.get('/orders', {
      params: { status: filterStatus || undefined, type: filterType || undefined }
    }).then(r => r.data.data),
  });

  const { data: orderDetail } = useQuery({
    queryKey: ['order', viewing],
    queryFn: () => api.get(`/orders/${viewing}`).then(r => r.data.data),
    enabled: !!viewing,
  });

  const { data: products } = useQuery({
    queryKey: ['products-minimal'],
    queryFn: () => api.get('/products').then(r => r.data.data),
    enabled: creating,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/orders', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      setCreating(false); setItems([{ product_id: '', quantity: 1 }]); setNotes('');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id) => api.post(`/orders/${id}/confirm`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['kpis'] });
      if (viewing) qc.invalidateQueries({ queryKey: ['order', viewing] });
      setConfirming(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      if (viewing) qc.invalidateQueries({ queryKey: ['order', viewing] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/orders/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); setDeleting(null); },
  });

  const addItem    = () => setItems(i => [...i, { product_id: '', quantity: 1 }]);
  const removeItem = (idx) => setItems(i => i.filter((_, j) => j !== idx));
  const updateItem = (idx, field, val) => setItems(i => i.map((it, j) => j === idx ? { ...it, [field]: val } : it));

  const handleCreate = (e) => {
    e.preventDefault();
    const validItems = items.filter(i => i.product_id && i.quantity > 0);
    if (!validItems.length) return;
    createMutation.mutate({ type: orderType, items: validItems, notes });
  };

  const statusColor = (s) => ({
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
    shipped: 'bg-purple-50 text-purple-700 border-purple-200',
    delivered: 'bg-green-50 text-green-700 border-green-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
  }[s] || 'bg-gray-100 text-gray-700');

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`${orders?.length ?? 0} orders`}
        action={<button className="btn-primary" onClick={() => setCreating(true)}><Plus size={16}/> New Order</button>}
      />

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select className="select w-40" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="select w-36" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All types</option>
          <option value="sale">Sale</option>
          <option value="purchase">Purchase</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? <Spinner /> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Order #</th><th>Type</th><th>Status</th><th>Items</th><th>Total</th><th>Created By</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {orders?.length ? orders.map(o => (
                <tr key={o.id}>
                  <td className="font-mono text-xs font-semibold text-brand-700">{o.order_number}</td>
                  <td><span className={o.type === 'sale' ? 'badge-green' : 'badge-purple'}>{o.type}</span></td>
                  <td><span className={`badge ${statusColor(o.status)}`}>{o.status}</span></td>
                  <td className="text-gray-600">{o.item_count}</td>
                  <td className="font-semibold">{fmt(o.total_value)}</td>
                  <td className="text-xs text-gray-500">{o.created_by_name}</td>
                  <td className="text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div className="flex gap-1.5">
                      <button className="btn-ghost btn-sm" onClick={() => setViewing(o.id)}><Eye size={13}/></button>
                      {o.status === 'pending' && (
                        <button className="btn-ghost btn-sm text-green-600" onClick={() => setConfirming(o)}>
                          <CheckCircle size={13}/>
                        </button>
                      )}
                      {user?.role === 'admin' && ['pending', 'cancelled'].includes(o.status) && (
                        <button className="btn-ghost btn-sm text-red-500" onClick={() => setDeleting(o)}>
                          <Trash2 size={13}/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan={8}><Empty message="No orders found" /></td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {viewing && (
        <Modal title={orderDetail ? `Order ${orderDetail.order_number}` : 'Loading…'} onClose={() => setViewing(null)} size="lg">
          {!orderDetail ? <Spinner /> : (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <span className={`badge ${statusColor(orderDetail.status)}`}>{orderDetail.status}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Type</p>
                  <span className={orderDetail.type === 'sale' ? 'badge-green' : 'badge-purple'}>{orderDetail.type}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Created by</p>
                  <p className="text-sm font-medium">{orderDetail.created_by_name}</p>
                </div>
              </div>

              {orderDetail.notes && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 text-sm text-blue-700 mb-4">
                  {orderDetail.notes}
                </div>
              )}

              <h4 className="font-medium text-sm mb-3 text-gray-700">Line Items</h4>
              <table className="table mb-4">
                <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {orderDetail.items?.map(item => (
                    <tr key={item.id}>
                      <td>{item.product_name}</td>
                      <td className="font-mono text-xs text-gray-500">{item.sku}</td>
                      <td className="font-semibold">{item.quantity}</td>
                      <td>{fmt(item.unit_price_snapshot)}</td>
                      <td className="font-semibold">{fmt(item.quantity * item.unit_price_snapshot)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center">
                <div>
                  {orderDetail.status === 'pending' && (
                    <button className="btn-primary mr-2" onClick={() => { setConfirming(orderDetail); setViewing(null); }}>
                      <CheckCircle size={15}/> Confirm Order
                    </button>
                  )}
                  {!['delivered', 'cancelled'].includes(orderDetail.status) && orderDetail.status !== 'pending' && (
                    <select className="select w-44 text-sm" value={orderDetail.status}
                      onChange={e => statusMutation.mutate({ id: orderDetail.id, status: e.target.value })}>
                      {STATUSES.filter(s => s !== 'pending' && s !== 'confirmed').map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Order Total</p>
                  <p className="text-xl font-bold text-gray-900">
                    {fmt(orderDetail.items?.reduce((acc, i) => acc + i.quantity * i.unit_price_snapshot, 0))}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Create Order Modal */}
      {creating && (
        <Modal title="Create New Order" onClose={() => setCreating(false)} size="lg">
          <form onSubmit={handleCreate}>
            <div className="flex gap-4 mb-4">
              <Field label="Order Type">
                <select className="select" value={orderType} onChange={e => setOrderType(e.target.value)}>
                  <option value="sale">Sale (outbound)</option>
                  <option value="purchase">Purchase (inbound)</option>
                </select>
              </Field>
              <Field label="Notes" error="">
                <input className="input" placeholder="Optional notes"
                  value={notes} onChange={e => setNotes(e.target.value)} />
              </Field>
            </div>

            <div className="space-y-3 mb-4">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-end">
                  <div className="flex-1">
                    {idx === 0 && <label className="label">Product</label>}
                    <select className="select" required value={item.product_id}
                      onChange={e => updateItem(idx, 'product_id', e.target.value)}>
                      <option value="">Select product…</option>
                      {products?.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku}) — {p.quantity_on_hand} in stock</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-28">
                    {idx === 0 && <label className="label">Qty</label>}
                    <input className="input" type="number" min="1" required value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))} />
                  </div>
                  {items.length > 1 && (
                    <button type="button" className="btn-ghost btn-sm text-red-500 mb-1.5"
                      onClick={() => removeItem(idx)}>✕</button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" className="btn-secondary btn-sm mb-5" onClick={addItem}>
              + Add Item
            </button>

            {createMutation.error && (
              <p className="text-sm text-red-600 mb-3">{createMutation.error.response?.data?.message}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button type="button" className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create Order'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Dialog */}
      {confirming && (
        <Confirm
          message={`Confirm order ${confirming.order_number}? This will ${
            confirming.type === 'sale' ? 'deduct stock from inventory' : 'add stock to inventory'
          } atomically.`}
          loading={confirmMutation.isPending}
          onConfirm={() => confirmMutation.mutate(confirming.id)}
          onCancel={() => setConfirming(null)}
        />
      )}

      {deleting && (
        <Confirm
          message={`Delete order ${deleting.order_number}? This cannot be undone.`}
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleting.id)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
};
