import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout = () => (
  <div className="flex h-screen overflow-hidden">
    <Sidebar />
    <main className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto">
        <Outlet />
      </div>
    </main>
  </div>
);
