'use client';

import CategorySelection from './components/CategorySelection';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center font-sans bg-zinc-50 dark:bg-black relative overflow-hidden">
      {/* 배경 장식용 애니메이션 원 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <main className="relative z-10 flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-8 py-16 px-8">
        <CategorySelection />
      </main>
    </div>
  );
}