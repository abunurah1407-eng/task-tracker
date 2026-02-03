import { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Mail, Key, Save, Shield, User, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface UserAccount {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'director' | 'engineer';
  engineer_name: string | null;
  color: string | null;
  tasks_total: number | null;
  created_at: string;
  updated_at: string;
  invitation_token: string | null;
  invitation_expires: string | null;
}

const colorOptions = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#a855f7', '#eab308', '#f43f5e', '#8b5cf6'
];

const roleColors = {
  admin: 'bg-purple-100 text-purple-800 border-purple-200',
  director: 'bg-blue-100 text-blue-800 border-blue-200',
  engineer: 'bg-green-100 text-green-800 border-green-200',
};

const roleIcons = {
  admin: Shield,
  director: UserCog,
  engineer: User,
};

export default function UsersManagement() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'engineer' as 'admin' | 'director' | 'engineer',
    password: '',
    engineer_name: '',
    color: colorOptions[0],
    sendInvitation: false,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user?: UserAccount) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        password: '',
        engineer_name: user.engineer_name || '',
        color: user.color || colorOptions[0],
        sendInvitation: false,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'engineer',
        password: '',
        engineer_name: '',
        color: colorOptions[0],
        sendInvitation: false,
      });
    }
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'engineer',
      password: '',
      engineer_name: '',
      color: colorOptions[0],
      sendInvitation: false,
    });
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData: any = {
          name: formData.name,
          email: formData.email,
        };

        // Only allow role change if not editing self
        if (editingUser.id.toString() !== currentUser?.id) {
          updateData.role = formData.role;
        }

        if (formData.password) {
          updateData.password = formData.password;
        }

        if (formData.role === 'engineer') {
          updateData.engineer_name = formData.engineer_name;
          updateData.color = formData.color;
        }

        await api.updateUser(editingUser.id.toString(), updateData);
        await loadUsers();
        handleCloseModal();
        alert('User updated successfully');
      } else {
        const createData: any = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };

        if (formData.password) {
          createData.password = formData.password;
        }

        if (formData.role === 'engineer') {
          createData.engineer_name = formData.engineer_name;
          createData.color = formData.color;
        }

        if (formData.sendInvitation) {
          createData.sendInvitation = true;
          createData.confirm = true;
        }

        await api.createUser(createData);
        await loadUsers();
        handleCloseModal();
        alert('User created successfully');
      }
    } catch (error: any) {
      console.error('Error saving user:', error);
      alert(error.message || 'Failed to save user');
    }
  };

  const handleDelete = async (userId: number) => {
    if (userId.toString() === currentUser?.id) {
      alert('You cannot delete your own account');
      return;
    }

    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteUser(userId.toString());
      await loadUsers();
      alert('User deleted successfully');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(error.message || 'Failed to delete user');
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900 text-xl">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Users Management
              </h1>
              <p className="text-gray-600">
                Manage all user accounts (Admin, Director, Engineer)
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 px-4 py-2 bg-main text-white rounded-lg hover:bg-main-700 transition-colors shadow-md"
              >
                <Plus size={18} />
                Add User
              </button>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
              >
                Back
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engineer Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => {
                  const RoleIcon = roleIcons[user.role] || User;
                  const isCurrentUser = user.id.toString() === currentUser?.id;
                  
                  return (
                    <tr key={user.id} className={isCurrentUser ? 'bg-blue-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.color && (
                            <div
                              className="w-4 h-4 rounded-full mr-3"
                              style={{ backgroundColor: user.color }}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            {isCurrentUser && (
                              <div className="text-xs text-blue-600">(You)</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        {user.invitation_token && (
                          <div className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                            <Mail size={12} />
                            Invitation pending
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleColors[user.role]}`}>
                          <RoleIcon size={12} />
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.engineer_name || '-'}
                        </div>
                        {user.tasks_total !== null && (
                          <div className="text-xs text-gray-500">{user.tasks_total} tasks</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenModal(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit user"
                          >
                            <Edit size={18} />
                          </button>
                          {!isCurrentUser && (
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete user"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingUser ? 'Edit User' : 'Create New User'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-main"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-main"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    disabled={editingUser?.id === currentUser?.id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-main disabled:bg-gray-100"
                  >
                    <option value="admin">Admin</option>
                    <option value="director">Director</option>
                    <option value="engineer">Engineer</option>
                  </select>
                  {editingUser?.id === currentUser?.id && (
                    <p className="text-xs text-gray-500 mt-1">You cannot change your own role</p>
                  )}
                </div>

                {formData.role === 'engineer' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Engineer Name *
                      </label>
                      <input
                        type="text"
                        required={formData.role === 'engineer'}
                        value={formData.engineer_name}
                        onChange={(e) => setFormData({ ...formData, engineer_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-main"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Color
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setFormData({ ...formData, color })}
                            className={`w-10 h-10 rounded-full border-2 ${
                              formData.color === color ? 'border-gray-900' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                    {!editingUser && <span className="text-red-500"> *</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editingUser}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-main"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                    >
                      <Key size={18} />
                    </button>
                  </div>
                </div>

                {!editingUser && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="sendInvitation"
                      checked={formData.sendInvitation}
                      onChange={(e) => setFormData({ ...formData, sendInvitation: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="sendInvitation" className="text-sm text-gray-700">
                      Send invitation email (password will be set via invitation link)
                    </label>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-main text-white rounded-lg hover:bg-main-700 transition-colors flex items-center gap-2"
                  >
                    <Save size={18} />
                    {editingUser ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

