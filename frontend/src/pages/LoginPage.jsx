import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Package, Loader2 } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fill = (email) => setForm({ email, password: 'password123' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
            <Package size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-none">EMS</h1>
            <p className="text-xs text-gray-500">Enterprise Inventory Management</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
        <p className="text-sm text-gray-500 mb-6">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="you@company.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" placeholder="••••••••"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
          )}

          <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-3 font-medium">Demo accounts</p>
          <div className="space-y-2">
            {[
              { role: 'Admin',     email: 'admin@ems.com',     color: 'red' },
              { role: 'Warehouse', email: 'warehouse@ems.com', color: 'blue' },
              { role: 'Sales',     email: 'sales@ems.com',     color: 'green' },
            ].map(({ role, email, color }) => (
              <button key={role} type="button" onClick={() => fill(email)}
                className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors
                  ${color === 'red'   ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100' : ''}
                  ${color === 'blue'  ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100' : ''}
                  ${color === 'green' ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' : ''}
                `}>
                <span className="font-medium">{role}</span>
                <span className="ml-2 opacity-70">{email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
