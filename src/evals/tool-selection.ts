import "dotenv/config";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

import { SYSTEM_PROMPT } from "../system/prompt.js";
import { tools } from "../tools/index.js";
import dataset from "./data/tool-selection.json" with { type: "json" };

function requireModelName(): string {
  const modelName = process.env.OPENAI_MODEL;
  if (!modelName) {
    throw new Error("OPENAI_MODEL is missing");
  }
  return modelName;
}

const modelName = requireModelName();

// Strip `execute` so the model only picks tools; nothing actually runs.
const { execute: _checkInventoryExecute, ...checkInventory } = tools.checkInventory;
const { execute: _calculateTotalExecute, ...calculateTotal } = tools.calculateTotal;

const evaluationTools = { checkInventory, calculateTotal };

async function evaluateToolSelection() {
  let passed = 0;
  let failed = 0;

  for (const testcase of dataset) {
    const result = await generateText({
      model: openai(modelName),
      system: SYSTEM_PROMPT,
      prompt: testcase.prompt,
      tools: evaluationTools,
      toolChoice: "auto",
    });

    const selectedTools = result.toolCalls.map((call) => call.toolName);

    const expected = new Set(testcase.expectedTools);

    const actual = new Set(selectedTools);

    const isPassing =
      expected.size == actual.size && [...expected].every((toolName) => actual.has(toolName));

    if (isPassing) {
      passed++;
    } else {
      failed++;
    }

    console.log("\n-------------------------");
    console.log("Prompt:", testcase.prompt);
    console.log("Category:", testcase.category);
    console.log("Expected:", testcase.expectedTools);
    console.log("Actual:", selectedTools);
    console.log("Result:", isPassing ? "PASS" : "FAIL");
  }

  const total = dataset.length;

  const accuracy = total === 0 ? 0 : (passed / total) * 100;

  console.log("\n===== EVALUATION SUMMARY =====");
  console.log("Total:", total);
  console.log("Passed:", passed);
  console.log("Failed:", failed);
  console.log("Tool-selection accuracy:", `${accuracy.toFixed(1)}%`);
}

await evaluateToolSelection();
