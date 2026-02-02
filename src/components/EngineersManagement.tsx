import { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Mail, Key, Save, Copy, Check, Shield, User, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface UserAccount {
  id: number;
  email: string;
  name: string;
  role?: 'admin' | 'director' | 'engineer';
  engineer_name: string | null;
  color: string | null;
  tasks_total: number | null;
  created_at: string;
  updated_at?: string;
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

export default function EngineersManagement() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === 'admin';
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [copiedLink, setCopiedLink] = useState<number | null>(null);
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
      // For admin, getEngineerUsers now returns all users (admin, director, engineer)
      // For director, it returns only engineers
      const data = await api.getEngineerUsers();
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
        role: user.role || 'engineer',
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
        // Update user
        if (isAdmin && (editingUser.role === 'admin' || editingUser.role === 'director' || formData.role !== 'engineer')) {
          // Use users API for admin/director accounts
          const updateData: any = {
            name: formData.name,
            email: formData.email,
          };
          
          // Only allow role change if not editing self
          if (editingUser.id !== currentUser?.id) {
            updateData.role = formData.role;
          }
          
          if (formData.password) {
            updateData.password = formData.password;
          }
          
          if (formData.role === 'engineer') {
            updateData.engineer_name = formData.engineer_name;
          }
          
          // Color can be set for all user types
          updateData.color = formData.color;
          
          await api.updateUser(editingUser.id.toString(), updateData);
        } else {
          // Use engineer API for engineer accounts
          await api.updateEngineerUser(editingUser.id.toString(), {
          name: formData.name,
          email: formData.email,
          color: formData.color,
        });
        }
        await loadUsers();
        handleCloseModal();
        alert('User updated successfully');
      } else {
        // Create new user
        if (isAdmin && formData.role !== 'engineer') {
          // Use users API for admin/director accounts
          const createData: any = {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            color: formData.color,
          };
          
          if (formData.password) {
            createData.password = formData.password;
          }
          
          if (formData.sendInvitation) {
            createData.sendInvitation = true;
            createData.confirm = true;
          }
          
          await api.createUser(createData);
        } else {
          // Use engineer API for engineer accounts
        // If sending invitation, show preview first
        if (formData.sendInvitation) {
          try {
            const preview = await api.previewCreateEngineerInvitation({
              name: formData.name,
              email: formData.email,
              sendInvitation: true,
            });

            const confirmationMessage = `
Invitation Email Preview:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Engineer: ${preview.preview.engineerName}
Email: ${preview.preview.engineerEmail}
Expires: ${preview.preview.expiresDate} at ${preview.preview.expiresTime}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

An invitation email will be sent to:
${preview.preview.engineerEmail}

Do you want to create this engineer and send the invitation email?`;

            if (!confirm(confirmationMessage)) {
              return;
            }
          } catch (previewError: any) {
            alert(`Failed to preview invitation: ${previewError.message || 'Unknown error'}`);
            return;
          }
        }

        await api.createEngineerUser({
          name: formData.name,
          email: formData.email,
          color: formData.color,
          sendInvitation: formData.sendInvitation,
          confirm: formData.sendInvitation ? true : undefined,
        });
        }
        await loadUsers();
        handleCloseModal();
        alert('User created successfully');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to save user');
    }
  };

  const handleDelete = async (id: number, name: string, role?: string) => {
    if (id === currentUser?.id) {
      alert('You cannot delete your own account');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${role || 'user'} "${name}"? This will also delete all their tasks.`)) {
      return;
    }

    try {
      if (isAdmin && (role === 'admin' || role === 'director')) {
        await api.deleteUser(id.toString());
      } else {
      await api.deleteEngineerUser(id.toString());
      }
      await loadUsers();
    } catch (error: any) {
      alert(error.message || 'Failed to delete user');
    }
  };

  const handleSendInvitation = async (id: number) => {
    try {
      const user = users.find(u => u.id === id);
      if (!user) {
        alert('User not found');
        return;
      }

      // For engineers, use the preview API; for others, skip preview
      if (user.role === 'engineer' || !user.role) {
        try {
          const preview = await api.previewSendInvitation(id.toString());

          const confirmationMessage = `
Invitation Email Preview:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User: ${preview.preview.engineerName}
Email: ${preview.preview.engineerEmail}
Expires: ${preview.preview.expiresDate} at ${preview.preview.expiresTime}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

An invitation email will be sent to:
${preview.preview.engineerEmail}

Do you want to send the invitation email?`;

          if (!confirm(confirmationMessage)) {
            return;
          }
        } catch (previewError: any) {
          alert(`Failed to preview invitation: ${previewError.message || 'Unknown error'}`);
          return;
        }

        const result = await api.sendInvitation(id.toString());
        await loadUsers();
        
        let copied = false;
        try {
          copied = await copyToClipboard(result.invitationLink);
        } catch (clipboardError) {
          console.warn('Clipboard copy attempt failed:', clipboardError);
        }
        
        let message = '';
        if (result.emailSent) {
          message = '✅ Invitation email sent successfully!\n\n';
        } else {
          message = '⚠️ Invitation link generated, but email was NOT sent.\n';
          if (result.emailError) {
            message += `Error: ${result.emailError}\n`;
          }
          message += '\nPlease send the invitation link manually:\n\n';
        }
        
        message += `Invitation Link:\n${result.invitationLink}\n\n`;
        const saDate = new Date(result.expiresAt).toLocaleString('en-US', { timeZone: 'Asia/Riyadh' });
        message += `Expires: ${saDate}`;
        
        if (copied) {
          setCopiedLink(id);
          setTimeout(() => setCopiedLink(null), 2000);
          message += '\n\n✅ Link copied to clipboard!';
        } else {
          message += '\n\n⚠️ Please copy the link manually.';
        }
        
        alert(message);
      } else {
        // For admin/director, use the users API
        if (!confirm(`Send invitation email to ${user.name} (${user.email})?`)) {
          return;
        }

        const result = await api.sendUserInvitation(id.toString());
        await loadUsers();
        
        let copied = false;
        try {
          copied = await copyToClipboard(result.invitationLink);
        } catch (clipboardError) {
          console.warn('Clipboard copy attempt failed:', clipboardError);
        }
        
        let message = '';
        if (result.emailSent) {
          message = '✅ Invitation email sent successfully!\n\n';
        } else {
          message = '⚠️ Invitation link generated, but email was NOT sent.\n';
          if (result.emailError) {
            message += `Error: ${result.emailError}\n`;
          }
          message += '\nPlease send the invitation link manually:\n\n';
        }
        
        message += `Invitation Link:\n${result.invitationLink}\n\n`;
        const saDate = new Date(result.expiresAt).toLocaleString('en-US', { timeZone: 'Asia/Riyadh' });
        message += `Expires: ${saDate}`;
        
        if (copied) {
          setCopiedLink(id);
          setTimeout(() => setCopiedLink(null), 2000);
          message += '\n\n✅ Link copied to clipboard!';
        } else {
          message += '\n\n⚠️ Please copy the link manually.';
        }
        
        alert(message);
      }
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      alert(error.message || 'Failed to send invitation');
    }
  };

  const handleResetPassword = async (id: number, name: string) => {
    const user = users.find(u => u.id === id);
    const newPassword = prompt(`Reset password for "${name}"?\n\nLeave empty for default password (password123):`);
    if (newPassword === null) return;

    try {
      let result;
      if (user?.role === 'engineer' || !user?.role) {
        result = await api.resetEngineerPassword(id.toString(), newPassword || undefined);
      } else {
        result = await api.resetUserPassword(id.toString(), newPassword || undefined);
      }
      alert(`Password reset successfully!${result.defaultPassword ? '\n\nDefault password: password123' : ''}`);
    } catch (error: any) {
      alert(error.message || 'Failed to reset password');
    }
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (typeof navigator !== 'undefined' && 
          navigator.clipboard && 
          typeof navigator.clipboard.writeText === 'function') {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (clipboardError) {
          console.warn('Clipboard API failed, using fallback:', clipboardError);
        }
      }
      
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      
      if (navigator.userAgent.match(/ipad|iphone/i)) {
        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
        textArea.setSelectionRange(0, 999999);
      } else {
        textArea.focus();
        textArea.select();
      }
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        console.error('execCommand copy failed:', err);
        return false;
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  };

  const copyInvitationLink = async (link: string, id: number) => {
    try {
      const copied = await copyToClipboard(link);
      if (copied) {
        setCopiedLink(id);
        setTimeout(() => setCopiedLink(null), 2000);
      } else {
        alert(`Failed to copy to clipboard. Please copy manually:\n\n${link}`);
      }
    } catch (error) {
      console.error('Error copying invitation link:', error);
      alert(`Failed to copy to clipboard. Please copy manually:\n\n${link}`);
    }
  };

  const isInvitationExpired = (expires: string | null) => {
    if (!expires) return false;
    return new Date(expires) < new Date();
  };

  const getInvitationLink = (user: UserAccount) => {
    if (!user.invitation_token) return null;
    if (isInvitationExpired(user.invitation_expires || null)) return null;
    return `${window.location.origin}/invite/${user.invitation_token}`;
  };

  const getRoleIcon = (role?: string) => {
    const Icon = roleIcons[role as keyof typeof roleIcons] || User;
    return <Icon size={16} />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {isAdmin ? 'Users Management' : 'Engineers Management'}
              </h1>
              <p className="text-gray-600">
                {isAdmin 
                  ? 'Manage all user accounts (Admin, Director, Engineer)' 
                  : 'Manage engineer accounts, invitations, and passwords'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 px-4 py-2 bg-main text-white rounded-lg hover:bg-main-700 transition-colors shadow-md"
              >
                <Plus size={18} />
                {isAdmin ? 'Add User' : 'Add Engineer'}
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
          {loading ? (
            <div className="p-12 text-center">
              <div className="text-gray-600">Loading users...</div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 text-lg">No users found</p>
              <p className="text-gray-500 text-sm mt-2">Click "Add {isAdmin ? 'User' : 'Engineer'}" to create one</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invitation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user, index) => {
                    const invitationLink = getInvitationLink(user);
                    const RoleIcon = roleIcons[user.role as keyof typeof roleIcons] || User;
                    const isCurrentUser = user.id === currentUser?.id;
                    
                    return (
                      <tr key={user.id} className={`hover:bg-gray-50 ${isCurrentUser ? 'bg-blue-50' : ''}`}>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className="text-sm font-semibold text-gray-700">{index + 1}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className="w-4 h-4 rounded-full mr-3"
                              style={{ backgroundColor: user.color || '#9ca3af' }}
                              title={user.color || 'No color set'}
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              {isCurrentUser && (
                                <div className="text-xs text-blue-600">(You)</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                        {isAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleColors[user.role as keyof typeof roleColors] || roleColors.engineer}`}>
                              <RoleIcon size={12} />
                              {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Engineer'}
                            </span>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className="w-8 h-8 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: user.color || '#9ca3af' }}
                            title={user.color || 'No color set - click Edit to set a color'}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.tasks_total || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {invitationLink ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Active</span>
                              <button
                                onClick={() => copyInvitationLink(invitationLink, user.id)}
                                className="text-main hover:text-main-800"
                                title="Copy invitation link"
                              >
                                {copiedLink === user.id ? <Check size={16} /> : <Copy size={16} />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(user)}
                              className="text-main hover:text-main-900 p-2 hover:bg-main-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleSendInvitation(user.id)}
                              className="text-main hover:text-main-900 p-2 hover:bg-main-50 rounded transition-colors"
                              title="Send Invitation"
                            >
                              <Mail size={18} />
                            </button>
                            <button
                              onClick={() => handleResetPassword(user.id, user.name)}
                              className="text-yellow-600 hover:text-yellow-900 p-2 hover:bg-yellow-50 rounded transition-colors"
                              title="Reset Password"
                            >
                              <Key size={18} />
                            </button>
                            {!isCurrentUser && (
                            <button
                                onClick={() => handleDelete(user.id, user.name, user.role)}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
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
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingUser ? `Edit ${editingUser.role || 'User'}` : `Add New ${isAdmin ? 'User' : 'Engineer'}`}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    disabled={editingUser?.id === currentUser?.id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="admin">Admin</option>
                    <option value="director">Director</option>
                    <option value="engineer">Engineer</option>
                  </select>
                  {editingUser?.id === currentUser?.id && (
                    <p className="text-xs text-gray-500 mt-1">You cannot change your own role</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.role === 'engineer' ? 'Engineer Name' : 'Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={`Enter ${formData.role === 'engineer' ? 'engineer' : 'user'} name`}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="user@etec.gov.sa"
                />
              </div>

              {formData.role === 'engineer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Engineer Name *
                  </label>
                  <input
                    type="text"
                    required={formData.role === 'engineer'}
                    value={formData.engineer_name}
                    onChange={(e) => setFormData({ ...formData, engineer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter engineer name"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color {formData.role === 'engineer' ? '*' : ''}
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-full h-12 rounded-lg border-2 transition-all ${
                        formData.color === color
                          ? 'border-gray-900 scale-110 shadow-lg'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Selected: <span className="font-mono">{formData.color}</span>
                </div>
              </div>

              {(isAdmin && formData.role !== 'engineer') && (
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              )}

              {!editingUser && formData.role === 'engineer' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sendInvitation"
                    checked={formData.sendInvitation}
                    onChange={(e) => setFormData({ ...formData, sendInvitation: e.target.checked })}
                    className="w-4 h-4 text-main border-gray-300 rounded focus:ring-main"
                  />
                  <label htmlFor="sendInvitation" className="ml-2 text-sm text-gray-700">
                    Generate invitation link (user will need to set password via link)
                  </label>
                </div>
              )}

              {isAdmin && !editingUser && formData.role !== 'engineer' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sendInvitationAdmin"
                    checked={formData.sendInvitation}
                    onChange={(e) => setFormData({ ...formData, sendInvitation: e.target.checked })}
                    className="w-4 h-4 text-main border-gray-300 rounded focus:ring-main"
                  />
                  <label htmlFor="sendInvitationAdmin" className="ml-2 text-sm text-gray-700">
                    Send invitation email (password will be set via invitation link)
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Save size={20} />
                  {editingUser ? 'Update' : 'Create'} {isAdmin ? 'User' : 'Engineer'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
