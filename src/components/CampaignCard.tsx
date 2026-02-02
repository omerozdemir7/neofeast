import React from 'react';
import { Campaign } from '../../types';

interface CampaignCardProps {
  campaign: Campaign;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign }) => {
  return (
    <div className="inline-block w-72 mr-4 snap-start">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 h-full flex flex-col">
        <div className="h-32 w-full relative">
            <img 
            src={campaign.imageUrl} 
            alt={campaign.title} 
            className="w-full h-full object-cover"
            />
        </div>
        <div className="p-3 flex-1 flex flex-col justify-between">
            <div>
                <h3 className="font-bold text-gray-900">{campaign.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{campaign.subtitle}</p>
            </div>
            {campaign.code && (
                <div className="mt-2">
                    <span className="text-xs text-gray-400">Kod: </span>
                    <span className="text-xs font-bold text-primary">{campaign.code}</span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CampaignCard;
