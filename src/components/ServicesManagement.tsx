import { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface Service {
  id: number;
  name: string;
  assigned_to: string | null;
  category: 'primary' | 'secondary';
  count: number;
  created_at: string;
  updated_at: string;
}

export default function ServicesManagement() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    assignedTo: '',
    category: 'primary' as 'primary' | 'secondary',
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await api.getServices();
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
      alert('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        assignedTo: service.assigned_to || '',
        category: service.category,
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        assignedTo: '',
        category: 'primary',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    setFormData({
      name: '',
      assignedTo: '',
      category: 'primary',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await api.updateService(editingService.id.toString(), {
          name: formData.name,
          assignedTo: formData.assignedTo || undefined,
          category: formData.category,
        });
      } else {
        await api.createService({
          name: formData.name,
          assignedTo: formData.assignedTo || undefined,
          category: formData.category,
        });
      }
      await loadServices();
      handleCloseModal();
    } catch (error: any) {
      alert(error.message || 'Failed to save service');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete service "${name}"? This will fail if there are tasks associated with this service.`)) {
      return;
    }
    try {
      await api.deleteService(id.toString());
      await loadServices();
    } catch (error: any) {
      alert(error.message || 'Failed to delete service');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Services Management
              </h1>
              <p className="text-gray-600">
                Manage services and their categories
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 px-4 py-2 bg-main text-white rounded-lg hover:bg-main-700 transition-colors shadow-md"
              >
                <Plus size={18} />
                Add Service
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

        {/* Services Table */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="text-gray-600">Loading services...</div>
            </div>
          ) : services.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 text-lg">No services found</p>
              <p className="text-gray-500 text-sm mt-2">Click "Add Service" to create one</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {services.map((service, index) => (
                    <tr key={service.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-semibold text-gray-700">{index + 1}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{service.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          service.category === 'primary'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {service.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {service.assigned_to || <span className="text-gray-400 italic">Unassigned</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{service.count || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(service.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(service)}
                            className="text-main hover:text-main-900 p-2 hover:bg-main-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id, service.name)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
                {editingService ? 'Edit Service' : 'Add New Service'}
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
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter service name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as 'primary' | 'secondary' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To (Optional)
                </label>
                <input
                  type="text"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter engineer name or leave empty"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Save size={20} />
                  {editingService ? 'Update' : 'Create'} Service
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

