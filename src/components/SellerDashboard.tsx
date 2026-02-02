import React, { useState } from 'react';
import { ClipboardList, Utensils, LogOut, CheckCircle, XCircle, Clock, MapPin, Plus, X, Image as ImageIcon, Trash2, FileText, Edit } from 'lucide-react';
import { Restaurant, Order, User, MenuItem } from '../../types';

interface SellerDashboardProps {
  user: User;
  restaurant: Restaurant;
  orders: Order[];
  onLogout: () => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  onDeleteMenuItem: (itemId: string) => void;
  onEditMenuItem: (item: MenuItem) => void;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ user, restaurant, orders, onLogout, onUpdateOrderStatus, onAddMenuItem, onDeleteMenuItem, onEditMenuItem }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Shared Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: ''
  });

  const openAddModal = () => {
      setEditingId(null);
      setFormData({ name: '', description: '', price: '', imageUrl: '' });
      setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
      setEditingId(item.id);
      setFormData({
          name: item.name,
          description: item.description,
          price: item.price.toString(),
          imageUrl: item.imageUrl
      });
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name || !formData.price) return;

      const priceVal = parseFloat(formData.price);

      if (editingId) {
          // Edit Mode
          const existingItem = restaurant.menu.find(m => m.id === editingId);
          if (existingItem) {
              onEditMenuItem({
                  id: editingId,
                  name: formData.name,
                  description: formData.description,
                  price: priceVal,
                  imageUrl: formData.imageUrl || existingItem.imageUrl
              });
          }
      } else {
          // Add Mode
          onAddMenuItem({
              name: formData.name,
              description: formData.description,
              price: priceVal,
              imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
          });
      }
      
      setIsModalOpen(false);
  };

  const handleRejectOrder = (orderId: string) => {
      if(window.confirm("Bu siparişi reddetmek istediğinize emin misiniz?")) {
          onUpdateOrderStatus(orderId, 'Reddedildi');
      }
  };

  const handleDeleteItem = (itemId: string) => {
      if(window.confirm("Bu ürünü menüden silmek istediğinize emin misiniz?")) {
          onDeleteMenuItem(itemId);
      }
  };

  // Filter orders for this specific restaurant
  const myOrders = orders.filter(o => o.restaurantId === restaurant.id).sort((a,b) => b.id.localeCompare(a.id));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Seller Header */}
      <div className="bg-primary px-6 py-6 shadow-md text-white">
          <div className="flex justify-between items-start">
              <div>
                  <h1 className="text-2xl font-bold">{restaurant.name}</h1>
                  <p className="text-orange-100 text-sm">Satıcı Paneli • Hoş geldin, {user.name}</p>
              </div>
              <button onClick={onLogout} className="bg-white/20 p-2 rounded-lg hover:bg-white/30 backdrop-blur-sm">
                  <LogOut size={20} />
              </button>
          </div>
          
          {/* Dashboard Tabs */}
          <div className="flex mt-6 bg-primary-dark/20 rounded-lg p-1 space-x-1">
              <button 
                onClick={() => setActiveTab('orders')}
                className={`flex-1 flex items-center justify-center py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-white text-primary shadow-sm' : 'text-orange-100 hover:bg-white/10'}`}
              >
                  <ClipboardList size={16} className="mr-2" />
                  Siparişler ({myOrders.filter(o => o.status !== 'Teslim Edildi' && o.status !== 'Reddedildi').length})
              </button>
              <button 
                onClick={() => setActiveTab('menu')}
                className={`flex-1 flex items-center justify-center py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'menu' ? 'bg-white text-primary shadow-sm' : 'text-orange-100 hover:bg-white/10'}`}
              >
                  <Utensils size={16} className="mr-2" />
                  Menü Yönetimi
              </button>
          </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
          {activeTab === 'orders' ? (
              <div className="space-y-4">
                  <h2 className="font-bold text-gray-700">Gelen Siparişler</h2>
                  {myOrders.length === 0 ? (
                      <div className="text-center py-10 text-gray-400">Henüz sipariş yok.</div>
                  ) : (
                      myOrders.map(order => (
                          <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                  <div>
                                      <span className="text-xs font-bold text-gray-400">#{order.id.toUpperCase()}</span>
                                      <p className="text-sm font-bold text-gray-800">{order.customerName || 'Müşteri'}</p>
                                  </div>
                                  <div className={`text-xs font-bold px-3 py-1 rounded-full 
                                      ${order.status === 'Beklemede' ? 'bg-yellow-100 text-yellow-700' : 
                                        order.status === 'Hazırlanıyor' ? 'bg-blue-100 text-blue-700' :
                                        order.status === 'Reddedildi' ? 'bg-red-100 text-red-700' :
                                        order.status === 'Yolda' ? 'bg-purple-100 text-purple-700' :
                                        'bg-green-100 text-green-700'}`}>
                                      {order.status}
                                  </div>
                              </div>
                              <div className="p-4">
                                  <div className="space-y-2 mb-4">
                                      {order.items.map((item, idx) => (
                                          <div key={idx} className="flex justify-between text-sm">
                                              <span className="text-gray-600"><span className="font-bold text-gray-900">{item.quantity}x</span> {item.name}</span>
                                              <span className="font-medium">{(item.price * item.quantity).toFixed(2)} TL</span>
                                          </div>
                                      ))}
                                      {order.note && (
                                          <div className="mt-2 bg-yellow-50 p-2 rounded text-xs text-yellow-800 border border-yellow-100 flex items-start">
                                              <FileText size={12} className="mr-1 mt-0.5" />
                                              <span>Not: {order.note}</span>
                                          </div>
                                      )}
                                  </div>
                                  <div className="flex items-start text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg">
                                      <MapPin size={14} className="mt-0.5 mr-2 shrink-0" />
                                      {order.address}
                                  </div>
                                  
                                  {/* Action Buttons */}
                                  {order.status !== 'Teslim Edildi' && order.status !== 'Reddedildi' && (
                                    <div className="grid grid-cols-2 gap-2">
                                        {order.status === 'Beklemede' && (
                                            <>
                                                <button 
                                                    onClick={() => onUpdateOrderStatus(order.id, 'Hazırlanıyor')}
                                                    className="bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700"
                                                >
                                                    Onayla & Hazırla
                                                </button>
                                                <button 
                                                    onClick={() => handleRejectOrder(order.id)}
                                                    className="bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-bold hover:bg-gray-200"
                                                >
                                                    Reddet
                                                </button>
                                            </>
                                        )}
                                        {order.status === 'Hazırlanıyor' && (
                                            <button 
                                                onClick={() => onUpdateOrderStatus(order.id, 'Yolda')}
                                                className="bg-purple-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-purple-700 col-span-2"
                                            >
                                                Kuryeye Ver
                                            </button>
                                        )}
                                        {order.status === 'Yolda' && (
                                            <button 
                                                onClick={() => onUpdateOrderStatus(order.id, 'Teslim Edildi')}
                                                className="bg-green-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-700 col-span-2"
                                            >
                                                Teslim Edildi
                                            </button>
                                        )}
                                    </div>
                                  )}
                              </div>
                          </div>
                      ))
                  )}
              </div>
          ) : (
              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="font-bold text-gray-700">Menü Listesi</h2>
                    <button 
                        onClick={openAddModal}
                        className="bg-primary text-white text-sm font-bold px-3 py-2 rounded-lg flex items-center shadow-md active:scale-95 transition-transform"
                    >
                        <Plus size={16} className="mr-1" /> Yeni Ürün
                    </button>
                  </div>
                  {restaurant.menu.map(item => (
                      <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-200 flex space-x-3 items-center">
                          <img src={item.imageUrl} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                          <div className="flex-1">
                              <h3 className="font-bold text-sm text-gray-900">{item.name}</h3>
                              <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                              <p className="text-primary font-bold text-sm mt-1">{item.price} TL</p>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                                onClick={() => openEditModal(item)}
                                className="text-blue-400 hover:text-blue-600"
                            >
                                <Edit size={18} />
                            </button>
                            <button 
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-red-300 hover:text-red-500"
                            >
                                <Trash2 size={18} />
                            </button>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>

      {/* Shared Modal (Add & Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-slide-up">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">{editingId ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Ürün Adı</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                            placeholder="Örn: Karışık Pizza"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Açıklama</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                            placeholder="İçerik bilgisi..."
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Fiyat (TL)</label>
                        <input 
                            type="number" 
                            className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                            placeholder="0.00"
                            value={formData.price}
                            onChange={e => setFormData({...formData, price: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Görsel URL (Opsiyonel)</label>
                        <div className="flex gap-2">
                             <input 
                                type="text" 
                                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                placeholder="https://..."
                                value={formData.imageUrl}
                                onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                            />
                        </div>
                    </div>
                    
                    <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-xl mt-2">
                        {editingId ? 'Güncelle' : 'Menüye Ekle'}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
