import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // 1. API 키 확인
  const apiKey = process.env.GEMINI_API_KEY;
  
  // 디버깅용 로그 (키가 잘 로드되었는지 확인, 앞 4자리만 출력)
  console.log("Using API Key:", apiKey ? `${apiKey.slice(0, 4)}...` : "None");

  if (!apiKey) {
    return NextResponse.json(
      { error: "API Key not found. Check .env.local" }, 
      { status: 500 }
    );
  }

  try {
    const { movies } = await request.json();
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      // 응답 형식을 강제할 수 있습니다 (JSON 모드)
      generationConfig: { responseMimeType: "application/json" } 
    });

    const simplifiedMovies = movies.map((m: any) => ({
      id: m.id,
      title: m.title,
      genres: m.genres?.map((g: any) => g.name).join(", ") || "",
      keywords: m.keywords?.keywords?.map((k: any) => k.name).slice(0, 5).join(", ") || "",
      overview: m.overview ? m.overview.slice(0, 100) : "",
    }));

    const prompt = `
      당신은 영화 전문 큐레이터입니다. 
      아래는 큐레이션 후보 영화 목록입니다 (ID 포함):
      ${JSON.stringify(simplifiedMovies)}

      이 영화들 중 사용자의 취향에 가장 잘 맞는 작품을 추천하기 위해, **3개의 질문**을 생성해주세요.
      
      **요구사항:**
      1. 질문 형식은 '예/아니오' 뿐만 아니라, 3~4개의 선택지가 있는 객관식도 가능합니다.
      2. 질문 내용은 영화의 분위기, 소재, 장르, 감정선 등을 다양하게 다루세요.
      3. **핵심:** 각 선택지(options)마다, 그 선택지를 골랐을 때 **추천 점수를 받아야 할 영화들의 ID(relatedMovieIds)**를 정확히 명시해야 합니다. relatedMovieIds는 반드시 정수 배열이어야 합니다.
      4. 출력은 오직 JSON 배열 포맷만 사용하세요.

      **JSON 응답 스키마:**
      [
        {
          "questionText": "질문 내용",
          "options": [
            { "text": "답변 1", "relatedMovieIds": [123, 456] },
            { "text": "답변 2", "relatedMovieIds": [789] }
          ]
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    console.log("Gemini Raw Response:", text.slice(0, 100) + "..."); // 디버깅용 로그

    // 2. 안전한 JSON 파싱 (마크다운 제거 및 배열 찾기)
    // ```json ... ``` 제거
    text = text.replace(/```json|```/g, "").trim();
    
    // 혹시라도 앞뒤에 잡다한 텍스트가 있을 경우, 첫 '[' 와 마지막 ']' 사이만 추출
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error("JSON Array not found in response");
    }
    
    const jsonString = text.substring(jsonStart, jsonEnd);
    const questions = JSON.parse(jsonString);

    return NextResponse.json({ questions });
    
  } catch (error: any) {
    console.error("Gemini Server Error Details:", error);
    return NextResponse.json(
      { error: "Failed to generate questions", details: error.message }, 
      { status: 500 }
    );
  }
}