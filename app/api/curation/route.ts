import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  // API 키 로드 확인 로그
  console.log("Using API Key:", apiKey ? `${apiKey.slice(0, 4)}...` : "None");

  if (!apiKey) {
    return NextResponse.json(
      { error: "API Key not found. Check .env.local" }, 
      { status: 500 }
    );
  }

  try {
    const { movies, step } = await request.json();
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // gemini-2.5-flash 모델 고정
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      generationConfig: { responseMimeType: "application/json" } 
    });

    // [수정] 1, 2단계는 overview 제외, 3단계만 전체 overview 포함
    const simplifiedMovies = movies.map((m: any) => ({
      id: m.id,
      title: m.title,
      genres: m.genres?.map((g: any) => g.name).join(", ") || "",
      // keywords: m.keywords?.keywords?.map((k: any) => k.name).slice(0, 3).join(", ") || "", // 필요시 주석 해제
      
      // [핵심 변경] step이 'final'일 때만 줄거리를 넣고, 그 외엔 빈 문자열 처리
      // 이렇게 하면 1, 2단계에서 토큰 사용량이 획기적으로 줄어듭니다.
      overview: step === 'final' ? m.overview : "",
      
      // 태그라인은 분위기 파악을 위해 모든 단계에서 유지
      tagline: m.tagline || ""
    }));

    let prompt = "";

    if (step === 'initial') {
      // 1단계: 분위기/장르 (태그라인과 장르만으로 충분)
      prompt = `
        당신은 영화 큐레이터입니다. 60개의 영화 목록을 분석하세요:
        ${JSON.stringify(simplifiedMovies)}

        이 영화들의 태그라인(tagline)과 장르를 바탕으로, 영화들을 크게 3~4개의 분위기(Vibe)로 나눌 수 있는 **추상적이고 감성적인 질문 하나**를 만드세요.
        (예: "오늘 당신의 마음 날씨는 어떤가요?", "어떤 세상으로 떠나고 싶으신가요?")
        
        **필수:** 각 옵션(options)을 선택했을 때 포함될 영화의 ID 목록(relatedMovieIds)을 정확히 분류하세요.
      `;
    } else if (step === 'intermediate') {
      // 2단계: 소재/스타일 구체화 (태그라인과 제목만으로 유추)
      prompt = `
        남은 영화 목록입니다:
        ${JSON.stringify(simplifiedMovies)}

        이 영화들을 소재, 전개 속도, 긴장감 등을 기준으로 나눌 수 있는 **구체적인 취향 질문 하나**를 만드세요.
        (예: "현실적인 범죄 수사극인가요, 아니면 초자연적인 미스터리인가요?")
        
        **필수:** 각 옵션에 해당하는 영화 ID를 정확히 분류하세요. 선택되지 않은 영화는 탈락합니다.
      `;
    } else if (step === 'final') {
      // 3단계: 줄거리(Overview) 기반의 결정적 질문 (이제 overview가 들어옴)
      prompt = `
        최종 후보 영화들의 **줄거리(Overview)**와 태그라인입니다:
        ${JSON.stringify(simplifiedMovies)}

        이 영화들 중 단 하나를 고르기 위해, **영화 속 핵심 갈등이나 상황을 제시하는 재치 있는 질문**을 만드세요.
        사용자가 주인공이 된 듯한 상황을 제시하면 더 좋습니다.
        
        예시:
        - "지구를 구하기 위해 모든 것을 희생하시겠습니까, 아니면 가족을 지키기 위해 도망치시겠습니까?"
        
        **필수:** 각 옵션은 특정 영화 1개(또는 2개)와 강력하게 연결되어야 하며, relatedMovieIds에 해당 ID를 넣으세요.
      `;
    }

    prompt += `
      \n**출력 포맷 (JSON Array):**
      [
        {
          "questionText": "질문 내용",
          "options": [
            { "text": "답변 A", "relatedMovieIds": [1, 2, 3] },
            { "text": "답변 B", "relatedMovieIds": [4, 5, 6] }
          ]
        }
      ]
      오직 JSON만 반환하세요.
    `;

    console.log(`Sending request to Gemini (Step: ${step})...`);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']') + 1;
    
    if (jsonStart === -1) throw new Error("Invalid JSON response");
    
    const questions = JSON.parse(text.substring(jsonStart, jsonEnd));

    return NextResponse.json({ questions });
    
  } catch (error: any) {
    console.error("Gemini Server Error Details:", error);
    return NextResponse.json(
      { error: "Failed to generate questions", details: error.message }, 
      { status: 500 }
    );
  }
}