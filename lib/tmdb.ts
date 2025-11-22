import axios from 'axios';

const API_KEY = '70eb5d76f804e9cb1b807128a10f88e8'; // 여기에 실제 TMDB API 키를 입력하세요.
const BASE_URL = 'https://api.themoviedb.org/3';

export const getPopularMovies = async () => {
  const response = await axios.get(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=ko-KR&region=KR`);
  return response.data;
};

export const getTopRatedMovies = async () => {
  const response = await axios.get(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=ko-KR&region=KR`);
  return response.data;
};

export const getUpcomingMovies = async () => {
  const response = await axios.get(`${BASE_URL}/movie/upcoming?api_key=${API_KEY}&language=ko-KR&region=KR`);
  return response.data;
};

export const searchMovies = async (query: string) => {
  const response = await axios.get(
    `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}&language=ko-KR&region=KR`
  );
  return response.data;
};

export const getRandomMovies = async () => {
  // 1부터 50페이지 사이 중 랜덤하게 하나를 선택
  const randomPage = Math.floor(Math.random() * 50) + 1;
  
  const response = await axios.get(
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=ko-KR&region=KR&sort_by=popularity.desc&include_adult=false&include_video=false&page=${randomPage}`
  );
  return response.data;
};

export const getMovieDetail = async (id: number) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=ko-KR&append_to_response=credits,keywords`
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch details for movie ${id}`, error);
    return null;
  }
};