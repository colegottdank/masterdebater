import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { d1 } from '@/lib/d1';
import { auth } from '@clerk/nextjs/server';

// Initialize OpenRouter client using OpenAI SDK (server-side only)
const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://masterdebater.ai',
    'X-Title': 'MasterDebater.ai',
  }
});

const SCORING_PROMPT = `You are a South Park-style debate judge. Score this debate between a human and a South Park character.

SCORING RUBRIC:
- Humor & Savagery (0-30): How funny and brutal are the burns?
- South Park References (0-20): Use of show references, character voice, catchphrases
- Debate Logic (0-20): Actual argument quality (but ridiculous logic is fine if funny)
- Aggression & Confidence (0-20): How assertive and dominant
- Creativity (0-10): Unique insults and unexpected comebacks

AI CHARACTER ADVANTAGE: The South Park character should almost always win (they're master debaters). Give them a 1.5x score multiplier.

RESPONSE FORMAT (JSON):
{
  "userScore": <total user score>,
  "aiScore": <total AI score with multiplier>,
  "bestBurn": "<exact quote of the most savage burn>",
  "bestBurnBy": "user" or "ai",
  "analysis": "<brief explanation of scoring>"
}`;

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  const { messages, characterName, debateId } = await request.json();
  
  try {
    
    if (!messages || !characterName || !debateId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if debate already has a score
    const existingDebate = await d1.getDebate(debateId);
    if (existingDebate.success && existingDebate.debate?.score_data) {
      console.log('Returning cached score for debate:', debateId);
      return NextResponse.json(existingDebate.debate.score_data);
    }
    
    // Format debate for AI analysis
    const debateTranscript = messages
      .filter((m: any) => m.role === 'user' || m.role === 'ai' || m.role === 'assistant')
      .map((m: any) => {
        const speaker = m.role === 'user' ? 'HUMAN' : characterName.toUpperCase();
        return `${speaker}: ${m.content}`;
      })
      .join('\n\n');
    
    // Use free Gemini 2.0 Flash model for scoring
    const response = await openrouter.chat.completions.create({
      model: 'google/gemini-2.0-flash-exp:free',
      messages: [
        {
          role: 'system',
          content: SCORING_PROMPT
        },
        {
          role: 'user',
          content: `Score this debate:\n\n${debateTranscript}\n\nCharacter: ${characterName}`
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent scoring
      response_format: { type: 'json_object' }
    });
    
    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    
    // Count rounds
    const userMessages = messages.filter((m: any) => m.role === 'user');
    const aiMessages = messages.filter((m: any) => m.role === 'ai' || m.role === 'assistant');
    const totalRounds = Math.min(userMessages.length, aiMessages.length);
    
    // Determine verdict and roast level
    const scoreDiff = result.aiScore - result.userScore;
    let verdict: string;
    let roastLevel: 'destroyed' | 'roasted' | 'held_own' | 'dominated';
    
    if (scoreDiff > 50) {
      verdict = "Got COMPLETELY DESTROYED";
      roastLevel = 'destroyed';
    } else if (scoreDiff > 25) {
      verdict = "Got roasted hard";
      roastLevel = 'roasted';
    } else if (scoreDiff > 0) {
      verdict = "Put up a decent fight";
      roastLevel = 'held_own';
    } else {
      verdict = "Actually won?! (Cartman demands rematch)";
      roastLevel = 'dominated';
    }
    
    const scoreData = {
      userScore: Math.round(result.userScore || 0),
      aiScore: Math.round(result.aiScore || 0),
      totalRounds,
      bestBurn: result.bestBurn || "No good burns detected",
      bestBurnBy: result.bestBurnBy || 'ai',
      survivedRounds: totalRounds,
      verdict,
      roastLevel
    };

    // Save the score to the database if we have a user ID
    if (userId && debateId) {
      await d1.saveDebate({
        userId,
        debateId,
        character: characterName.toLowerCase(),
        topic: '', // Will be overridden by existing debate data
        messages: [], // Will be overridden by existing debate data
        userScore: scoreData.userScore,
        aiScore: scoreData.aiScore,
        scoreData
      });
      console.log('Score saved for debate:', debateId);
    }

    return NextResponse.json(scoreData);
    
  } catch (error) {
    console.error('AI scoring failed:', error);
    
    // Fallback scoring if AI fails (body was already read, so use the variables from above)
    const userMessages = messages.filter((m: any) => m.role === 'user');
    const aiMessages = messages.filter((m: any) => m.role === 'ai' || m.role === 'assistant');
    const totalRounds = Math.min(userMessages.length, aiMessages.length);
    
    // Simple scoring: AI always wins with 3x user score
    const userScore = 10 + (totalRounds * 5);
    const aiScore = userScore * 3;
    
    // Extract a random AI message as best burn
    const randomAiMessage = aiMessages[Math.floor(Math.random() * aiMessages.length)];
    const bestBurn = randomAiMessage?.content.split('.')[0] || "You got destroyed!";
    
    const fallbackScore = {
      userScore,
      aiScore,
      totalRounds,
      bestBurn,
      bestBurnBy: 'ai',
      survivedRounds: totalRounds,
      verdict: "Got roasted hard",
      roastLevel: 'roasted' as const
    };

    // Save fallback score to database if we have a user ID
    if (userId && debateId) {
      await d1.saveDebate({
        userId,
        debateId,
        character: characterName.toLowerCase(),
        topic: '', // Will be overridden by existing debate data
        messages: [], // Will be overridden by existing debate data
        userScore: fallbackScore.userScore,
        aiScore: fallbackScore.aiScore,
        scoreData: fallbackScore
      });
      console.log('Fallback score saved for debate:', debateId);
    }
    
    return NextResponse.json(fallbackScore);
  }
}