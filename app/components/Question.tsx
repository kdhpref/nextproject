'use client';

// API 라우트와 맞춘 인터페이스
interface Option {
  text: string;
  relatedMovieIds: number[];
}

interface QuestionData {
  questionText: string;
  options: Option[];
}

export default function Question({
  data,
  onAnswer,
}: {
  data: QuestionData;
  onAnswer: (relatedIds: number[]) => void; // 선택된 영화 ID들을 부모에게 전달
}) {
  return (
    <div className="w-full max-w-2xl animate-fade-in">
      <h2 className="text-2xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50 mb-6">
        {data.questionText}
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {data.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onAnswer(option.relatedMovieIds)}
            className="w-full py-3 px-6 rounded-xl text-left transition-all
              bg-white border border-zinc-200 hover:border-blue-500 hover:bg-blue-50 text-zinc-800
              dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 dark:text-zinc-200"
          >
            <span className="mr-2 font-bold text-blue-600">{index + 1}.</span>
            {option.text}
          </button>
        ))}
      </div>
    </div>
  );
}