'use client';

import { useState, useEffect } from 'react';
import {
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  getRandomMovies,
  getMovieDetail,
} from '@/lib/tmdb';
// [추가] Gemini 함수 임포트
import { generateCurationQuestions } from '@/lib/curatingqusetion'; 

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
  const [moviePool, setMoviePool] = useState<any[]>([]);

  // [변경] 질문 목록을 상태(State)로 관리 (초기값은 빈 배열)
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false); // 로딩 상태 추가

  useEffect(() => {
    if (selectedCategory) {
      const fetchAndEnrichMovies = async () => {
        setIsLoadingQuestions(true); // 로딩 시작
        setQuestion(null); // 기존 질문 초기화
        
        let basicList;
        
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
          const targets = basicList.results.slice(0, 10);
          const detailedPromises = targets.map((movie: any) => getMovieDetail(movie.id));
          const detailedMovies = await Promise.all(detailedPromises);
          const validPool = detailedMovies.filter((m) => m !== null);

          setMoviePool(validPool);
          setMovies(validPool);
          setFilteredMovies(validPool);

          // [추가] Gemini에게 질문 생성 요청
          console.log("Gemini에게 질문 생성 요청 중...");
          const aiQuestions = await generateCurationQuestions(validPool);
          
          setGeneratedQuestions(aiQuestions); // 생성된 질문 저장
          if (aiQuestions.length > 0) {
            setQuestion(aiQuestions[0]); // 첫 번째 질문 설정
          }
          
          setIsLoadingQuestions(false); // 로딩 끝
        }
      };
      
      fetchAndEnrichMovies();
    }
  }, [selectedCategory]);

  const handleAnswer = (answer: string) => {
    // 현재 질문에 대한 답변 처리 (로직은 추후 Gemini로 고도화 예정)
    // 지금은 임시로, 답변을 하면 다음 질문으로 넘어가거나 영화를 하나 선택하는 단순 로직 유지
    
    // 현재 질문의 인덱스 찾기
    const currentIndex = generatedQuestions.indexOf(question || '');
    
    // 다음 질문이 있다면 설정
    if (currentIndex >= 0 && currentIndex < generatedQuestions.length - 1) {
      setQuestion(generatedQuestions[currentIndex + 1]);
    } else {
      // 질문이 끝나면 남은 영화 중 랜덤 1개 추천 (임시)
      const randomIndex = Math.floor(Math.random() * filteredMovies.length);
      setSelectedMovie(filteredMovies[randomIndex]);
      setQuestion(null);
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
            
            {/* 로딩 표시 및 질문 컴포넌트 */}
            {isLoadingQuestions ? (
              <div className="text-blue-600 animate-pulse">
                큐레이터가 영화를 분석하고 질문을 만들고 있습니다...
              </div>
            ) : (
              question && (
                <Question 
                  questions={[question]} // 현재 질문 하나만 넘김
                  onAnswer={handleAnswer} 
                />
              )
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