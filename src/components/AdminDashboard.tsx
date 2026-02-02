import React, { useState } from 'react';
import { Users, Store, BarChart3, Settings, LogOut, Trash2, Edit, Plus, X, MapPin } from 'lucide-react';
import { Restaurant, User } from '../../types';

interface AdminDashboardProps {
  user: User;
  restaurants: Restaurant[];
  onLogout: () => void;
  onDeleteRestaurant: (id: string) => void;
  onAddRestaurant: (restaurant: Omit<Restaurant, 'id' | 'menu' | 'rating'>) => void;
  onEditRestaurant: (restaurant: Restaurant) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, restaurants, onLogout, onDeleteRestaurant, onAddRestaurant, onEditRestaurant }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Shared Form State (for both Add and Edit)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    deliveryTimeRange: '30-40 dk',
    address: '',
    imageUrl: '',
    description: ''
  });

  const openAddModal = () => {
      setEditingId(null);
      setFormData({ name: '', category: '', deliveryTimeRange: '30-40 dk', address: '', imageUrl: '', description: '' });
      setIsModalOpen(true);
  };

  const openEditModal = (restaurant: Restaurant) => {
      setEditingId(restaurant.id);
      setFormData({
          name: restaurant.name,
          category: restaurant.category,
          deliveryTimeRange: restaurant.deliveryTimeRange,
          address: restaurant.address,
          imageUrl: restaurant.imageUrl,
          description: restaurant.description
      });
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) return;

    if (editingId) {
        // Edit Mode
        const existingRest = restaurants.find(r => r.id === editingId);
        if (existingRest) {
            onEditRestaurant({
                ...existingRest,
                name: formData.name,
                category: formData.category,
                deliveryTimeRange: formData.deliveryTimeRange,
                address: formData.address || existingRest.address,
                imageUrl: formData.imageUrl || existingRest.imageUrl,
                description: formData.description || existingRest.description
            });
        }
    } else {
        // Add Mode
        onAddRestaurant({
            name: formData.name,
            category: formData.category,
            deliveryTimeRange: formData.deliveryTimeRange,
            minDeliveryTime: 30,
            maxDeliveryTime: 40,
            address: formData.address || 'İstanbul',
            phone: '0212 000 0000',
            imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
            description: 'Yeni eklenen restoran',
        });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
      if(window.confirm(`${name} restoranını silmek istediğinize emin misiniz?`)) {
          onDeleteRestaurant(id);
      }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Top Bar */}
      <div className="bg-gray-900 text-white px-6 py-4 shadow-md sticky top-0 z-20">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-xl font-bold tracking-wider">NEOFEAST <span className="text-red-500 text-xs bg-white px-1.5 py-0.5 rounded ml-2">ADMIN</span></h1>
                <p className="text-xs text-gray-400">Sistem Yönetimi</p>
            </div>
            <button onClick={onLogout} className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700">
                <LogOut size={18} />
            </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 p-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2 text-blue-600 mb-2">
                <Store size={20} />
                <span className="font-bold">Restoranlar</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{restaurants.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2 text-green-600 mb-2">
                <Users size={20} />
                <span className="font-bold">Kullanıcılar</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">1,248</p>
        </div>
      </div>

      {/* Restaurant List Management */}
      <div className="px-4 mt-2">
          <div className="flex justify-between items-end mb-3">
            <h2 className="font-bold text-gray-700 flex items-center">
                <Settings size={18} className="mr-2" />
                Restoran Yönetimi
            </h2>
            <button 
                onClick={openAddModal}
                className="bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center hover:bg-gray-800"
            >
                <Plus size={14} className="mr-1" /> Ekle
            </button>
          </div>

          <div className="space-y-3">
              {restaurants.map(r => (
                  <div key={r.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                          <img src={r.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                          <div>
                              <h3 className="font-bold text-gray-900">{r.name}</h3>
                              <p className="text-xs text-gray-500">{r.category} • ID: {r.id}</p>
                          </div>
                      </div>
                      <div className="flex space-x-2">
                          <button 
                            onClick={() => openEditModal(r)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                          >
                              <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(r.id, r.name)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                          >
                              <Trash2 size={18} />
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* Shared Modal (Add & Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-slide-up">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">{editingId ? 'Restoran Düzenle' : 'Restoran Ekle'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Restoran Adı</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none"
                            placeholder="Örn: Paşa Döner"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Kategori</label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none"
                                placeholder="Örn: Kebap"
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Teslimat Süresi</label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none"
                                placeholder="30-40 dk"
                                value={formData.deliveryTimeRange}
                                onChange={e => setFormData({...formData, deliveryTimeRange: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Adres</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none"
                            placeholder="Semt/Mahalle"
                            value={formData.address}
                            onChange={e => setFormData({...formData, address: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Görsel URL</label>
                         <input 
                            type="text" 
                            className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none"
                            placeholder="https://..."
                            value={formData.imageUrl}
                            onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                        />
                    </div>
                    
                    <button type="submit" className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl mt-2 hover:bg-gray-800">
                        {editingId ? 'Güncelle' : 'Kaydet'}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
