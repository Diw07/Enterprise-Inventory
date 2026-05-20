import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Package, Mail, Phone } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader, Modal, Spinner, Empty, Confirm, Field } from '../components/ui';

const EMPTY = { name: '', contact_email: '', phone: '', address: '', lead_time_days: 7 };

export const SuppliersPage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [viewing, setViewing]   = useState(null);
  const [form, setForm]         = useState(EMPTY);

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/suppliers').then(r => r.data.data),
  });

  const { data: supplierProducts } = useQuery({
    queryKey: ['supplier-products', viewing],
    queryFn: () => api.get(`/suppliers/${viewing}/products`).then(r => r.data.data),
    enabled: !!viewing,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? api.put(`/suppliers/${editing.id}`, data)
      : api.post('/suppliers', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      setShowForm(false); setEditing(null); setForm(EMPTY);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/suppliers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setDeleting(null); },
  });

  const openEdit = (s) => { setEditing(s); setForm({ ...s }); setShowForm(true); };

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle={`${suppliers?.length ?? 0} active suppliers`}
        action={user?.role === 'admin' && (
          <button className="btn-primary" onClick={() => { setEditing(null); setForm(EMPTY); setShowForm(true); }}>
            <Plus size={16}/> Add Supplier
          </button>
        )}
      />

      {isLoading ? <Spinner /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers?.length ? suppliers.map(s => (
            <div key={s.id} className="card card-body hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setViewing(s.id)}>
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900 text-sm">{s.name}</h3>
                {user?.role === 'admin' && (
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button className="btn-ghost btn-sm" onClick={() => openEdit(s)}><Edit2 size={13}/></button>
                    <button className="btn-ghost btn-sm text-red-400" onClick={() => setDeleting(s)}><Trash2 size={13}/></button>
                  </div>
                )}
              </div>
              <div className="space-y-1.5 text-xs text-gray-500">
                {s.contact_email && <p className="flex items-center gap-1.5"><Mail size={12}/>{s.contact_email}</p>}
                {s.phone && <p className="flex items-center gap-1.5"><Phone size={12}/>{s.phone}</p>}
              </div>
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Package size={12}/> {s.product_count} products
                </span>
                <span className="badge-blue">{s.lead_time_days}d lead time</span>
              </div>
            </div>
          )) : <Empty message="No suppliers added yet" />}
        </div>
      )}

      {/* Products Modal */}
      {viewing && (
        <Modal title={`Products — ${suppliers?.find(s => s.id === viewing)?.name}`}
          onClose={() => setViewing(null)} size="lg">
          {!supplierProducts ? <Spinner /> : supplierProducts.length ? (
            <table className="table">
              <thead><tr><th>SKU</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th></tr></thead>
              <tbody>
                {supplierProducts.map(p => (
                  <tr key={p.id}>
                    <td className="font-mono text-xs text-gray-500">{p.sku}</td>
                    <td className="font-medium">{p.name}</td>
                    <td><span className="badge-gray">{p.category}</span></td>
                    <td>₹{parseFloat(p.unit_price).toLocaleString('en-IN')}</td>
                    <td className={p.quantity_on_hand <= 10 ? 'text-red-600 font-semibold' : 'text-green-700 font-semibold'}>
                      {p.quantity_on_hand}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty message="No products linked to this supplier" />}
        </Modal>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <Modal title={editing ? 'Edit Supplier' : 'Add Supplier'} onClose={() => { setShowForm(false); setEditing(null); }}>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}>
            <Field label="Supplier Name *">
              <input className="input" required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="Contact Email">
              <input className="input" type="email" value={form.contact_email}
                onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
            </Field>
            <Field label="Phone">
              <input className="input" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </Field>
            <Field label="Address">
              <textarea className="input" rows={2} value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </Field>
            <Field label="Lead Time (days)">
              <input className="input" type="number" min="0" value={form.lead_time_days}
                onChange={e => setForm(f => ({ ...f, lead_time_days: parseInt(e.target.value) }))} />
            </Field>
            <div className="flex gap-3 justify-end">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving…' : editing ? 'Save Changes' : 'Create Supplier'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <Confirm message={`Remove supplier "${deleting.name}"?`}
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleting.id)}
          onCancel={() => setDeleting(null)} />
      )}
    </div>
  );
};
