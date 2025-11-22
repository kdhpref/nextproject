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
