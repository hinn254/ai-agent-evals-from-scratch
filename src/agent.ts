import "dotenv/config";

import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";

import { SYSTEM_PROMPT } from "./system/prompt.js";
import { tools } from "./tools/index.js";

export async function runAgent(prompt: string) {
  const modelName = process.env.OPENAI_MODEL;

  if (!modelName) {
    throw new Error("OPENAI_MODEL is missing");
  }

  const result = await generateText({
    model: openai(modelName),
    system: SYSTEM_PROMPT,
    prompt,
    tools,
    stopWhen: stepCountIs(5),
  });

  return result;
}
