import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native'; // Native bileşenler
import { Star, Clock } from 'lucide-react-native'; // Native ikonlar
import { Restaurant } from '../../types';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: (restaurant: Restaurant) => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onClick }) => {
  return (
    <TouchableOpacity 
      onPress={() => onClick(restaurant)} // onClick yok, onPress var
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4 flex-row active:opacity-90"
    >
      <View className="w-1/3 h-32 relative">
        <Image 
          source={{ uri: restaurant.imageUrl }} // src yok, source={{ uri: ... }} var
          className="w-full h-full"
          resizeMode="cover" // object-cover yerine
        />
      </View>
      <View className="w-2/3 p-3 flex-col justify-between">
        <View>
          <Text className="text-lg font-bold text-gray-900">{restaurant.name}</Text>
          <Text className="text-xs text-gray-500" numberOfLines={2}>{restaurant.description}</Text> 
        </View>
        
        <View className="flex-row items-center space-x-3 mt-2">
          <View className="flex-row items-center text-yellow-500">
            <Star size={14} color="#EAB308" fill="#EAB308" />
            <Text className="text-sm font-bold ml-1">{restaurant.rating}</Text>
          </View>
          <View className="flex-row items-center text-gray-400">
            <Clock size={14} color="#9CA3AF" />
            <Text className="text-xs ml-1">{restaurant.deliveryTimeRange}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default RestaurantCard;