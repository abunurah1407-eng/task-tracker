import { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Mail, Key, Save, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface EngineerUser {
  id: number;
  email: string;
  name: string;
  engineer_name: string;
  color: string;
  tasks_total: number;
  created_at: string;
  invitation_token: string | null;
  invitation_expires: string | null;
}

const colorOptions = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#a855f7', '#eab308', '#f43f5e', '#8b5cf6'
];

export default function EngineersManagement() {
  const navigate = useNavigate();
  const [engineers, setEngineers] = useState<EngineerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState<EngineerUser | null>(null);
  const [copiedLink, setCopiedLink] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    color: colorOptions[0],
    sendInvitation: false,
  });

  useEffect(() => {
    loadEngineers();
  }, []);

  const loadEngineers = async () => {
    try {
      setLoading(true);
      const data = await api.getEngineerUsers();
      setEngineers(data);
    } catch (error) {
      console.error('Error loading engineers:', error);
      alert('Failed to load engineers');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (engineer?: EngineerUser) => {
    if (engineer) {
      setEditingEngineer(engineer);
      setFormData({
        name: engineer.name,
        email: engineer.email,
        color: engineer.color || colorOptions[0],
        sendInvitation: false,
      });
    } else {
      setEditingEngineer(null);
      setFormData({
        name: '',
        email: '',
        color: colorOptions[0],
        sendInvitation: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEngineer(null);
    setFormData({
      name: '',
      email: '',
      color: colorOptions[0],
      sendInvitation: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEngineer) {
        await api.updateEngineerUser(editingEngineer.id.toString(), {
          name: formData.name,
          email: formData.email,
          color: formData.color,
        });
      } else {
        await api.createEngineerUser({
          name: formData.name,
          email: formData.email,
          color: formData.color,
          sendInvitation: formData.sendInvitation,
        });
      }
      await loadEngineers();
      handleCloseModal();
    } catch (error: any) {
      alert(error.message || 'Failed to save engineer');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete engineer "${name}"? This will also delete all their tasks.`)) {
      return;
    }
    try {
      await api.deleteEngineerUser(id.toString());
      await loadEngineers();
    } catch (error: any) {
      alert(error.message || 'Failed to delete engineer');
    }
  };

  // Safe clipboard copy function with fallback
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      
      // Fallback to older method
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  };

  const handleSendInvitation = async (id: number) => {
    try {
      const result = await api.sendInvitation(id.toString());
      await loadEngineers();
      
      // Try to copy to clipboard
      const copied = await copyToClipboard(result.invitationLink);
      
      if (copied) {
        setCopiedLink(id);
        setTimeout(() => setCopiedLink(null), 2000);
        alert(`Invitation link copied to clipboard!\n\n${result.invitationLink}\n\nExpires: ${new Date(result.expiresAt).toLocaleString()}`);
      } else {
        // If clipboard copy failed, just show the link
        alert(`Invitation link generated!\n\n${result.invitationLink}\n\nExpires: ${new Date(result.expiresAt).toLocaleString()}\n\nPlease copy the link manually.`);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to send invitation');
    }
  };

  const handleResetPassword = async (id: number, name: string) => {
    const newPassword = prompt(`Reset password for "${name}"?\n\nLeave empty for default password (password123):`);
    if (newPassword === null) return; // User cancelled

    try {
      const result = await api.resetEngineerPassword(id.toString(), newPassword || undefined);
      alert(`Password reset successfully!${result.defaultPassword ? '\n\nDefault password: password123' : ''}`);
    } catch (error: any) {
      alert(error.message || 'Failed to reset password');
    }
  };

  const copyInvitationLink = async (link: string, id: number) => {
    const copied = await copyToClipboard(link);
    if (copied) {
      setCopiedLink(id);
      setTimeout(() => setCopiedLink(null), 2000);
    } else {
      alert(`Failed to copy to clipboard. Please copy manually:\n\n${link}`);
    }
  };

  const isInvitationExpired = (expires: string | null) => {
    if (!expires) return false;
    return new Date(expires) < new Date();
  };

  const getInvitationLink = (engineer: EngineerUser) => {
    if (!engineer.invitation_token) return null;
    if (isInvitationExpired(engineer.invitation_expires || null)) return null;
    return `${window.location.origin}/invite/${engineer.invitation_token}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Engineers Management
              </h1>
              <p className="text-gray-600">
                Manage engineer accounts, invitations, and passwords
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 px-4 py-2 bg-main text-white rounded-lg hover:bg-main-700 transition-colors shadow-md"
              >
                <Plus size={18} />
                Add Engineer
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

        {/* Engineers Table */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="text-gray-600">Loading engineers...</div>
            </div>
          ) : engineers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 text-lg">No engineers found</p>
              <p className="text-gray-500 text-sm mt-2">Click "Add Engineer" to create one</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invitation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {engineers.map((engineer, index) => {
                    const invitationLink = getInvitationLink(engineer);
                    return (
                      <tr key={engineer.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className="text-sm font-semibold text-gray-700">{index + 1}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className="w-4 h-4 rounded-full mr-3"
                              style={{ backgroundColor: engineer.color || '#3b82f6' }}
                            />
                            <span className="text-sm font-medium text-gray-900">{engineer.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{engineer.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className="w-8 h-8 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: engineer.color || '#3b82f6' }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{engineer.tasks_total || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {invitationLink ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Active</span>
                              <button
                                onClick={() => copyInvitationLink(invitationLink, engineer.id)}
                                className="text-main hover:text-main-800"
                                title="Copy invitation link"
                              >
                                {copiedLink === engineer.id ? <Check size={16} /> : <Copy size={16} />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(engineer.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(engineer)}
                              className="text-main hover:text-main-900 p-2 hover:bg-main-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleSendInvitation(engineer.id)}
                              className="text-main hover:text-main-900 p-2 hover:bg-main-50 rounded transition-colors"
                              title="Send Invitation"
                            >
                              <Mail size={18} />
                            </button>
                            <button
                              onClick={() => handleResetPassword(engineer.id, engineer.name)}
                              className="text-yellow-600 hover:text-yellow-900 p-2 hover:bg-yellow-50 rounded transition-colors"
                              title="Reset Password"
                            >
                              <Key size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(engineer.id, engineer.name)}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
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
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingEngineer ? 'Edit Engineer' : 'Add New Engineer'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Engineer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter engineer name"
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
                  placeholder="engineer@etec.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color *
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

              {!editingEngineer && (
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

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Save size={20} />
                  {editingEngineer ? 'Update' : 'Create'} Engineer
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

