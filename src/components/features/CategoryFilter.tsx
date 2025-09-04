
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

const CategoryFilter = ({ categories, selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm border border-white/20 hover:bg-black/60 transition-colors"
      >
        {selectedCategory || 'All Categories'} ▼
      </button>
      
      {isVisible && (
        <div className="absolute top-12 left-0 right-0 bg-black/90 backdrop-blur-sm rounded-lg p-2 border border-white/20 max-h-64 overflow-y-auto">
          <div className="space-y-1">
            <button
              onClick={() => {
                onCategoryChange(null);
                setIsVisible(false);
              }}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                !selectedCategory ? 'bg-blue-600 text-white' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  onCategoryChange(category);
                  setIsVisible(false);
                }}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  selectedCategory === category ? 'bg-blue-600 text-white' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;
