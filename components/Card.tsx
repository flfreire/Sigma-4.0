
import React from 'react';

interface CardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass?: string;
}

const Card: React.FC<CardProps> = ({ title, value, icon, colorClass = 'text-brand' }) => {
  return (
    <div className="bg-secondary p-6 rounded-lg shadow-md border border-accent flex items-center space-x-4">
      <div className={`p-3 rounded-full ${colorClass} bg-opacity-20`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-highlight font-medium uppercase">{title}</p>
        <p className="text-2xl font-bold text-light">{value}</p>
      </div>
    </div>
  );
};

export default Card;
