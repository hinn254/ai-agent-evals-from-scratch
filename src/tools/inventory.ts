import { tool } from "ai";
import z from "zod";

const inventory = [
  {
    name: "iPhone 15",
    price: 120000,
    quantity: 5,
  },
  {
    name: "Samsung Galaxy S24",
    price: 95000,
    quantity: 8,
  },
  {
    name: "Google Pixel 8",
    price: 75000,
    quantity: 0,
  },
];

export const checkInventory = tool({
  description: "Check the price and available quantity of a phone in the shop.",

  inputSchema: z.object({
    product: z.string().describe("The phone model the customer is asking about"),
  }),

  execute: async ({ product }) => {
    console.log(`[Tool] Checking inventory for ${product}`);

    const phone = inventory.find((item) => item.name.toLowerCase() === product.toLowerCase());

    if (!phone) {
      return {
        product,
        found: false,
        available: false,
        message: "Phone not found in inventory",
      };
    }

    return {
      product: phone.name,
      found: true,
      available: phone.quantity > 0,
      price: phone.price,
      quantity: phone.quantity,
      currency: "KES",
    };
  },
});
