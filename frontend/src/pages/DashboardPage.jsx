import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from 'recharts';
import { DollarSign, ShoppingCart, AlertTriangle, TrendingUp, Package } from 'lucide-react';
import api from '../api/axios';
import { KpiCard, Spinner, PageHeader, Empty } from '../components/ui';

const fmt = (n) => n >= 100000
  ? `₹${(n / 100000).toFixed(1)}L`
  : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`;

export const DashboardPage = () => {
  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ['kpis'],
    queryFn: () => api.get('/analytics/kpis').then(r => r.data.data),
    refetchInterval: 60_000,
  });

  const { data: topProducts } = useQuery({
    queryKey: ['top-products'],
    queryFn: () => api.get('/analytics/top-products?limit=8').then(r => r.data.data),
  });

  const { data: movementTrend } = useQuery({
    queryKey: ['movement-trend'],
    queryFn: () => api.get('/analytics/movements?days=14').then(r => r.data.data),
  });

  const { data: orderTrend } = useQuery({
    queryKey: ['order-trend'],
    queryFn: () => api.get('/analytics/order-trend?days=14').then(r => r.data.data),
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => api.get('/inventory/low-stock').then(r => r.data.data),
  });

  if (kpiLoading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Real-time overview of your inventory operations" />

      {/* Low-stock banner */}
      {kpis?.low_stock_count > 0 && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl px-5 py-3 text-sm font-medium">
          <AlertTriangle size={18} className="shrink-0" />
          {kpis.low_stock_count} product{kpis.low_stock_count > 1 ? 's' : ''} below reorder level — immediate restocking required.
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Stock Value"   value={fmt(kpis?.total_stock_value ?? 0)} icon={DollarSign} color="brand"  sub="Across all products" />
        <KpiCard label="Pending Orders"      value={kpis?.pending_orders ?? 0}          icon={ShoppingCart} color="amber" sub="Awaiting processing" />
        <KpiCard label="Low Stock Alerts"    value={kpis?.low_stock_count ?? 0}         icon={AlertTriangle} color={kpis?.low_stock_count > 0 ? 'red' : 'green'} sub="Below reorder level" />
        <KpiCard label="Orders This Month"   value={kpis?.orders_this_month ?? 0}       icon={TrendingUp} color="green" sub="Current month total" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="card card-body">
          <h3 className="font-medium text-gray-800 mb-4 text-sm">Stock Movements (14 days)</h3>
          {movementTrend?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={movementTrend}>
                <defs>
                  <linearGradient id="gIn"  x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={d => `Date: ${d}`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="stock_in"  name="In"  stroke="#6366f1" fill="url(#gIn)"  strokeWidth={2} />
                <Area type="monotone" dataKey="stock_out" name="Out" stroke="#f43f5e" fill="url(#gOut)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <Empty message="No movement data yet" />}
        </div>

        <div className="card card-body">
          <h3 className="font-medium text-gray-800 mb-4 text-sm">Orders Trend (14 days)</h3>
          {orderTrend?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={orderTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="purchases" name="Purchases" fill="#6366f1" radius={[3,3,0,0]} />
                <Bar dataKey="sales"     name="Sales"     fill="#10b981" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty message="No order data yet" />}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top products */}
        <div className="card card-body">
          <h3 className="font-medium text-gray-800 mb-4 text-sm">Top Selling Products</h3>
          {topProducts?.length ? (
            <div className="space-y-2">
              {topProducts.slice(0, 6).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{p.total_sold} units</p>
                    <p className="text-xs text-gray-400">{fmt(parseFloat(p.total_revenue))}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty message="No sales data" />}
        </div>

        {/* Low stock table */}
        <div className="card card-body">
          <h3 className="font-medium text-gray-800 mb-4 text-sm flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500" /> Low Stock Alerts
          </h3>
          {lowStock?.length ? (
            <div className="space-y-2">
              {lowStock.slice(0, 6).map(item => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-red-50">
                  <Package size={14} className="text-red-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-500">{item.supplier_name || 'No supplier'} · {item.lead_time_days}d lead</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-700">{item.quantity_on_hand}</p>
                    <p className="text-xs text-gray-400">/ {item.reorder_level} min</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-green-600">
              <p className="text-4xl mb-2">✓</p>
              <p className="text-sm font-medium">All stock levels healthy</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
