// app/components/CategorySelection.tsx

'use client';

import { useState } from 'react';

// [수정] '랜덤 추천' 추가
const categories = ['인기 작품', '명작', '최신 작품', '랜덤 추천'];

export default function CategorySelection({
  onCategorySelect,
}: {
  onCategorySelect: (category: string) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    onCategorySelect(category);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
        Categories
      </h2>
      <div className="flex gap-4">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className={`py-2 px-4 rounded-full text-white ${
              selectedCategory === category
                ? 'bg-blue-600'
                : 'bg-zinc-500 hover:bg-zinc-600'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}