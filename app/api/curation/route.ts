import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: "API Key not found. Check .env.local" }, 
      { status: 500 }
    );
  }

  try {
    const { movies, step } = await request.json();
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", // 2.5-flash 모델 사용 변경금지
      generationConfig: { responseMimeType: "application/json" } 
    });

    const simplifiedMovies = movies.map((m: any) => ({
      id: m.id,
      title: m.title,
      genres: Array.isArray(m.genres) ? m.genres.map((g: any) => g.name).join(", ") : "",
      // overview는 모든 단계에서 분위기 파악용으로 사용 (길이 제한)
      overview: m.overview ? m.overview.substring(0, 200) + "..." : "",
      tagline: ""
    }));

    let prompt = "";

    // 공통 지시사항: 답변의 중복 방지 및 간결화
    const commonRules = `
      **중요 제약사항 (반드시 지킬 것):**
      1. **답변(options.text)은 질문을 그대로 반복하지 마세요.**
      2. 답변은 **20자 이내의 짧은 키워드**나 **명확한 단문**으로 작성하세요.
      3. 질문은 사용자의 취향이나 상황을 묻는 자연스러운 문장이어야 합니다.
    `;

    if (step === 'initial') {
      // 1단계: 분위기/장르
      prompt = `
        당신은 영화 큐레이터입니다. 60개의 영화 목록을 분석하세요:
        ${JSON.stringify(simplifiedMovies)}

        ${commonRules}

        **목표:** 이 영화들을 크게 3~4개의 분위기(Vibe)로 나누어 추천하려고 합니다.
        **질문 작성:** "오늘 어떤 기분인가요?" 또는 "어떤 분위기의 영화가 끌리나요?"와 같이 감성적인 질문을 하나 만드세요.
        **답변 작성:** 각 분위기를 대표하는 **형용사나 짧은 문구**로 답변을 만드세요. (예: "가슴 뛰는 긴장감", "잔잔한 힐링", "상상력을 자극하는")
        
        **필수:** 각 옵션(options)을 선택했을 때 포함될 영화의 ID 목록(relatedMovieIds)을 정확히 분류하세요.
      `;
    } else if (step === 'intermediate') {
      // 2단계: 소재/스타일 구체화
      prompt = `
        남은 영화 목록입니다:
        ${JSON.stringify(simplifiedMovies)}

        ${commonRules}

        **목표:** 남은 영화들을 소재, 전개 속도, 긴장감 등을 기준으로 구체적으로 분류하세요.
        **질문 작성:** 영화의 핵심적인 스타일이나 소재의 차이를 묻는 질문을 만드세요. (예: "선호하는 이야기의 배경은 어디인가요?")
        **답변 작성:** 질문의 서술어가 아닌, **구체적인 명사나 핵심 특징**으로 답하세요. 
        (나쁜 예: "현실적인 범죄물을 선호합니다.")
        (좋은 예: "현실적인 범죄 스릴러", "초자연적 미스터리", "가벼운 로맨스")
        
        **필수:** 각 옵션에 해당하는 영화 ID를 정확히 분류하세요.
      `;
    } else if (step === 'final') {
      // 3단계: 결정적 질문
      prompt = `
        최종 후보 영화들의 정보입니다:
        ${JSON.stringify(simplifiedMovies)}

        ${commonRules}

        **목표:** 단 하나의 영화를 추천하기 위해 결정적인 선택을 유도하세요.
        **질문 작성:** 영화 속 주인공이 처한 딜레마나 상황을 가정하여, 사용자에게 **행동을 선택**하게 하세요.
        **답변 작성:** 사용자가 취할 **구체적인 행동**으로 적으세요.
        (나쁜 예: "지구를 구하기 위해 희생하겠습니다.")
        (좋은 예: "나를 희생해 세상을 구한다", "가족을 데리고 도망친다")
        
        **필수:** 각 옵션은 특정 영화 1개(또는 2개)와 강력하게 연결되어야 하며, relatedMovieIds에 해당 ID를 넣으세요.
      `;
    }

    prompt += `
      \n**출력 포맷 (JSON Array):**
      [
        {
          "questionText": "질문 내용",
          "options": [
            { "text": "간결한 답변 A", "relatedMovieIds": [1, 2, 3] },
            { "text": "간결한 답변 B", "relatedMovieIds": [4, 5, 6] }
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