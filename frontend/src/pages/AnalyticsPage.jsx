import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import { PageHeader, Spinner, Empty } from '../components/ui';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#84cc16'];
const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN')}`;

export const AnalyticsPage = () => {
  const [days, setDays] = useState(30);

  const { data: stockValue } = useQuery({
    queryKey: ['stock-value'],
    queryFn: () => api.get('/analytics/stock-value').then(r => r.data.data),
  });

  const { data: topProducts } = useQuery({
    queryKey: ['top-products', 10],
    queryFn: () => api.get('/analytics/top-products?limit=10').then(r => r.data.data),
  });

  const { data: movements, isLoading: mvLoading } = useQuery({
    queryKey: ['movement-trend', days],
    queryFn: () => api.get(`/analytics/movements?days=${days}`).then(r => r.data.data),
  });

  const { data: orderTrend, isLoading: otLoading } = useQuery({
    queryKey: ['order-trend', days],
    queryFn: () => api.get(`/analytics/order-trend?days=${days}`).then(r => r.data.data),
  });

  const { data: reorderReport } = useQuery({
    queryKey: ['reorder-report'],
    queryFn: () => api.get('/analytics/reorder-report').then(r => r.data.data),
  });

  const totalStockValue = stockValue?.reduce((a, b) => a + parseFloat(b.value), 0) || 0;

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Inventory intelligence and reporting"
        action={
          <select className="select w-32" value={days} onChange={e => setDays(parseInt(e.target.value))}>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
        }
      />

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Stock value by category - Pie */}
        <div className="card card-body">
          <h3 className="font-medium text-sm text-gray-800 mb-1">Stock Value by Category</h3>
          <p className="text-xs text-gray-400 mb-4">Total: {fmt(totalStockValue)}</p>
          {stockValue?.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={stockValue} dataKey="value" nameKey="category" cx="50%" cy="50%"
                  outerRadius={90} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {stockValue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <Spinner />}
        </div>

        {/* Top products - horizontal bar */}
        <div className="card card-body">
          <h3 className="font-medium text-sm text-gray-800 mb-4">Top 10 Products by Units Sold</h3>
          {topProducts?.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }}
                  tickFormatter={n => n.length > 16 ? n.slice(0, 15) + '…' : n} />
                <Tooltip />
                <Bar dataKey="total_sold" name="Units Sold" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Spinner />}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Movements trend */}
        <div className="card card-body">
          <h3 className="font-medium text-sm text-gray-800 mb-4">Stock Movements ({days}d)</h3>
          {mvLoading ? <Spinner /> : movements?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={movements}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="stock_in"  name="Stock In"  stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="stock_out" name="Stock Out" stroke="#f43f5e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <Empty message="No movement data for this period" />}
        </div>

        {/* Orders trend */}
        <div className="card card-body">
          <h3 className="font-medium text-sm text-gray-800 mb-4">Order Volume ({days}d)</h3>
          {otLoading ? <Spinner /> : orderTrend?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={orderTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="purchases" name="Purchases" fill="#6366f1" stackId="a" />
                <Bar dataKey="sales"     name="Sales"     fill="#10b981" stackId="a" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty message="No order data for this period" />}
        </div>
      </div>

      {/* Reorder Report */}
      <div className="card card-body">
        <h3 className="font-medium text-sm text-gray-800 mb-1 flex items-center gap-2">
          <AlertTriangle size={15} className="text-amber-500" /> Reorder Report
        </h3>
        <p className="text-xs text-gray-400 mb-4">Products below reorder level with supplier info and lead times</p>
        {reorderReport?.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>SKU</th><th>Product</th><th>Category</th><th>In Stock</th>
                    <th>Reorder At</th><th>Units Needed</th><th>Supplier</th>
                    <th>Contact</th><th>Lead Time</th></tr>
              </thead>
              <tbody>
                {reorderReport.map(r => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs text-gray-500">{r.sku}</td>
                    <td className="font-medium text-gray-900">{r.name}</td>
                    <td><span className="badge-gray">{r.category}</span></td>
                    <td className="text-red-600 font-bold">{r.quantity_on_hand}</td>
                    <td className="text-gray-500">{r.reorder_level}</td>
                    <td className="text-amber-700 font-semibold">{r.units_needed}</td>
                    <td className="text-xs">{r.supplier_name || '—'}</td>
                    <td className="text-xs text-gray-500">{r.contact_email || '—'}</td>
                    <td><span className="badge-blue">{r.lead_time_days ?? '—'}d</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-green-600">
            <p className="text-4xl mb-2">✓</p>
            <p className="text-sm font-medium">All stock levels above reorder points</p>
          </div>
        )}
      </div>
    </div>
  );
};
