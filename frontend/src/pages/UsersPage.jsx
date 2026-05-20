import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { PageHeader, Spinner, Empty, StatusBadge } from '../components/ui';

const ROLES = ['admin', 'warehouse', 'sales'];

export const UsersPage = () => {
  const qc = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data.data),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => api.patch(`/users/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, is_active }) => api.patch(`/users/${id}/active`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <div>
      <PageHeader title="User Management" subtitle="Manage roles and access for all system users" />
      <p className="text-sm text-gray-500 mb-5">
        New users are created via <span className="font-mono bg-gray-100 px-1 rounded">POST /api/auth/register</span> (Admin only).
      </p>

      {isLoading ? <Spinner /> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users?.length ? users.map(u => (
                <tr key={u.id}>
                  <td className="font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold
                        flex items-center justify-center shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      {u.name}
                    </div>
                  </td>
                  <td className="text-gray-500 text-sm">{u.email}</td>
                  <td>
                    <select className="select text-xs py-1 w-28" value={u.role}
                      onChange={e => roleMutation.mutate({ id: u.id, role: e.target.value })}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>
                    <span className={u.is_active ? 'badge-green' : 'badge-red'}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                  <td>
                    <button
                      className={`btn-sm ${u.is_active ? 'btn-secondary text-red-600 border-red-200 hover:bg-red-50' : 'btn-primary'}`}
                      onClick={() => activeMutation.mutate({ id: u.id, is_active: !u.is_active })}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              )) : <tr><td colSpan={6}><Empty message="No users found" /></td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
