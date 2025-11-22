'use client';

import { useState, useEffect } from 'react';
import {
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  getRandomMovies,
  getMovieDetail,
} from '@/lib/tmdb';
import { generateCurationQuestions } from '@/lib/curatingqusetion';
import CategorySelection from './components/CategorySelection';
import MovieInfo from './components/MovieInfo';
import Question from './components/Question';
import Image from 'next/image';

// 데이터 타입 정의
interface QuestionOption {
  text: string;
  relatedMovieIds: number[];
}

interface CurationQuestion {
  questionText: string;
  options: QuestionOption[];
}

export default function Home() {
  const [movies, setMovies] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<any | null>(null);
  
  const [questions, setQuestions] = useState<CurationQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  useEffect(() => {
    if (selectedCategory) {
      const fetchAndEnrichMovies = async () => {
        setIsLoadingQuestions(true);
        setQuestions([]);
        setCurrentQuestionIndex(0);
        setScores({});
        setSelectedMovie(null);
        
        console.log(`--- [1단계] '${selectedCategory}' 목록 수집 시작 (3페이지/60개 요청) ---`);
        const startTime = Date.now(); // 전체 시작 시간 측정

        let rawMovies: any[] = [];
        
        try {
          if (selectedCategory === '인기 작품') {
            const [p1, p2, p3] = await Promise.all([
              getPopularMovies(1),
              getPopularMovies(2),
              getPopularMovies(3)
            ]);
            rawMovies = [...p1.results, ...p2.results, ...p3.results];
          } else if (selectedCategory === '명작') {
            const [p1, p2, p3] = await Promise.all([
              getTopRatedMovies(1),
              getTopRatedMovies(2),
              getTopRatedMovies(3)
            ]);
            rawMovies = [...p1.results, ...p2.results, ...p3.results];
          } else if (selectedCategory === '최신 작품') {
            const [p1, p2, p3] = await Promise.all([
              getUpcomingMovies(1),
              getUpcomingMovies(2),
              getUpcomingMovies(3)
            ]);
            rawMovies = [...p1.results, ...p2.results, ...p3.results];
          } else if (selectedCategory === '랜덤 추천') {
            const [p1, p2, p3] = await Promise.all([
              getRandomMovies(),
              getRandomMovies(),
              getRandomMovies()
            ]);
            rawMovies = [...p1.results, ...p2.results, ...p3.results];
          }
        } catch (e) {
          console.error("기본 목록 API 호출 실패", e);
          setIsLoadingQuestions(false);
          return;
        }

        console.log(`--- [1단계 완료] 기본 목록 수집 끝 (소요시간: ${Date.now() - startTime}ms) ---`);

        // 중복 제거 및 60개 확정
        const uniqueMovies = Array.from(new Map(rawMovies.map((m: any) => [m.id, m])).values());
        const targets = uniqueMovies.slice(0, 60); // 60개 사용

        console.log(`--- [2단계] 상세 정보(키워드/크레딧) 병렬 조회 시작 (대상: ${targets.length}개) ---`);
        const step2Start = Date.now();

        // 상세 정보 병렬 요청
        const detailedPromises = targets.map((movie: any) => getMovieDetail(movie.id));
        const detailedMovies = await Promise.all(detailedPromises);
        
        const validPool = detailedMovies.filter((m: any) => m !== null);

        console.log(`--- [2단계 완료] 상세 정보 수집 끝 (소요시간: ${Date.now() - step2Start}ms) ---`);
        console.log(`최종 큐레이션 풀 크기: ${validPool.length}개`);

        setMovies(validPool);

        // 초기 점수 설정
        const initialScores: Record<number, number> = {};
        validPool.forEach((m: any) => initialScores[m.id] = 0);
        setScores(initialScores);

        console.log(`--- [3단계] Gemini에게 질문 생성 요청 시작 ---`);
        const step3Start = Date.now();

        // Gemini 호출
        const aiQuestions = await generateCurationQuestions(validPool);
        setQuestions(aiQuestions);
        
        console.log(`--- [3단계 완료] Gemini 응답 완료 (소요시간: ${Date.now() - step3Start}ms) ---`);
        console.log(`--- [전체 로딩 완료] 총 소요시간: ${Date.now() - startTime}ms ---`);
        
        setIsLoadingQuestions(false);
      };
      
      fetchAndEnrichMovies();
    }
  }, [selectedCategory]);

  const handleAnswer = (relatedIds: number[]) => {
    const newScores = { ...scores };
    relatedIds.forEach((id) => {
      if (newScores[id] !== undefined) {
        newScores[id] += 1;
      }
    });
    setScores(newScores);

    if (currentQuestionIndex < questions.length - 1) {
      // 타입 명시
      setCurrentQuestionIndex((prev: number) => prev + 1);
    } else {
      finishCuration(newScores);
    }
  };

  const finishCuration = (finalScores: Record<number, number>) => {
    // 타입 명시
    let bestMovieId: number | null = null;
    let maxScore = -1;

    Object.entries(finalScores).forEach(([idStr, score]) => {
      const id = Number(idStr);
      if (score > maxScore) {
        maxScore = score;
        bestMovieId = id;
      }
    });

    // m: any로 타입 완화하여 오류 방지
    const recommended = movies.find((m: any) => m.id === bestMovieId);
    setSelectedMovie(recommended || movies[0]);
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
            
            {isLoadingQuestions ? (
              <div className="mt-8 text-center w-full space-y-2">
                <p className="text-lg text-blue-600 font-semibold animate-pulse">
                  🎬 영화 60편을 분석하여 질문을 생성 중입니다...
                </p>
                <p className="text-sm text-zinc-500">
                  데이터 수집 및 AI 분석 진행 중 (콘솔 로그를 확인하세요)
                </p>
              </div>
            ) : (
              questions.length > 0 && (
                <div className="mt-8 w-full">
                  <div className="mb-4 text-sm text-zinc-500 font-medium">
                    Question {currentQuestionIndex + 1} / {questions.length}
                  </div>
                  <Question 
                    data={questions[currentQuestionIndex]}
                    onAnswer={handleAnswer} 
                  />
                </div>
              )
            )}
          </>
        )}

        {selectedMovie && (
          <div className="animate-fade-in w-full">
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-300">
              🎉 60개의 후보 중 당신에게 딱 맞는 영화를 찾았습니다!
            </div>
            <MovieInfo movie={selectedMovie} />
            <button 
              onClick={() => window.location.reload()} 
              className="mt-8 px-6 py-2 bg-zinc-800 text-white rounded-full hover:bg-zinc-700"
            >
              다시 하기
            </button>
          </div>
        )}
      </main>
    </div>
  );
}