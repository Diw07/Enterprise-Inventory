import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader, Modal, Spinner, Empty, StatusBadge, Confirm, Field } from '../components/ui';

const fmt = (n) => `₹${parseFloat(n).toLocaleString('en-IN')}`;

const EMPTY_FORM = {
  sku: '', name: '', description: '', category: '', unit_price: '',
  reorder_level: 10, supplier_id: '', initial_quantity: 0, warehouse_location: '',
};

export const ProductsPage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('');
  const [lowStock, setLowStock]   = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [deleting, setDeleting]   = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', search, category, lowStock],
    queryFn: () => api.get('/products', {
      params: { search: search || undefined, category: category || undefined, lowStock: lowStock || undefined }
    }).then(r => r.data.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/products/categories').then(r => r.data.data),
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => api.get('/suppliers').then(r => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? api.put(`/products/${editing.id}`, data)
      : api.post('/products', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      setShowForm(false); setEditing(null); setForm(EMPTY_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setDeleting(null); },
  });

  const openEdit = (p) => {
    setEditing(p);
    setForm({ ...p, initial_quantity: 0, warehouse_location: p.warehouse_location || '' });
    setShowForm(true);
  };

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({ ...form, unit_price: parseFloat(form.unit_price), reorder_level: parseInt(form.reorder_level) });
  };

  const stockBadge = (qty, level) => {
    if (qty === 0)        return <span className="badge-red">Out of stock</span>;
    if (qty <= level)     return <span className="badge-amber">Low ({qty})</span>;
    return                       <span className="badge-green">{qty}</span>;
  };

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${products?.length ?? 0} products`}
        action={user?.role === 'admin' && (
          <button className="btn-primary" onClick={openNew}><Plus size={16} /> Add Product</button>
        )}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9 w-60" placeholder="Search name or SKU…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select w-44" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories?.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={lowStock} onChange={e => setLowStock(e.target.checked)}
            className="rounded border-gray-300 text-brand-600" />
          Low stock only
        </label>
      </div>

      {/* Table */}
      {isLoading ? <Spinner /> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th><th>Name</th><th>Category</th>
                <th>Unit Price</th><th>Stock</th><th>Supplier</th>
                {user?.role === 'admin' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products?.length ? products.map(p => (
                <tr key={p.id}>
                  <td className="font-mono text-xs text-gray-500">{p.sku}</td>
                  <td className="font-medium text-gray-900">{p.name}</td>
                  <td><span className="badge-gray">{p.category}</span></td>
                  <td className="font-medium">{fmt(p.unit_price)}</td>
                  <td>{stockBadge(p.quantity_on_hand, p.reorder_level)}</td>
                  <td className="text-gray-500 text-xs">{p.supplier_name || '—'}</td>
                  {user?.role === 'admin' && (
                    <td>
                      <div className="flex gap-2">
                        <button className="btn-ghost btn-sm" onClick={() => openEdit(p)}><Edit2 size={14}/></button>
                        <button className="btn-ghost btn-sm text-red-500" onClick={() => setDeleting(p)}><Trash2 size={14}/></button>
                      </div>
                    </td>
                  )}
                </tr>
              )) : (
                <tr><td colSpan={7}><Empty message="No products found" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <Modal title={editing ? 'Edit Product' : 'Add Product'} onClose={() => { setShowForm(false); setEditing(null); }} size="lg">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="SKU *">
                <input className="input" required value={form.sku}
                  onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} disabled={!!editing} />
              </Field>
              <Field label="Category *">
                <input className="input" required list="cats" value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                <datalist id="cats">{categories?.map(c => <option key={c} value={c}/>)}</datalist>
              </Field>
              <Field label="Product Name *" error={saveMutation.error?.response?.data?.message}>
                <input className="input col-span-2" required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </Field>
              <Field label="Unit Price (₹) *">
                <input className="input" type="number" min="0" step="0.01" required value={form.unit_price}
                  onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))} />
              </Field>
              <Field label="Reorder Level">
                <input className="input" type="number" min="0" value={form.reorder_level}
                  onChange={e => setForm(f => ({ ...f, reorder_level: e.target.value }))} />
              </Field>
              <Field label="Supplier">
                <select className="select" value={form.supplier_id}
                  onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))}>
                  <option value="">No supplier</option>
                  {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              {!editing && (
                <>
                  <Field label="Initial Quantity">
                    <input className="input" type="number" min="0" value={form.initial_quantity}
                      onChange={e => setForm(f => ({ ...f, initial_quantity: parseInt(e.target.value) }))} />
                  </Field>
                  <Field label="Warehouse Location">
                    <input className="input" placeholder="e.g. RACK-A-12" value={form.warehouse_location}
                      onChange={e => setForm(f => ({ ...f, warehouse_location: e.target.value }))} />
                  </Field>
                </>
              )}
            </div>
            <Field label="Description">
              <textarea className="input" rows={2} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </Field>
            <div className="flex gap-3 justify-end mt-2">
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving…' : editing ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <Confirm
          message={`Delete "${deleting.name}"? This will hide the product from all views.`}
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleting.id)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
};
