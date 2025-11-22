import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // 1. API 키 확인 (서버 사이드라 읽을 수 있음)
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: "API Key not found" }, 
      { status: 500 }
    );
  }

  try {
    // 2. 클라이언트에서 보낸 영화 데이터 받기
    const { movies } = await request.json();
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const simplifiedMovies = movies.map((m: any) => ({
      title: m.title,
      genres: m.genres?.map((g: any) => g.name).join(", ") || "장르 정보 없음",
      keywords: m.keywords?.keywords?.map((k: any) => k.name).slice(0, 5).join(", ") || "",
      tagline: m.tagline || "",
    }));

    const prompt = `
      당신은 영화 전문 큐레이터입니다. 
      아래는 사용자가 관심을 보일만한 영화 후보 10개의 목록입니다:
      ${JSON.stringify(simplifiedMovies)}

      이 영화들 중에서 사용자의 취향을 좁혀나가 최종 1~2개를 추천하기 위해, 
      사용자에게 던질 수 있는 **'예/아니오'로 대답 가능한 질문 3가지**를 생성해주세요.

      **요구사항:**
      1. 질문은 영화의 **분위기, 소재, 장르적 특성**을 기준으로 영화들을 구분할 수 있어야 합니다.
      2. 질문은 한국어로 자연스럽고 정중하게 작성하세요.
      3. 반드시 아래와 같은 순수 JSON 배열 포맷으로만 응답하세요. (마크다운 제외)
      
      Example Output:
      ["가볍게 즐길 수 있는 유쾌한 분위기를 원하시나요?", "긴장감 넘치는 스릴러 요소가 포함된 작품을 찾으시나요?"]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // JSON 파싱 (마크다운 제거)
    const cleanedText = text.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(cleanedText);

    return NextResponse.json({ questions });
    
  } catch (error) {
    console.error("Gemini Server Error:", error);
    return NextResponse.json(
      { error: "Failed to generate questions" }, 
      { status: 500 }
    );
  }
}