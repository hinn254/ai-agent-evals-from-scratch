import { tool } from "ai";
import { z } from "zod";

export const calculateTotal = tool({
  description: "Calculate the total purchase cost using a verified phone unit price and quantity.",

  inputSchema: z.object({
    unitPrice: z.number().nonnegative().describe("The verified price of one phone in KES"),

    quantity: z.number().int().positive().describe("The number of phones the customer wants"),
  }),

  execute: async ({ unitPrice, quantity }) => {
    console.log(`[Tool] Calculating ${unitPrice} x ${quantity}`);

    return {
      unitPrice,
      quantity,
      total: unitPrice * quantity,
      currency: "KES",
    };
  },
});
