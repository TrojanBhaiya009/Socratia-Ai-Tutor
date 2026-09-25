/**
 * Aha-moment detector — runs in parallel with the Socratic response.
 * Analyzes the student's latest message to detect breakthrough/understanding moments.
 */

import { generateText } from "ai";
import { socratiaModel } from "@/lib/model";
import { z } from "zod";

const AhaResultSchema = z.object({
  isAhaMoment: z.boolean(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().max(200),
});

export type AhaResult = z.infer<typeof AhaResultSchema>;

const SYSTEM_PROMPT = `You are an expert at detecting "aha moments" in student learning dialogues.
Given the student's LATEST message in the context of a {subject} problem about {topic} at {level},
determine if they just had a genuine breakthrough in understanding.

An "aha moment" is when the student:
- Suddenly expresses the correct concept/insight they were missing
- Says things like "Oh, I get it now!", "So it's because...", "Wait, that means..."
- Correctly applies a principle they previously struggled with
- Articulates the key insight in their own words

NOT an aha moment:
- Just saying "ok" or "thanks" without demonstrating understanding
- Repeating what the tutor just said without adding their own reasoning
- Guessing an answer without explanation
- Simple acknowledgment

Output ONLY valid JSON, no extra text, no markdown. Schema:
{"isAhaMoment": boolean, "confidence": number, "reasoning": string}`;

export async function detectAhaMoment(
  studentMessage: string,
  session: { subject: string; topic: string; level: string },
  previousMisconceptions: string[] = [],
): Promise<AhaResult> {
  try {
    const { text } = await generateText({
      model: socratiaModel(),
      system: SYSTEM_PROMPT.replace("{subject}", session.subject)
        .replace("{topic}", session.topic)
        .replace("{level}", session.level),
      prompt: `Student's latest message: "${studentMessage}"\n\nPreviously detected misconceptions: ${previousMisconceptions.join(", ") || "none"}`,
      temperature: 0.1,
    });

    const parsed = JSON.parse(text);
    return AhaResultSchema.parse(parsed);
  } catch {
    return { isAhaMoment: false, confidence: 0, reasoning: "Detector failed" };
  }
}