import { NavLink, useNavigate } from 'react-router-dom';
import { OrganizationSwitcher, UserButton } from '@clerk/clerk-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart,
  Truck, BarChart2, Users
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';

const navItems = [
  { to: '/',           label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/products',   label: 'Products',   icon: Package },
  { to: '/inventory',  label: 'Inventory',  icon: Warehouse },
  { to: '/orders',     label: 'Orders',     icon: ShoppingCart },
  { to: '/suppliers',  label: 'Suppliers',  icon: Truck },
  { to: '/analytics',  label: 'Analytics',  icon: BarChart2 },
  { to: '/users',      label: 'Users',      icon: Users, adminOnly: true },
];

export const Sidebar = () => {
  const { user, organization } = useAuth();

  const { data: kpis } = useQuery({
    queryKey: ['kpis', organization?.id],
    queryFn: () => api.get('/analytics/kpis').then(r => r.data.data),
    refetchInterval: 60_000,
    enabled: !!organization,
  });

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Package size={16} className="text-white" />
          </div>
          <span className="font-semibold text-gray-900">EMS</span>
        </div>
      </div>

      {/* Organization Switcher */}
      <div className="px-3 py-3 border-b border-gray-100">
        <OrganizationSwitcher
          hidePersonal={true}
          afterCreateOrganizationUrl="/"
          afterSelectOrganizationUrl="/"
          appearance={{
            elements: {
              rootBox: 'w-full',
              organizationSwitcherTrigger: 'w-full justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm',
            }
          }}
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, adminOnly }) => {
          if (adminOnly && user?.role !== 'admin') return null;
          return (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {label === 'Inventory' && kpis?.low_stock_count > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {kpis.low_stock_count}
                </span>
              )}
              {label === 'Orders' && kpis?.pending_orders > 0 && (
                <span className="bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {kpis.pending_orders}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-gray-100">
        <UserButton
          afterSignOutUrl="/login"
          appearance={{
            elements: {
              rootBox: 'w-full',
              userButtonTrigger: 'w-full justify-start',
              userButtonBox: 'flex-row-reverse',
            }
          }}
          showName={true}
        />
      </div>
    </aside>
  );
};
