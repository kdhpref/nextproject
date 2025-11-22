import axios from 'axios';

const API_KEY = '70eb5d76f804e9cb1b807128a10f88e8'; // 실제 키 유지
const BASE_URL = 'https://api.themoviedb.org/3';

// [수정] page 파라미터 추가 (기본값 1)
export const getPopularMovies = async (page: number = 1) => {
  const response = await axios.get(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=ko-KR&region=KR&page=${page}`);
  return response.data;
};

// [수정] page 파라미터 추가
export const getTopRatedMovies = async (page: number = 1) => {
  const response = await axios.get(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=ko-KR&region=KR&page=${page}`);
  return response.data;
};

// [수정] page 파라미터 추가
export const getUpcomingMovies = async (page: number = 1) => {
  const response = await axios.get(`${BASE_URL}/movie/upcoming?api_key=${API_KEY}&language=ko-KR&region=KR&page=${page}`);
  return response.data;
};

// 랜덤은 내부적으로 랜덤 페이지를 호출하므로 그대로 둡니다. (호출할 때 여러 번 호출 예정)
export const getRandomMovies = async () => {
  const randomPage = Math.floor(Math.random() * 50) + 1;
  const response = await axios.get(
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=ko-KR&region=KR&sort_by=popularity.desc&include_adult=false&include_video=false&page=${randomPage}`
  );
  return response.data;
};

// 상세 정보 가져오기 (기존 유지)
export const getMovieDetail = async (id: number) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=ko-KR&append_to_response=credits,keywords`
    );
    return response.data;
  } catch (error) {
    return null;
  }
};

export const searchMovies = async (query: string) => {
  const response = await axios.get(
    `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}&language=ko-KR&region=KR`
  );
  return response.data;
};

export const getMovieReviews = async (id: number) => {
  try {
    // 한국어 리뷰 시도
    let response = await axios.get(`${BASE_URL}/movie/${id}/reviews?api_key=${API_KEY}&language=ko-KR`);
    
    // 한국어 리뷰가 없으면 영어 리뷰 가져오기
    if (response.data.results.length === 0) {
      response = await axios.get(`${BASE_URL}/movie/${id}/reviews?api_key=${API_KEY}&language=en-US`);
    }
    
    // 상위 3개 리뷰만 반환
    return response.data.results.slice(0, 3).map((r: any) => r.content);
  } catch (error) {
    return [];
  }
};