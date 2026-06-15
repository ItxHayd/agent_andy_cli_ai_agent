import os from "os";
import fs from "fs";
import path from "path";

import { execSync } from "child_process";
import "dotenv/config";

// In-memory store for RememberFact / RecallFact / ForgetFact
const agentMemory = new Map();

/**
 * Execute a single tool call and return a string result.
 * @param {string} name  - Tool name
 * @param {object} args  - Parsed arguments from the model
 * @returns {Promise<string>} - Result to send back as the tool message
 */


async function executeTool(name, args) {
 

  if (name === "Read") {
    return fs.readFileSync(args.file_path, "utf-8");
  }

  if (name === "Write") {
    const dir = path.dirname(args.file_path);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(args.file_path, args.content, "utf-8");
    return "File written successfully.";
  }

  if (name === "Append") {
    fs.appendFileSync(args.file_path, args.content, "utf-8");
    return "Content appended successfully.";
  }

  if (name === "ListDirectory") {
    function listDir(dirPath, recursive) {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      const results = [];
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        results.push({ path: fullPath, type: entry.isDirectory() ? "dir" : "file" });
        if (recursive && entry.isDirectory()) {
          results.push(...listDir(fullPath, true));
        }
      }
      return results;
    }
    const entries = listDir(args.directory_path, args.recursive ?? false);
    return JSON.stringify(entries, null, 2);
  }

  if (name === "DeleteFile") {
    fs.rmSync(args.file_path, { recursive: false });
    return `Deleted: ${args.file_path}`;
  }

  if (name === "MoveFile") {
    fs.renameSync(args.source_path, args.destination_path);
    return `Moved ${args.source_path} → ${args.destination_path}`;
  }

  if (name === "CopyFile") {
    fs.copyFileSync(args.source_path, args.destination_path);
    return `Copied ${args.source_path} → ${args.destination_path}`;
  }

  // ─────────────────────────────────────────────
  // SHELL / PROCESS
  // ─────────────────────────────────────────────

  if (name === "Bash") {
    try {
      const stdout = execSync(args.command, {
        encoding: "utf-8",
        stdio: "pipe",
        cwd: args.working_directory ?? process.cwd(),
        timeout: args.timeout_ms ?? 30_000,
      });
      return stdout || "(no output)";
    } catch (err) {
      return `ERROR:\n${err.stderr?.toString() ?? err.message}`;
    }
  }

  // ─────────────────────────────────────────────
  // WEB / NETWORK
  // ─────────────────────────────────────────────

  if (name === "HttpRequest") {
    const { url, method = "GET", headers = {}, body, timeout_ms = 15_000 } = args;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout_ms);

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ?? undefined,
        signal: controller.signal,
      });
      clearTimeout(timer);

      const responseHeaders = Object.fromEntries(res.headers.entries());
      const text = await res.text();
      return JSON.stringify({ status: res.status, headers: responseHeaders, body: text }, null, 2);
    } catch (err) {
      clearTimeout(timer);
      return `ERROR: ${err.message}`;
    }
  }

  if (name === "GenerateImage") {
    const response = await fetch(process.env.WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer 12345678" }, // i know it's here but your dont have WORKER_URL hahahhahhahahahha
      body: JSON.stringify({ prompt: args.imagePrompt }),
    });

    if (!response.ok) throw new Error(`Worker failed (${response.status}): ${await response.text()}`);

    const savePath = args.savePath
      ? path.resolve(args.savePath)
      : path.join(os.homedir(), "Downloads", `generated-${Date.now()}.png`);

    fs.writeFileSync(savePath, Buffer.from(await response.arrayBuffer()));

    return JSON.stringify({ success: true, savedTo: savePath });
  }

  if (name === "WebSearch") {
   
    const query = encodeURIComponent(args.query);
    const numResults = args.num_results ?? 5;

    try {
      const res = await fetch(`https://html.duckduckgo.com/html/?q=${query}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const html = await res.text();

      // Minimal regex scrape — replace with proper parser / API for production
      const resultRegex = /<a class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
      const snippetRegex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

      const urls = [...html.matchAll(resultRegex)].map(m => ({
        url: m[1],
        title: m[2].replace(/<[^>]+>/g, "").trim(),
      }));
      const snippets = [...html.matchAll(snippetRegex)].map(m =>
        m[1].replace(/<[^>]+>/g, "").trim()
      );

      const results = urls.slice(0, numResults).map((r, i) => ({
        title: r.title,
        url: r.url,
        snippet: snippets[i] ?? "",
      }));
      return JSON.stringify(results, null, 2);
    } catch (err) {
      return `ERROR: ${err.message}`;
    }
  }

  if (name === "ScrapeWebPage") {
    try {
      const res = await fetch(args.url, { headers: { "User-Agent": "Mozilla/5.0" } });
      const html = await res.text();

      // Strip tags, collapse whitespace
      let text = html.replace(/<script[\s\S]*?<\/script>/gi, "");
      text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
      text = text.replace(/<[^>]+>/g, " ");
      text = text.replace(/\s{2,}/g, " ").trim();

      if (args.include_links) {
        const linkRegex = /href="(https?:\/\/[^"]+)"/g;
        const links = [...html.matchAll(linkRegex)].map(m => m[1]);
        return `${text}\n\nLINKS:\n${[...new Set(links)].join("\n")}`;
      }
      return text;
    } catch (err) {
      return `ERROR: ${err.message}`;
    }
  }

  // ─────────────────────────────────────────────
  // CODE
  // ─────────────────────────────────────────────

  if (name === "ExecuteCode") {
    const { language, code, timeout_ms = 10_000 } = args;

    const langMap = {
      python: { cmd: "python3", ext: ".py" },
      javascript: { cmd: "node", ext: ".js" },
      typescript: { cmd: "ts-node", ext: ".ts" },
      bash: { cmd: "bash", ext: ".sh" },
      ruby: { cmd: "ruby", ext: ".rb" },
    };

    const lang = langMap[language];
    if (!lang) return `ERROR: Unsupported language "${language}"`;

    const tmpFile = path.join("/tmp", `agent_exec_${Date.now()}${lang.ext}`);
    try {
      fs.writeFileSync(tmpFile, code, "utf-8");
      const output = execSync(`${lang.cmd} ${tmpFile}`, {
        encoding: "utf-8",
        stdio: "pipe",
        timeout: timeout_ms,
      });
      return output || "(no output)";
    } catch (err) {
      return `ERROR:\n${err.stderr?.toString() ?? err.message}`;
    } finally {
      fs.rmSync(tmpFile, { force: true });
    }
  }

  if (name === "GrepSearch") {
    const { pattern, directory_path, file_glob = ".", case_insensitive = false, max_results = 50 } = args;

    const flags = ["-rn", case_insensitive ? "-i" : "", "--include", file_glob]
      .filter(Boolean)
      .join(" ");

    try {
      const raw = execSync(`grep ${flags} "${pattern}" "${directory_path}"`, {
        encoding: "utf-8",
        stdio: "pipe",
      });
      const lines = raw.trim().split("\n").slice(0, max_results);
      return lines.join("\n") || "No matches found.";
    } catch (err) {
      // grep exits 1 when no matches — not a real error
      if (err.status === 1) return "No matches found.";
      return `ERROR: ${err.stderr?.toString() ?? err.message}`;
    }
  }

  // ─────────────────────────────────────────────
  // MEMORY / STATE
  // ─────────────────────────────────────────────

  if (name === "RememberFact") {
    agentMemory.set(args.key, args.value);
    return `Stored: ${args.key}`;
  }

  if (name === "RecallFact") {
    const value = agentMemory.get(args.key);
    return value !== undefined ? value : `No fact stored for key "${args.key}"`;
  }

  if (name === "ForgetFact") {
    agentMemory.delete(args.key);
    return `Deleted fact: ${args.key}`;
  }

  // ─────────────────────────────────────────────
  // TASK MANAGEMENT
  // ─────────────────────────────────────────────

  if (name === "CreateSubtask") {
    const id = `subtask_${Date.now()}`;
    console.log(`[Subtask created] id=${id} priority=${args.priority ?? "medium"}: ${args.description}`);
    return JSON.stringify({ subtask_id: id, status: "queued" });
  }

  if (name === "AskUser") {
    // Stub — in a real agent loop you'd pause here and wait for user input via readline / WebSocket / etc.
    const optionsText = args.options?.length
      ? `\nOptions: ${args.options.join(" | ")}`
      : "";
    console.log(`\n[Agent asks] ${args.question}${optionsText}\n`);
    // Return placeholder so the agent doesn't hang; replace with real I/O
    return "__AWAITING_USER_INPUT__";
  }

  // ─────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────

  if (name === "GetDateTime") {
    const tz = args.timezone ?? "UTC";
    const now = new Date();
    const fmt = args.format ?? "iso8601";

    if (fmt === "unix_timestamp") return String(Math.floor(now.getTime() / 1000));
    if (fmt === "human_readable") return now.toLocaleString("en-US", { timeZone: tz });
    // iso8601
    return new Date(now.toLocaleString("en-US", { timeZone: tz })).toISOString();
  }

  if (name === "ReadEnvironmentVariable") {
    const val = process.env[args.variable_name];
    return val !== undefined ? val : `null`;
  }

  // ─────────────────────────────────────────────
  // UNKNOWN TOOL
  // ─────────────────────────────────────────────
  return `ERROR: Unknown tool "${name}"`;
}


export async function handleToolCalls(toolCalls, messages) {
  for (const toolCall of toolCalls) {
    if (!toolCall) continue;

    const name = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);

    let result;
    try {
      result = await executeTool(name, args);
    } catch (err) {
      result = `UNHANDLED ERROR in ${name}: ${err.message}`;
    }

    messages.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: result ?? "",
    });
  }
}