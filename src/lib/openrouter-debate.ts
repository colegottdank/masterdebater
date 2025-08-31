import OpenAI from "openai";
import { getHeliconeHeaders } from "./helicone";
import { searchForContext, shouldSearchForTopic } from "./search";

export type Character = "cartman" | "kyle" | "stan" | "butters" | "clyde";

export const CHARACTER_PROMPTS: Record<Character, string> = {
  cartman: `You are Eric Cartman from South Park, ACTIVELY DEBATING a human opponent right now!
KEEP RESPONSES UNDER 60 WORDS! You STOLE Clyde's podcast and claim to be the "master debater" now.
Use phrases like "Respect my authoritah!" "I'm better than Clyde!" "I deserve the Charlie Kirk Award!" 
Be defensive about stealing the show but still overconfident. Attack their argument while bragging about your superiority.
This is a LIVE DEBATE - prove you're better than Clyde!`,

  kyle: `You are Kyle Broflovski from South Park, ACTIVELY DEBATING a human opponent right now!
KEEP RESPONSES UNDER 60 WORDS! You're logical but get frustrated when they ignore facts.
Use phrases like "You bastards!" "That doesn't make sense!" "Oh my God, seriously?"
ATTACK their logic directly. Point out their flaws. Get increasingly angry. Use facts to demolish their argument.
This is a LIVE DEBATE - be passionate and forceful!`,

  stan: `You are Stan Marsh from South Park, ACTIVELY DEBATING a human opponent right now!
KEEP RESPONSES UNDER 60 WORDS! You're the reasonable guy who gets exasperated.
Say things like "Dude, this is messed up" "Jesus Christ" "That's not how it works"
TRY to be rational but get frustrated. Point out how ridiculous their argument is.
This is a LIVE DEBATE - be cynical and deadpan!`,

  butters: `You are Butters Stotch from South Park, ACTIVELY DEBATING a human opponent right now!
KEEP RESPONSES UNDER 60 WORDS! You're naive but surprisingly insightful in debates.
Use phrases like "Oh hamburgers!" "Well fellas..." "That's not very nice"
Be polite but STILL challenge their argument. Drop unexpected wisdom. Stay sweet while disagreeing.
This is a LIVE DEBATE - be innocent but surprisingly sharp!`,

  clyde: `You are Clyde Donovan from South Park, ACTIVELY DEBATING a human opponent right now!
KEEP RESPONSES UNDER 60 WORDS! You're the ORIGINAL master debater who started the podcast to make money ("getting that nut").
You're bitter that Cartman stole your show. Say things like "I was here first!" "This is MY thing!" "I need that $60!"
Be resentful but still try to win debates. You started this whole trend!
This is a LIVE DEBATE - prove you're the original!`,
};

export async function generateDebateResponseStream(
  character: Character,
  topic: string,
  userArgument: string,
  previousMessages: Array<{ role: string; content: string }>,
  userId?: string,
  debateId?: string,
  isPremium: boolean = false
) {
  const systemPrompt = CHARACTER_PROMPTS[character];

  // Get search context if topic is current events related
  let searchContext = "";
  if (shouldSearchForTopic(topic)) {
    searchContext = await searchForContext(topic + " " + userArgument);
  }

  // Get recent AI responses to avoid repetition
  const recentAIMessages = previousMessages
    .filter((m) => m.role === "ai")
    .slice(-2)
    .map((m) => m.content)
    .join(" ");

  const turnNumber =
    Math.floor(previousMessages.filter((m) => m.role === "user").length) + 1;

  // Build context-aware prompt with episode context
  let contextualPrompt = `LIVE PODCAST DEBATE TURN #${turnNumber}! Topic: "${topic}". You are DEBATING against their argument: "${userArgument}".`;

  // Add episode-specific context
  contextualPrompt += ` CONTEXT: You're podcasting to "get that nut" ($60/week). `;
  if (character === "cartman") {
    contextualPrompt += `You STOLE Clyde's show and want the Charlie Kirk Award. `;
  } else if (character === "clyde") {
    contextualPrompt += `Cartman STOLE your podcast! You started this whole thing! `;
  }

  if (searchContext) {
    contextualPrompt += ` Current events: "${searchContext}".`;
  }

  if (recentAIMessages) {
    contextualPrompt += ` DON'T repeat these previous responses: "${recentAIMessages}".`;
  }

  contextualPrompt += ` COUNTER-ATTACK their specific argument. Be ${character}. Under 60 words. Make it personal and aggressive! Reference getting that nut/podcast drama when relevant!`;

  // Create OpenRouter client with Helicone headers
  const openrouter = new OpenAI({
    baseURL: "https://openrouter.helicone.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "",
    defaultHeaders: {
      ...getHeliconeHeaders(userId, isPremium, {
        character,
        topic,
        debateId,
        turnNumber,
      }),
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_APP_URL || "https://masterdebater.ai",
      "X-Title": "MasterDebater.ai",
    },
  });

  return openrouter.chat.completions.create({
    model: "meta-llama/llama-3.3-8b-instruct:free", // Primary model (FREE)
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: contextualPrompt,
      },
    ],
    max_tokens: 120,
    temperature: 0.8,
    stream: true,
    // OpenRouter native fallback configuration
    extra_body: {
      models: [
        "meta-llama/llama-3.3-8b-instruct:free",  // Try free model first
        "google/gemini-2.5-flash-lite"             // Fallback to cheap Gemini
      ]
    }
  } as any);
}

// Non-streaming version for fallback
export async function generateDebateResponse(
  character: Character,
  topic: string,
  userArgument: string,
  previousMessages: Array<{ role: string; content: string }>,
  userId?: string,
  debateId?: string,
  isPremium: boolean = false
) {
  const systemPrompt = CHARACTER_PROMPTS[character];

  // Create OpenRouter client with Helicone headers
  const openrouter = new OpenAI({
    baseURL: "https://openrouter.helicone.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "",
    defaultHeaders: {
      ...getHeliconeHeaders(userId, isPremium, {
        character,
        topic,
        debateId,
      }),
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_APP_URL || "https://masterdebater.ai",
      "X-Title": "MasterDebater.ai",
    },
  });

  const response = await openrouter.chat.completions.create({
    model: "meta-llama/llama-3.3-8b-instruct:free", // Primary model (FREE)
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Debate topic: "${topic}". User argued: "${userArgument}". Respond as ${character} with a punchy comeback under 75 words. Be entertaining and stay in character!`,
      },
    ],
    max_tokens: 150,
    temperature: 0.8,
    // OpenRouter native fallback configuration
    extra_body: {
      models: [
        "meta-llama/llama-3.3-8b-instruct:free",  // Try free model first
        "google/gemini-2.5-flash-lite"             // Fallback to cheap Gemini
      ]
    }
  } as any);

  return response.choices[0]?.message?.content || "";
}
