// app/page.tsx

'use client';

import { useState, useEffect } from 'react';
import {
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  getRandomMovies, // [추가] 임포트 추가
} from '@/lib/tmdb';
import CategorySelection from './components/CategorySelection';
import MovieInfo from './components/MovieInfo';
import Question from './components/Question';
import Image from 'next/image';

export default function Home() {
  // ... 기존 state 변수들 유지 ...
  const [movies, setMovies] = useState<any[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<any | null>(null);
  const [question, setQuestion] = useState<string | null>(null);

  // ... questions 배열 유지 ...

  useEffect(() => {
    if (selectedCategory) {
      const fetchMovies = async () => {
        let movieData;
        if (selectedCategory === '인기 작품') {
          movieData = await getPopularMovies();
        } else if (selectedCategory === '명작') {
          movieData = await getTopRatedMovies();
        } else if (selectedCategory === '최신 작품') {
          movieData = await getUpcomingMovies();
        } else if (selectedCategory === '랜덤 추천') { // [추가] 랜덤 로직 처리
          movieData = await getRandomMovies();
        }
        
        if (movieData && movieData.results) {
           setMovies(movieData.results);
           setFilteredMovies(movieData.results);
           setQuestion(questions[0]);
        }
      };
      fetchMovies();
    }
  }, [selectedCategory]);

  // ... handleAnswer 및 return JSX 로직 유지 ...
  
  // (참고: handleAnswer 부분과 return 부분은 기존 코드를 그대로 사용하시면 됩니다.)
  const handleAnswer = (answer: string) => {
    // ... 기존 로직 ...
    let newFilteredMovies = [...filteredMovies];
    if (answer === questions[0]) {
      const fiveYearsAgo = new Date().getFullYear() - 5;
      newFilteredMovies = newFilteredMovies.filter(
        (movie) => new Date(movie.release_date).getFullYear() >= fiveYearsAgo
      );
    } else if (answer === questions[1]) {
      newFilteredMovies = newFilteredMovies.filter(
        (movie) => movie.vote_average >= 8.0
      );
    } else if (answer === questions[2]) {
      const randomIndex = Math.floor(Math.random() * newFilteredMovies.length);
      setSelectedMovie(newFilteredMovies[randomIndex]);
      setQuestion(null);
      return;
    }

    setFilteredMovies(newFilteredMovies);

    if (newFilteredMovies.length === 1) {
      setSelectedMovie(newFilteredMovies[0]);
      setQuestion(null);
    } else {
      const newQuestions = questions.filter((q) => q !== answer);
      setQuestion(newQuestions.length > 0 ? newQuestions[0] : null);
    }
  };

  return (
    // ... 기존 JSX ...
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center gap-8 py-16 px-8 bg-white dark:bg-black sm:items-start">
        <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
          Movie Curation
        </h1>
        {!selectedMovie && (
          <>
            <CategorySelection onCategorySelect={setSelectedCategory} />
            {question && (
              <Question questions={questions} onAnswer={handleAnswer} />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMovies.map((movie: any) => (
                <div key={movie.id} className="flex flex-col items-center">
                  <Image
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={movie.title}
                    width={200}
                    height={300}
                    className="rounded-md"
                  />
                  <h3 className="text-lg font-semibold">{movie.title}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {movie.release_date}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
        {selectedMovie && <MovieInfo movie={selectedMovie} />}
      </main>
    </div>
  );
}