# first-simple-eval

A small learning project that builds a tool-calling AI agent with the [Vercel AI SDK](https://ai-sdk.dev) and evaluates whether the model picks the right tools.

The agent is a shop assistant for a Kenyan phone shop. It can look up phone stock and prices, and work out the total cost of an order in Kenyan shillings (KES).

## How it works

```
user prompt ──► generateText (OpenAI model + system prompt + tools)
                     │
                     ├─► checkInventory  → price and stock for a phone
                     └─► calculateTotal  → unitPrice × quantity
                     │
                     ▼
               final answer + the tools that were called
```

- **Agent** (`src/agent.ts`): calls `generateText` with the system prompt and both tools. It allows up to 5 steps (`stepCountIs(5)`), so the model can check inventory, then calculate a total, then answer.
- **Tools** (`src/tools/`): each tool is defined with `tool()` from `ai` and a Zod input schema.
  - `checkInventory`: finds a phone in a hard-coded inventory (iPhone 15, Samsung Galaxy S24, Google Pixel 8) and returns its price, stock quantity and availability.
  - `calculateTotal`: multiplies a verified unit price by a quantity.
- **System prompt** (`src/system/prompt.ts`): tells the model when to use each tool, to use verified prices only, and not to call tools for small talk.

## The tool-selection eval

`src/evals/tool-selection.ts` sends each prompt in `src/evals/data/tool-selection.json` to the model and compares the tools the model chose with the tools the test case expects.

- The eval removes each tool's `execute` function before passing the tools in. The model can still choose a tool, but no tool runs. The eval checks only the **first step's** tool choice, not the final answer.
- A test case passes when the set of tools the model chose is exactly the expected set. Order and duplicates don't matter.
- The script prints the result for each case, then a summary with total, passed, failed and the accuracy percentage.

The dataset has three categories:

| Category    | Purpose                                                           |
| ----------- | ----------------------------------------------------------------- |
| `golden`    | Core, clearly worded questions the agent must get right           |
| `secondary` | Rephrased versions of the same intents                            |
| `negative`  | Prompts that should call **no** tools (greetings, off-topic chat) |

To add a test case, add an object to the JSON file:

```json
{
  "prompt": "How much are 2 Samsung Galaxy S24 phones?",
  "expectedTools": ["checkInventory"],
  "category": "secondary"
}
```

## Getting started

### Prerequisites

- Node.js (a recent LTS version; the project uses ES modules and JSON import attributes)
- An OpenAI API key

### Setup

```bash
npm install
cp .env.example .env
```

Then edit `.env`:

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
```

Both the agent and the eval throw `OPENAI_MODEL is missing` if `OPENAI_MODEL` is not set.

## Scripts

| Command                | What it does                                            |
| ---------------------- | ------------------------------------------------------- |
| `npm run dev`          | Runs the agent once on a sample prompt (`src/run.ts`)   |
| `npm run eval`         | Runs the tool-selection eval and prints the accuracy    |
| `npm run typecheck`    | Type-checks the project with `tsc --noEmit`             |
| `npm run format`       | Formats all files in place with [oxfmt](https://oxc.rs) |
| `npm run format:check` | Checks formatting without writing (useful in CI)        |

## Project structure

```
src/
├── agent.ts                    # runAgent(prompt): the tool-calling agent
├── run.ts                      # Runs the agent on a sample prompt
├── system/
│   └── prompt.ts               # System prompt
├── tools/
│   ├── index.ts                # Exports all tools as one object
│   ├── inventory.ts            # checkInventory tool and sample inventory
│   └── calculator.ts           # calculateTotal tool
└── evals/
    ├── tool-selection.ts       # Tool-selection eval runner
    └── data/
        └── tool-selection.json # Eval dataset
```

## Tech stack

- [AI SDK](https://ai-sdk.dev) (`ai`, `@ai-sdk/openai`): model calls and tool calling
- [Zod](https://zod.dev): tool input schemas
- [tsx](https://tsx.is): runs TypeScript directly
- [TypeScript](https://www.typescriptlang.org) in strict mode, with `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`
- [oxfmt](https://oxc.rs): code formatter from the Oxc project (the same project as oxlint)
