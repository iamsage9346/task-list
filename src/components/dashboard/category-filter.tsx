'use client';

import { Badge } from '@/components/ui/badge';
import type { Category } from '@/lib/types/database';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelect: (categoryId: string | null) => void;
}

export function CategoryFilter({ categories, selectedCategory, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge
        variant={selectedCategory === null ? 'default' : 'outline'}
        className="cursor-pointer"
        onClick={() => onSelect(null)}
      >
        전체
      </Badge>
      {categories.map((category) => (
        <Badge
          key={category.id}
          variant={selectedCategory === category.id ? 'default' : 'outline'}
          className="cursor-pointer"
          style={
            selectedCategory === category.id
              ? { backgroundColor: category.color, borderColor: category.color }
              : { borderColor: category.color, color: category.color }
          }
          onClick={() => onSelect(category.id)}
        >
          {category.name}
        </Badge>
      ))}
    </div>
  );
}
