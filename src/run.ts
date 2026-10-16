import "dotenv/config";

import { runAgent } from "./agent.js";

const result = await runAgent("Do you have 3 iphone 15 phones, and how much will they cost?");

console.log("\n FINAL ANSWER:");
console.log(result.text);

const selectedTools = result.steps.flatMap((step) => step.toolCalls.map((call) => call.toolName));

console.log("\nTOOLS CALLED:");
console.log(selectedTools);
