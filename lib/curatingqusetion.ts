import axios from 'axios';

// 이제 클라이언트 키가 필요 없으므로 GoogleGenerativeAI 임포트 제거

export const generateCurationQuestions = async (movies: any[]) => {
  try {
    // 우리 서버의 API 라우트 호출
    const response = await axios.post('/api/curation', { movies });
    
    // 서버에서 준 questions 반환
    return response.data.questions;
    
  } catch (error) {
    console.error("Client Request Error:", error);
    // 에러 발생 시 기본 질문 반환 (Fallback)
    return [
      "최신 개봉작을 찾으시나요?",
      "가볍게 볼 수 있는 영화를 원하시나요?",
      "평점이 높은 작품을 우선하시나요?"
    ];
  }
};