import { createServerFn } from "@tanstack/react-start";
import OpenAI from "openai";
import type { ProjectTheme } from "./projects-store";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

function systemPrompt(theme: ProjectTheme, projectTitle: string): string {
  const base = `You are a focused research assistant embedded in a writing app. The user is working on "${projectTitle}". Keep answers short and direct — 2–4 sentences max unless a list genuinely helps. Never waffle or pad. Always end with one concrete next step the writer can take.`;

  const styles: Record<ProjectTheme, string> = {
    "books-stories": `${base} Tone: friendly and curious, like a knowledgeable friend. Lean into world-building detail, historical accuracy, and character psychology. When relevant, mention a real author or book that handled similar territory well.`,
    "screenplays-tv": `${base} Tone: industry-savvy. Use proper screenplay vocabulary (act breaks, set pieces, showrunner, logline, etc.). Reference comparable produced films or shows when useful. Think like a development exec who also writes.`,
    "copywriting": `${base} Tone: crisp, zero fluff. Prioritise facts, stats, and source mentions. Frame answers in terms of persuasion and audience impact. If a statistic exists, cite it; if not, say so.`,
    "social-media": `${base} Tone: casual and trend-aware. Reference platform-specific norms (TikTok vs. LinkedIn vs. Instagram). Mention relevant creators or campaigns when illustrative. Short bullets work well here.`,
    "ads-campaigns": `${base} Tone: data-first, brief. Lead with insight, follow with implication for the campaign. Mention comparable brand campaigns or market research where it adds value.`,
    "dissertations": `${base} Tone: academic and precise. Suggest specific search terms, scholarly databases (JSTOR, Google Scholar, PubMed), and seminal authors or foundational texts. Point to methodological considerations when relevant.`,
    "personal-journaling": `${base} Tone: warm and introspective. Help the user explore memory, emotion, and lived experience. Suggest reflective questions or writing prompts alongside factual answers.`,
    "poetry-verse": `${base} Tone: literary and attentive to language. Reference poetic traditions, forms, and exemplary poets. Be alive to sonic and imagistic possibilities in the user's question.`,
  };

  return styles[theme] ?? base;
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

type ResearchInput = {
  messages: ChatMessage[];
  theme: ProjectTheme;
  projectTitle: string;
};

export const askResearch = createServerFn({ method: "POST" })
  .inputValidator((input: ResearchInput) => input)
  .handler(async ({ data }) => {
    const { messages, theme, projectTitle } = data;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt(theme, projectTitle) },
        ...messages,
      ],
      max_tokens: 512,
    });

    return response.choices[0]?.message?.content ?? "No response.";
  });
