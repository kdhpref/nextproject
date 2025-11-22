'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  getRandomMovies,
  getMovieDetail,
  // getMovieReviews 제거
} from '@/lib/tmdb';
import CategorySelection from './components/CategorySelection';
import MovieInfo from './components/MovieInfo';
import Question from './components/Question';
import Image from 'next/image';

interface QuestionOption {
  text: string;
  relatedMovieIds: number[];
}

interface CurationQuestion {
  questionText: string;
  options: QuestionOption[];
}

export default function Home() {
  const [currentPool, setCurrentPool] = useState<any[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<any | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<CurationQuestion | null>(null);
  
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  useEffect(() => {
    if (selectedCategory) {
      const initMovies = async () => {
        setIsLoading(true);
        setLoadingMessage("영화 데이터 베이스를 연결 중입니다...");
        setStep(0);
        setSelectedMovie(null);
        setCurrentQuestion(null);

        let rawMovies: any[] = [];
        try {
          const fetchFn = selectedCategory === '인기 작품' ? getPopularMovies :
                          selectedCategory === '명작' ? getTopRatedMovies :
                          selectedCategory === '최신 작품' ? getUpcomingMovies : getRandomMovies;
          
          // 3페이지(60개) 병렬 호출
          const results = await Promise.all([fetchFn(1), fetchFn(2), fetchFn(3)]);
          rawMovies = results.flatMap(r => r.results);
        } catch (e) {
          console.error(e);
        }

        const uniqueMovies = Array.from(new Map(rawMovies.map((m: any) => [m.id, m])).values()).slice(0, 60);
        
        setLoadingMessage("영화들의 상세 정보를 분석 중입니다...");
        // getMovieDetail에서 이미 overview를 가져오므로 추가 작업 불필요
        const details = await Promise.all(uniqueMovies.map(m => getMovieDetail(m.id)));
        const validPool = details.filter(m => m !== null);

        setCurrentPool(validPool);
        
        // 1단계 질문 요청
        await requestNextQuestion(validPool, 'initial');
      };
      initMovies();
    }
  }, [selectedCategory]);

  // Gemini에게 다음 단계 질문 요청
  const requestNextQuestion = async (movies: any[], nextStepName: 'initial' | 'intermediate' | 'final') => {
    setIsLoading(true);
    
    if (nextStepName === 'initial') setLoadingMessage("전체적인 분위기를 파악하고 있습니다...");
    else if (nextStepName === 'intermediate') setLoadingMessage("당신의 취향을 더 깊이 분석합니다...");
    else setLoadingMessage("최종 후보들의 줄거리를 읽고 있습니다..."); // 문구 변경

    try {
      // [수정] 리뷰 가져오는 로직 제거 -> 바로 API 호출 (매우 빠름)
      const res = await axios.post('/api/curation', { 
        movies: movies, 
        step: nextStepName 
      });

      if (res.data.questions && res.data.questions.length > 0) {
        setCurrentQuestion(res.data.questions[0]);
        
        if (nextStepName === 'initial') setStep(1);
        else if (nextStepName === 'intermediate') setStep(2);
        else setStep(3);
      }
    } catch (error) {
      console.error("질문 생성 실패", error);
      setSelectedMovie(movies[0]);
    } finally {
      setIsLoading(false);
    }
  };

  // 답변 처리
  const handleAnswer = async (relatedIds: number[]) => {
    // 선택된 영화만 생존
    const nextPool = currentPool.filter(m => relatedIds.includes(m.id));
    setCurrentPool(nextPool);

    if (nextPool.length === 1) {
      setSelectedMovie(nextPool[0]);
      return;
    }
    
    if (nextPool.length === 0) {
      setSelectedMovie(currentPool[0]); // 예외 처리
      return;
    }

    if (step === 1) {
      await requestNextQuestion(nextPool, 'intermediate');
    } else if (step === 2) {
      // 5개 이하면 바로 결승전, 아니면 중간 질문 한 번 더? (여기선 바로 Final)
      await requestNextQuestion(nextPool, 'final');
    } else if (step === 3) {
      setSelectedMovie(nextPool[0]);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center gap-8 py-16 px-8 bg-white dark:bg-black sm:items-start">
        <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
          AI Interactive Curation
        </h1>
        
        {!selectedMovie && (
          <>
            {step === 0 && <CategorySelection onCategorySelect={setSelectedCategory} />}
            
            {isLoading ? (
              <div className="mt-12 text-center w-full space-y-4">
                <div className="text-4xl animate-bounce">🤔</div>
                <p className="text-lg text-blue-600 font-medium animate-pulse">
                  {loadingMessage}
                </p>
                <p className="text-sm text-zinc-400">
                  현재 후보 영화: {currentPool.length > 0 ? currentPool.length : 0}편
                </p>
              </div>
            ) : (
              currentQuestion && (
                <div className="mt-8 w-full animate-fade-in-up">
                  <div className="mb-2 text-xs font-bold text-blue-500 tracking-widest uppercase">
                    {step === 1 ? "STEP 1: VIBE CHECK" : 
                     step === 2 ? "STEP 2: DEEP DIVE" : "FINAL DECISION"}
                  </div>
                  <Question 
                    data={currentQuestion}
                    onAnswer={handleAnswer} 
                  />
                  <div className="mt-4 text-right text-xs text-zinc-400">
                    남은 후보: {currentPool.length}편
                  </div>
                </div>
              )
            )}
          </>
        )}

        {selectedMovie && (
          <div className="animate-fade-in w-full">
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg">
              🎉 60편의 영화 중, 당신의 선택과 완벽하게 일치하는 영화입니다!
            </div>
            <MovieInfo movie={selectedMovie} />
            <button 
              onClick={() => window.location.reload()} 
              className="mt-8 px-6 py-3 w-full bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 font-bold transition-all"
            >
              다시 처음부터 하기
            </button>
          </div>
        )}
      </main>
    </div>
  );
}