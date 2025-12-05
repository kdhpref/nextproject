'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORY_DATA = [
  {
    id: 'popular',
    title: '🔥 인기 작품',
    desc: '지금 가장 핫한 트렌드를 확인하세요.',
    color: 'from-orange-500 to-red-600',
    shadow: 'hover:shadow-orange-500/50',
  },
  {
    id: 'top_rated',
    title: '🏆 불멸의 명작',
    desc: '시간이 지나도 변하지 않는 감동.',
    color: 'from-yellow-400 to-amber-600',
    shadow: 'hover:shadow-amber-500/50',
  },
  {
    id: 'upcoming',
    title: '🆕 최신 개봉작',
    desc: '가장 먼저 만나는 새로운 이야기.',
    color: 'from-cyan-400 to-blue-600',
    shadow: 'hover:shadow-blue-500/50',
  },
  {
    id: 'random',
    title: '🎲 운명의 선택',
    desc: '무엇을 볼지 모르겠다면 맡겨보세요.',
    color: 'from-purple-500 to-pink-600',
    shadow: 'hover:shadow-purple-500/50',
  },
];

export default function CategorySelection() {
  const [hovered, setHovered] = useState<string | null>(null);
  const router = useRouter();

  const handleSelect = (id: string) => {
    // 해당 모드의 큐레이션 페이지로 이동
    router.push(`/curation/${id}`);
  };

  return (
    <div className="w-full max-w-5xl px-4">
      <div className="text-center mb-12 space-y-4 animate-fade-in-down">
        <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-800 to-zinc-400 dark:from-white dark:to-zinc-500">
          What to Watch?
        </h2>
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          오늘 당신의 취향을 저격할 영화를 찾아드립니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {CATEGORY_DATA.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleSelect(cat.id)}
            onMouseEnter={() => setHovered(cat.id)}
            onMouseLeave={() => setHovered(null)}
            className={`
              relative group overflow-hidden rounded-3xl p-8 h-64 text-left transition-all duration-500 ease-out
              border border-zinc-200 dark:border-zinc-800
              hover:scale-[1.02] ${cat.shadow} hover:shadow-2xl
              bg-white dark:bg-zinc-900/50 backdrop-blur-xl
            `}
          >
            {/* 배경 그라데이션 효과 */}
            <div
              className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${cat.color}`}
            />
            
            {/* 장식용 배경 원 */}
            <div className={`
              absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 transition-all duration-700
              bg-gradient-to-br ${cat.color}
              group-hover:w-60 group-hover:h-60 group-hover:opacity-30
            `} />

            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <h3 className={`
                  text-3xl font-bold mb-2 transition-colors duration-300
                  ${hovered === cat.id ? 'text-transparent bg-clip-text bg-gradient-to-r ' + cat.color : 'text-zinc-800 dark:text-white'}
                `}>
                  {cat.title}
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg">
                  {cat.desc}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-white transition-colors">
                <span>Start Curation</span>
                <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}