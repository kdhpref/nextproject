'use client';

import { useState, useEffect } from 'react';
import {
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  getRandomMovies, // [추가] 랜덤 영화 호출 함수
  getMovieDetail,  // [추가] 상세 정보 호출 함수
} from '@/lib/tmdb';
import CategorySelection from './components/CategorySelection';
import MovieInfo from './components/MovieInfo';
import Question from './components/Question';
import Image from 'next/image';

export default function Home() {
  const [movies, setMovies] = useState<any[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<any | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  
  // [추가] 상세 정보가 포함된 큐레이션용 원본 데이터 풀
  const [moviePool, setMoviePool] = useState<any[]>([]);

  const questions = [
    'Are you looking for a movie from the last 5 years?',
    'Do you prefer a movie with a rating above 8.0?',
    'Show me a random movie',
  ];

  useEffect(() => {
    if (selectedCategory) {
      const fetchAndEnrichMovies = async () => {
        let basicList;
        
        // 1. 카테고리에 따른 기본 목록 호출
        if (selectedCategory === '인기 작품') {
          basicList = await getPopularMovies();
        } else if (selectedCategory === '명작') {
          basicList = await getTopRatedMovies();
        } else if (selectedCategory === '최신 작품') {
          basicList = await getUpcomingMovies();
        } else if (selectedCategory === '랜덤 추천') {
          basicList = await getRandomMovies();
        }

        if (basicList && basicList.results) {
          // 2. [핵심] 상위 10개 영화에 대해 상세 정보(키워드, 크레딧 등) 병렬 조회
          // 데이터가 너무 많으면 API 속도가 느려질 수 있으므로 상위 10개로 제한하여 풀을 구성합니다.
          const targets = basicList.results.slice(0, 10);
          
          const detailedPromises = targets.map((movie: any) => getMovieDetail(movie.id));
          const detailedMovies = await Promise.all(detailedPromises);

          // 상세 정보 가져오기에 성공한 영화만 필터링 (null 제외)
          const validPool = detailedMovies.filter((m) => m !== null);

          console.log("구성된 큐레이션 풀:", validPool); 
          // 개발자 도구 콘솔에서 validPool 내용을 확인하면 keywords, credits 등이 포함된 것을 볼 수 있습니다.

          setMoviePool(validPool);       // 질문 생성을 위한 고밀도 데이터 풀 저장
          setMovies(validPool);          // 화면에 보여줄 영화 목록 업데이트
          setFilteredMovies(validPool);  // 필터링을 위한 목록 업데이트
          
          // TODO: 추후 이 시점에서 Gemini API를 호출하여 validPool 기반의 맞춤형 질문을 생성합니다.
          setQuestion(questions[0]);     // 현재는 임시 질문 사용
        }
      };
      
      fetchAndEnrichMovies();
    }
  }, [selectedCategory]);

  const handleAnswer = (answer: string) => {
    let newFilteredMovies = [...filteredMovies];
    
    // 기존 하드코딩된 필터링 로직 (추후 Gemini가 생성한 질문 로직으로 대체 가능)
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
      // Remove the answered question from the list of available questions
      const newQuestions = questions.filter((q) => q !== answer);
      setQuestion(newQuestions.length > 0 ? newQuestions[0] : null);
    }
  };

  return (
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