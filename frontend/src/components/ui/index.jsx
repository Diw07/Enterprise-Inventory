import { X, Loader2, AlertTriangle } from 'lucide-react';

/* ── Modal ─────────────────────────────────────── */
export const Modal = ({ title, onClose, children, size = 'md' }) => {
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${widths[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-base">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

/* ── Spinner ────────────────────────────────────── */
export const Spinner = ({ className = '' }) => (
  <div className={`flex items-center justify-center py-16 ${className}`}>
    <Loader2 size={32} className="animate-spin text-brand-500" />
  </div>
);

/* ── KPI Card ───────────────────────────────────── */
export const KpiCard = ({ label, value, sub, icon: Icon, color = 'brand', alert }) => {
  const colors = {
    brand:  'bg-brand-50 text-brand-600',
    green:  'bg-green-50 text-green-600',
    amber:  'bg-amber-50 text-amber-600',
    red:    'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="card card-body flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        {alert && (
          <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
            <AlertTriangle size={12} /> {alert}
          </p>
        )}
      </div>
    </div>
  );
};

/* ── Page Header ────────────────────────────────── */
export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

/* ── Empty State ────────────────────────────────── */
export const Empty = ({ message = 'No data found' }) => (
  <div className="text-center py-16 text-gray-400">
    <AlertTriangle size={36} className="mx-auto mb-3 text-gray-300" />
    <p className="text-sm">{message}</p>
  </div>
);

/* ── Status Badge ───────────────────────────────── */
export const StatusBadge = ({ status }) => {
  const map = {
    pending:   'badge-amber',
    confirmed: 'badge-blue',
    shipped:   'badge-purple',
    delivered: 'badge-green',
    cancelled: 'badge-red',
    admin:     'badge-red',
    warehouse: 'badge-blue',
    sales:     'badge-green',
  };
  return <span className={map[status] || 'badge-gray'}>{status}</span>;
};

/* ── Confirm Dialog ─────────────────────────────── */
export const Confirm = ({ message, onConfirm, onCancel, loading }) => (
  <Modal title="Confirm Action" onClose={onCancel} size="sm">
    <p className="text-sm text-gray-600 mb-6">{message}</p>
    <div className="flex gap-3 justify-end">
      <button className="btn-secondary" onClick={onCancel}>Cancel</button>
      <button className="btn-danger" onClick={onConfirm} disabled={loading}>
        {loading ? <Loader2 size={15} className="animate-spin" /> : 'Confirm'}
      </button>
    </div>
  </Modal>
);

/* ── Form Field ─────────────────────────────────── */
export const Field = ({ label, error, children }) => (
  <div className="mb-4">
    {label && <label className="label">{label}</label>}
    {children}
    {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
  </div>
);
