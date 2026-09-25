/**
 * Misconception tagger — runs in parallel with the Socratic response.
 * Analyzes the student's latest message and classifies any misconceptions.
 * Pure LLM call, no tools, minimal tokens.
 */

import { generateText } from "ai";
import { socratiaModel } from "@/lib/model";
import { z } from "zod";

export const MISCONCEPTION_TAXONOMY = [
  // Math
  "confuses_variable_with_constant",
  "distributes_exponent_over_sum",
  "cancels_terms_not_factors",
  "ignores_order_of_operations",
  "sign_error_in_equation",
  "misapplies_quadratic_formula",
  "confuses_derivative_with_integral",
  "misinterprets_limit_definition",
  "confuses_probability_with_odds",
  // Physics
  "confuses_speed_with_velocity",
  "confuses_acceleration_with_velocity",
  "ignores_vector_nature_of_force",
  "misapplies_newton_third_law",
  "confuses_momentum_with_energy",
  "wrong_free_body_diagram",
  "ignores_conservation_law",
  // Chemistry
  "confuses_moles_with_mass",
  "ignores_stoichiometric_coefficients",
  "misidentifies_limiting_reagent",
  "confuses_molarity_with_molality",
  "wrong_oxidation_state",
  "ignores_charge_balance",
  // CS
  "off_by_one_error",
  "confuses_pass_by_value_with_reference",
  "misunderstands_recursion_base_case",
  "wrong_big_o_classification",
  "infinite_loop_logic",
] as const;

export type MisconceptionTag = (typeof MISCONCEPTION_TAXONOMY)[number];

const tagEnum = z.enum(MISCONCEPTION_TAXONOMY);

const MisconceptionResultSchema = z.object({
  tags: z.array(tagEnum),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().max(200),
});

export type MisconceptionResult = z.infer<typeof MisconceptionResultSchema>;

const SYSTEM_PROMPT = `You are a precise misconception classifier for STEM education.
Given a student's message in the context of a {subject} problem about {topic} at {level},
identify which misconception(s) from the taxonomy their reasoning reveals.

Taxonomy: ${MISCONCEPTION_TAXONOMY.join(", ")}

Rules:
- Return ONLY tags that are CLEARLY evidenced by the student's message.
- If the message is too vague, contains no reasoning, or is just a problem statement, return empty tags.
- Be conservative: false positives hurt more than false negatives.
- Confidence reflects how clearly the misconception is demonstrated (0.0–1.0).
- Reasoning: one sentence explaining the evidence.

Output ONLY valid JSON, no extra text, no markdown. Schema:
{"tags": string[], "confidence": number, "reasoning": string}`;

export async function detectMisconceptions(
  studentMessage: string,
  session: { subject: string; topic: string; level: string },
): Promise<MisconceptionResult> {
  try {
    const { text } = await generateText({
      model: socratiaModel(),
      system: SYSTEM_PROMPT.replace("{subject}", session.subject)
        .replace("{topic}", session.topic)
        .replace("{level}", session.level),
      prompt: `Student message: "${studentMessage}"`,
      temperature: 0.1,
    });

    const parsed = JSON.parse(text);
    return MisconceptionResultSchema.parse(parsed);
  } catch {
    return { tags: [], confidence: 0, reasoning: "Tagger failed" };
  }
}