import React from 'react';
import { Home, Search, ShoppingCart, Receipt, User as UserIcon } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  cartItemCount: number;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, cartItemCount }) => {
  const tabs = [
    { id: 'home', label: 'Ana Sayfa', icon: Home },
    { id: 'search', label: 'Ara', icon: Search },
    { id: 'cart', label: 'Sepet', icon: ShoppingCart },
    { id: 'orders', label: 'Siparişler', icon: Receipt },
    { id: 'profile', label: 'Profil', icon: UserIcon },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-6 flex justify-between items-center z-50 shadow-lg pb-safe">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center space-y-1 ${isActive ? 'text-primary' : 'text-gray-400'}`}
          >
            <div className="relative">
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              {tab.id === 'cart' && cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
