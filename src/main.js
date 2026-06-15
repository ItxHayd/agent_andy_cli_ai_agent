#!/usr/bin/env node


import OpenAI from "openai";
import "dotenv/config";

import { input } from "@inquirer/prompts";
import chalk from "chalk";

import tools from "../agent/tools.js";
import { handleToolCalls } from "../agent/toolHandlers.js";
import {
  printBanner,
  printToolCall,
  print429Warning,
  printAnswer,
  NeonSpinner,
  neon,
  sleep,
} from "../ui.js";


async function callWithFallback(clients, model, messages, tools) {
  for (let attempt = 0; attempt < clients.length; attempt++) {
    try {
      return await clients[attempt].chat.completions.create({ model, messages, tools });
    } catch (err) {
      const is429 =
        err?.status === 429 ||
        err?.response?.status === 429 ||
        String(err?.message).includes("429");

      if (is429 && attempt < clients.length - 1) {
        const retryAfter = parseInt(
          err?.response?.headers?.get?.("retry-after") ?? "3",
          10
        );
        await print429Warning(retryAfter * 1000);
        continue;
      }

      throw err;
    }
  }
}


async function main() {
  let prompt = process.argv.slice(2).join(" ");

  if (!prompt) {
    printBanner();
    await sleep(3500);

    prompt = await input({
      message: `${neon.cyan("◈")}  ${neon.white("What should I do?")}`,
    });
  }

  console.log();

  const baseURL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
  const apiKey1 = process.env.OPENROUTER_API_KEY;
  const apiKey2 = process.env.OPENROUTER_API_KEY_2;

  if (!apiKey1) throw new Error("OPENROUTER_API_KEY is not set");

  const clients = [new OpenAI({ apiKey: apiKey1, baseURL })];

  if (apiKey2) {
    clients.push(new OpenAI({ apiKey: apiKey2, baseURL }));
  } else {
    console.log(
      `  ${neon.dim("ℹ")}  ${neon.dim("OPENROUTER_API_KEY_2 not set — no backup key available")}\n`
    );
  }

  const messages = [{ role: "user", content: prompt }];
  const spinner = new NeonSpinner();
  let step = 0;

  while (true) {
    step++;
    spinner.start(`Thinking  ${neon.dim("step " + step)}`);

    let response;
    try {
      response = await callWithFallback(clients, "nex-agi/nex-n2-pro:free", messages, tools);
    } catch (err) {
      spinner.fail(`API error: ${err.message}`);
      process.exit(1);
    }

    if (!response.choices?.length) {
      spinner.fail("No choices in response");
      break;
    }

    const message = response.choices[0].message;
    const toolCalls = message.tool_calls;

    messages.push(message);

    if (!toolCalls?.length) {
      spinner.stop();
      printAnswer(message.content ?? "(no content)");
      break;
    }

    spinner.stop();

    for (const tc of toolCalls) {
      if (!tc) continue;
      const args = JSON.parse(tc.function.arguments ?? "{}");
      printToolCall(tc.function.name, args);
    }

    spinner.start("Running tools");

    const wrappedToolCalls = toolCalls.map((tc) => ({
      ...tc,
      _onStart: () => spinner.tool(tc.function.name),
    }));

    await handleToolCallsWithHooks(wrappedToolCalls, messages, spinner);

    spinner.succeed(
      `${toolCalls.length} tool${toolCalls.length > 1 ? "s" : ""} completed`
    );
  }
}



async function handleToolCallsWithHooks(toolCalls, messages, spinner) {
  for (const toolCall of toolCalls) {
    if (!toolCall) continue;
    toolCall._onStart?.();
    await handleToolCalls([toolCall], messages);
  }
}


main().catch((err) => {
  console.error(chalk.red("\n  ✖  Fatal: ") + err.message);
  process.exit(1);
});