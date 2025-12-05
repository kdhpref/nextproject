'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  getRandomMovies,
  getGenres,
  getMovieDetail,
} from '@/lib/tmdb';
import MovieInfo from '@/app/components/MovieInfo';
import Question from '@/app/components/Question';

interface QuestionOption {
  text: string;
  relatedMovieIds: number[];
}

interface CurationQuestion {
  questionText: string;
  options: QuestionOption[];
}

interface HistoryItem {
  question: string;
  answer: string;
}

export default function CurationPage({ params }: { params: Promise<{ mode: string }> }) {
  const router = useRouter();
  // Next.js 15+ 에서는 params가 Promise이므로 React.use()로 언래핑
  const { mode } = use(params);

  const [currentPool, setCurrentPool] = useState<any[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<any | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<CurationQuestion | null>(null);
  
  // 히스토리 관리
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("큐레이터를 호출하는 중입니다...");

  useEffect(() => {
    if (!mode) return;

    const initMovies = async () => {
      setIsLoading(true);
      setLoadingMessage("영화 데이터 베이스를 연결 중입니다...");
      
      try {
        // URL의 mode에 따라 적절한 API 함수 선택
        const fetchFn = mode === 'popular' ? getPopularMovies :
                        mode === 'top_rated' ? getTopRatedMovies :
                        mode === 'upcoming' ? getUpcomingMovies : getRandomMovies;
        
        // 장르 목록과 영화 목록(3페이지) 병렬 호출 최적화
        const [genreList, ...movieResults] = await Promise.all([
          getGenres(),
          fetchFn(1), fetchFn(2), fetchFn(3)
        ]);

        const genreMap = new Map(genreList.map((g: any) => [g.id, g.name]));
        const rawMovies = movieResults.flatMap((r: any) => r.results);

        if (!rawMovies || rawMovies.length === 0) {
          alert("데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
          router.push('/');
          return;
        }

        // 중복 제거 및 데이터 가공 (상세 API 호출 없이 정보 구성)
        const uniqueMovies = Array.from(new Map(rawMovies.map((m: any) => [m.id, m])).values())
          .slice(0, 60)
          .map((m: any) => ({
            ...m,
            // 장르 ID를 이름으로 변환
            genres: m.genre_ids?.map((id: number) => ({ id, name: genreMap.get(id) || "기타" })) || [],
            tagline: "" // 목록 API엔 없으므로 빈값 (AI가 줄거리 참고)
          }));

        if (uniqueMovies.length === 0) {
           alert("유효한 영화 정보가 없습니다.");
           router.push('/');
           return;
        }

        setCurrentPool(uniqueMovies);
        
        // 첫 번째 질문 요청
        await requestNextQuestion(uniqueMovies, 'initial');

      } catch (e) {
        console.error("초기화 실패:", e);
        alert("오류가 발생했습니다.");
        router.push('/');
      }
    };

    initMovies();
  }, [mode, router]);

  const requestNextQuestion = async (movies: any[], nextStepName: 'initial' | 'intermediate' | 'final') => {
    setIsLoading(true);
    
    if (nextStepName === 'initial') setLoadingMessage("전체적인 분위기를 파악하고 있습니다...");
    else if (nextStepName === 'intermediate') setLoadingMessage("당신의 취향을 더 깊이 분석합니다...");
    else setLoadingMessage("최종 후보들의 줄거리를 읽고 있습니다...");

    try {
      const res = await axios.post('/api/curation', { 
        movies: movies, 
        step: nextStepName 
      });

      if (res.data.questions && res.data.questions.length > 0) {
        setCurrentQuestion(res.data.questions[0]);
        if (nextStepName === 'initial') setStep(1);
        else if (nextStepName === 'intermediate') setStep(2);
        else setStep(3);
      } else {
        throw new Error("질문 생성 실패");
      }
    } catch (error) {
      console.error("질문 생성 실패", error);
      // 질문 생성 실패 시, 남은 영화 중 첫 번째를 바로 추천 (Fallback)
      finishCuration(movies[0]); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async (relatedIds: number[], answerText: string) => {
    // 히스토리 저장
    if (currentQuestion) {
      setHistory(prev => [...prev, { question: currentQuestion.questionText, answer: answerText }]);
    }

    // 선택된 영화들만 남김
    const nextPool = currentPool.filter(m => relatedIds.includes(m.id));
    
    // 예외 처리: 남은 영화가 없으면 경고 후 리셋 또는 홈으로
    if (nextPool.length === 0) {
      alert("조건에 맞는 영화가 없습니다. 다시 시도해주세요.");
      router.push('/');
      return;
    }

    setCurrentPool(nextPool);

    // 영화가 하나 남았으면 바로 결과 보여주기
    if (nextPool.length === 1) {
      finishCuration(nextPool[0]);
      return;
    }

    // 단계별 진행 로직
    if (step === 1) await requestNextQuestion(nextPool, 'intermediate');
    else if (step === 2) await requestNextQuestion(nextPool, 'final');
    else if (step === 3) finishCuration(nextPool[0]);
  };

  const finishCuration = async (movie: any) => {
    setIsLoading(true);
    setLoadingMessage("최고의 추천작을 선정했습니다! 🎬");
    try {
       // 최종 결과만 상세 정보 API 호출 (고화질 포스터, 전체 줄거리 등)
       const detail = await getMovieDetail(movie.id);
       setSelectedMovie(detail || movie);
    } catch {
       setSelectedMovie(movie);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black p-8 relative overflow-hidden">
       {/* 배경 장식 */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <main className="relative z-10 w-full max-w-3xl flex flex-col items-center gap-8">
        
        {/* 로딩 화면 */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center space-y-6 animate-pulse mt-20">
            <div className="text-6xl animate-bounce">🤔</div>
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {loadingMessage}
            </div>
            <p className="text-zinc-400">잠시만 기다려주세요...</p>
          </div>
        )}

        {/* 질문 화면 (로딩 아님 & 결과 아님) */}
        {!isLoading && !selectedMovie && currentQuestion && (
          <div className="w-full animate-fade-in-up">
            <div className="flex justify-between items-end mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-500 tracking-widest uppercase block mb-1">
                  AI Curation Process
                </span>
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">
                  Step {step} <span className="text-lg text-zinc-400 font-normal">/ 3</span>
                </h2>
              </div>
              <div className="text-xs text-zinc-500">
                남은 후보: <span className="font-bold text-blue-500">{currentPool.length}</span>편
              </div>
            </div>
            
            <Question 
              data={currentQuestion}
              onAnswer={handleAnswer} 
            />
          </div>
        )}

        {/* 결과 화면 */}
        {!isLoading && selectedMovie && (
          <div className="animate-fade-in w-full">
            {/* 히스토리 표시 영역 */}
            <div className="mb-8 space-y-3 bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 border-b pb-2 dark:border-zinc-800">
                Your Selection Path
              </h3>
              {history.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    {idx !== history.length - 1 && <div className="w-0.5 h-full bg-zinc-200 dark:bg-zinc-800 my-1"></div>}
                  </div>
                  <div className="pb-4">
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">{item.question}</div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-200 text-lg">{item.answer}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-8 p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-xl text-center">
              <p className="text-lg opacity-90 mb-1">당신의 선택을 분석한 결과,</p>
              <h2 className="text-2xl font-bold">이 영화가 완벽한 매칭입니다! 🎉</h2>
            </div>
            
            <MovieInfo movie={selectedMovie} />
            
            <button 
              onClick={() => router.push('/')} 
              className="mt-12 px-8 py-4 w-full bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 font-bold transition-all transform hover:scale-[1.02] shadow-lg"
            >
              새로운 추천 받기
            </button>
          </div>
        )}
      </main>
    </div>
  );
}