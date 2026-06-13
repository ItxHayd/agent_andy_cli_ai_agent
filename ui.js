import chalk from "chalk";
import figlet from "figlet";

export const sleep = (ms=2000)=> {
  return new Promise(
    (t)=> { setTimeout(t,ms) }
)}

export const neon = {
  cyan:    (s) => chalk.hex("#00FFFF")(s),
  green:   (s) => chalk.hex("#39FF14")(s),
  magenta: (s) => chalk.hex("#FF00FF")(s),
  yellow:  (s) => chalk.hex("#FFE600")(s),
  orange:  (s) => chalk.hex("#FF6B00")(s),
  dim:     (s) => chalk.hex("#4A4A6A")(s),
  white:   (s) => chalk.hex("#E8E8FF")(s),
};


const SPINNER_FRAMES = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
const TOOL_FRAMES    = ["◐","◓","◑","◒"];

export class NeonSpinner {
  constructor() {
    this._interval = null;
    this._frame    = 0;
    this._label    = "";
    this._frames   = SPINNER_FRAMES;
  }

  start(label = "Thinking") {
    this._label  = label;
    this._frame  = 0;
    this._frames = SPINNER_FRAMES;
    process.stdout.write("\x1B[?25l"); // hide cursor
    this._interval = setInterval(() => this._tick(), 80);
    return this;
  }

  update(label, frames = SPINNER_FRAMES) {
    this._label  = label;
    this._frames = frames;
    return this;
  }

  _tick() {
    const frame = neon.cyan(this._frames[this._frame % this._frames.length]);
    const label = neon.dim(this._label);
    process.stdout.write(`\r${frame}  ${label}   `);
    this._frame++;
  }

  stop(finalLine = "") {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
    process.stdout.write("\r\x1B[2K"); // clear line
    process.stdout.write("\x1B[?25h"); // show cursor
    if (finalLine) console.log(finalLine);
    return this;
  }

  succeed(msg) { this.stop(`${neon.green("✔")}  ${neon.white(msg)}`); }
  fail(msg)    { this.stop(`${chalk.red("✖")}  ${chalk.red(msg)}`); }
  tool(name)   { this.update(`${neon.magenta(name)}`, TOOL_FRAMES); }
}

export async function printBanner() {
  console.clear();
  figlet("Agent-Andy",(err,data)=>{
    console.log(neon.dim(data));
  })
  console.log();
  
  setTimeout(() => {
    const line = neon.dim("─".repeat(52));
    console.log();
    console.log(line);
    console.log(
        `  ${neon.cyan("◈")}  ${neon.green("AGENT")}  ${neon.dim("·")}  ${neon.magenta("nex-n2-pro")}  ${neon.dim("·")}  ${neon.yellow("OpenRouter")}`
    );
    console.log(line);
    console.log();
  }, 3000);
  
}


export function printToolCall(name, args) {
  const argsStr = JSON.stringify(args);
  const preview = argsStr.length > 60 ? argsStr.slice(0, 57) + "…" : argsStr;
  console.log(
    `  ${neon.yellow("⚡")} ${neon.magenta(name)}  ${neon.dim(preview)}`
  );
}


export function printAnswer(content) {
  const divider = neon.dim("─".repeat(52));
  console.log();
  console.log(divider);
  console.log(`  ${neon.cyan("◈")}  ${neon.green("Answer")}`);
  console.log(divider);
  console.log();

  // Minimal markdown highlights (bold, inline code, headers)
  const lines = content.split("\n");
  for (const line of lines) {
    let out = line;
    // ### headers → neon yellow bold
    out = out.replace(/^(#{1,3})\s+(.+)$/, (_, h, t) =>
      neon.yellow("  " + "▸".repeat(h.length) + "  " + t)
    );
    // **bold** → neon green
    out = out.replace(/\*\*(.+?)\*\*/g, (_, t) => neon.green(t));
    // `code` → cyan
    out = out.replace(/`([^`]+)`/g, (_, t) => neon.cyan(t));
    // bullet points
    out = out.replace(/^(\s*[-*])\s/, neon.magenta("  •") + "  ");
    console.log(neon.white("  " + out));
  }
  console.log();
}


export function printStep(stepNum, total) {
  process.stdout.write(
    `\r  ${neon.dim("step")} ${neon.cyan(stepNum)}${total ? neon.dim("/" + total) : ""}   `
  );
}

export async  function print429Warning(retryAfterMs) {
  const secs = Math.ceil(retryAfterMs / 1000);
  process.stdout.write("\n");
  console.log(
    `  ${neon.orange("▲")}  ${chalk.hex("#FF6B00").bold("Rate limited (429)")}  ${neon.dim("→")}  switching to backup key`
  );
 
  // animated countdown bar
  const BAR_WIDTH = 20;
  for (let remaining = secs; remaining >= 0; remaining--) {
    const filled  = Math.round(((secs - remaining) / secs) * BAR_WIDTH);
    const bar     = neon.orange("█".repeat(filled)) + neon.dim("░".repeat(BAR_WIDTH - filled));
    const timeStr = neon.yellow(`${remaining}s`).padEnd(6);
    process.stdout.write(`\r  ${bar}  ${timeStr} `);
    if (remaining > 0) await new Promise((r) => setTimeout(r, 1000));
  }
  process.stdout.write("\r\x1B[2K"); // clear countdown line
  console.log(`  ${neon.green("✔")}  ${neon.white("Retrying with backup key…")}\n`);
}

