import React, { useState } from 'react';
import { X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, validation and token auth happens here
    onLogin(email);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:w-96 rounded-t-2xl sm:rounded-2xl p-6 relative animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Giriş Yap</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              placeholder="E-posta adresiniz"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              placeholder="********"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-orange-600 transition-colors shadow-md shadow-orange-200"
          >
            Giriş Yap
          </button>
        </form>

        <div className="mt-4 text-center">
          <span className="text-sm text-gray-500">Hesabın yok mu? </span>
          <button className="text-sm font-bold text-primary">Kayıt Ol</button>
        </div>

        <div className="mt-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-xs font-bold text-gray-700 mb-2">Rol Testi İçin Hesaplar:</p>
            <div className="grid gap-2">
              <button onClick={() => { setEmail('admin@neofeast.com'); setPassword('admin'); }} className="text-left text-xs text-blue-600 hover:underline">
                👑 Admin: admin@neofeast.com
              </button>
              <button onClick={() => { setEmail('pizza@neofeast.com'); setPassword('seller'); }} className="text-left text-xs text-orange-600 hover:underline">
                👨‍🍳 Satıcı (Pizza): pizza@neofeast.com
              </button>
              <button onClick={() => { setEmail('cprookie2@gmail.com'); setPassword('user'); }} className="text-left text-xs text-green-600 hover:underline">
                👤 Müşteri: cprookie2@gmail.com
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
