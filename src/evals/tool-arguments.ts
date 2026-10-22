import "dotenv/config";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

import { SYSTEM_PROMPT } from "../system/prompt.js";
import { tools } from "../tools/index.js";

import dataset from "./data/tool-arguments.json";

const modelName = process.env.OPENAI_MODEL;

if (!modelName) {
  throw new Error("OPENAI_MODEL is missing");
}

const evaluationTools = {
  checkInventory: {
    description: tools.checkInventory.description,
    inputSchema: tools.checkInventory.inputSchema,
  },
  calculateTotal: {
    description: tools.calculateTotal.description,
    inputSchema: tools.calculateTotal.inputSchema,
  },
};

function compareArguments(
  expected: Record<string, unknown>,
  actual: Record<string, unknown>,
): boolean {
  const expectedKeys = Object.keys(expected);
  const actualKeys = Object.keys(actual);

  if (expectedKeys.length !== actualKeys.length) {
    return false;
  }

  return expectedKeys.every((key) => {
    return Object.prototype.hasOwnProperty.call(actual, key) && expected[key] === actual[key];
  });
}

async function evaluateToolArguments() {
  let selectionPassed = 0;
  let argumentsPassed = 0;
  let fullyPassed = 0;

  for (const testCase of dataset) {
    const result = await generateText({
      model: openai(modelName!),
      system: SYSTEM_PROMPT,
      prompt: testCase.prompt,
      tools: evaluationTools,
      toolChoice: "auto",
    });

    const toolCalls = result.toolCalls;

    const selectedTool = toolCalls.length == 1 ? toolCalls[0]?.toolName : null;

    const actualInput = toolCalls.length == 1 ? toolCalls[0]?.input : null;

    const selectionCorrect =
      testCase.expectedInput == null
        ? toolCalls.length === 0
        : toolCalls.length === 1 && selectedTool === testCase.expectedTool;

    let argumentsCorrect = false;

    if (testCase.expectedTool == null && toolCalls.length === 0) {
      argumentsCorrect = true;
    } else if (
      selectionCorrect &&
      testCase.expectedInput !== null &&
      actualInput !== null &&
      typeof actualInput === "object" &&
      !Array.isArray(actualInput)
    ) {
      argumentsCorrect = compareArguments(
        testCase.expectedInput,
        actualInput as Record<string, unknown>,
      );
    }

    const passed = selectionCorrect && argumentsCorrect;

    if (selectionCorrect) selectionPassed++;
    if (argumentsCorrect) argumentsPassed++;
    if (passed) fullyPassed++;

    console.log("\n-------------------------");
    console.log("Prompt:", testCase.prompt);
    console.log("Category:", testCase.category);

    console.log("Expected tool:", testCase.expectedTool);
    console.log("Actual tool:", selectedTool);
    console.log("Tool calls:", toolCalls.length);

    console.log("Expected input:", testCase.expectedInput);
    console.log("Actual input:", actualInput);

    console.log("Tool selection:", selectionCorrect ? "PASS" : "FAIL");

    console.log("Arguments:", argumentsCorrect ? "PASS" : "FAIL");

    console.log("Overall:", passed ? "PASS" : "FAIL");
  }

  const total = dataset.length;

  const percentage = (count: number) =>
    total === 0 ? "0.0%" : `${((count / total) * 100).toFixed(1)}`;

  console.log("\n===== EVALUATION SUMMARY =====");
  console.log("Total cases:", total);
  console.log("Tool selection accuracy:", percentage(selectionPassed));
  console.log("Argument check pass rate:", percentage(argumentsPassed));
  console.log("Combined pass rate:", percentage(fullyPassed));
}

await evaluateToolArguments();
