import React from 'react';
import { Glasses } from 'lucide-react';
import { EyewearCategory } from '../types';

interface ProductImageProps {
  src?: string;
  alt?: string;
  category: EyewearCategory;
  className?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  category,
  className = 'w-10 h-10',
}) => {
  return (
    <div
      className={`flex items-center justify-center bg-slate-100 border border-slate-200 text-slate-600 rounded-lg select-none ${className}`}
      title={category}
    >
      <Glasses className="w-5 h-5 stroke-[1.5]" />
    </div>
  );
};
