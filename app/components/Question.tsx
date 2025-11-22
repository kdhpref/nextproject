'use client';

export default function Question({
  questions,
  onAnswer,
}: {
  questions: string[];
  onAnswer: (answer: string) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
        Refine your search
      </h2>
      <div className="flex flex-col gap-4 mt-4">
        {questions.map((question) => (
          <button
            key={question}
            onClick={() => onAnswer(question)}
            className="py-2 px-4 rounded-full text-white bg-blue-600 hover:bg-blue-700"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}