# agent-andy

agent-andy is a Node.js command-line AI agent that accepts a prompt, calls an OpenRouter-hosted model, and executes tool calls when the model requests them. It includes a small set of built-in tools for file-system work, shell execution, web access, code execution, memory, task management, and utility helpers.

## Features

- CLI-first prompt interface with optional interactive prompt mode.
- OpenAI-compatible API client targeting OpenRouter.
- Backup API-key fallback for rate-limit (`429`) responses.
- Tool-calling loop that appends tool results back into the conversation.
- Built-in tools for:
  - File read/write/append/delete/copy/move and directory listing
  - Shell command execution
  - HTTP requests, web search, and page scraping
  - Code execution for Python, JavaScript, TypeScript, Bash, and Ruby
  - Regex search across files
  - In-memory facts
  - Date/time and environment-variable lookup
- Neon-styled terminal UI with banner, spinner, tool-call output, and formatted answers.

## Project structure

```text
.
├── agent/
│   ├── toolHandlers.js   # Tool implementation logic
│   └── tools.js          # Tool definitions exposed to the model
├── src/
│   └── main.js           # CLI entry point and agent loop
├── ui.js                 # Terminal formatting, spinner, banner, answer rendering
├── package.json          # Scripts and dependencies
├── .gitignore            # Ignored files and folders
└── LICENSE               # MIT license
```

## Requirements

- Node.js with npm
- OpenRouter API access

## Setup

Install dependencies:

```bash
npm install
```

Create a local `.env` file. This file is ignored by Git.

```env
OPENROUTER_API_KEY=your_primary_key
OPENROUTER_API_KEY_2=your_optional_backup_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

`OPENROUTER_API_KEY` is required. `OPENROUTER_API_KEY_2` is optional and is used only when the primary key receives a rate-limit response.

## Usage

Run the agent with a prompt:

```bash
node src/main.js "What should I do?"
```

Or run the development script:

```bash
npm run dev
```

The model used by default is:

```text
nex-agi/nex-n2-pro:free
```

## Available scripts

```json
{
  "dev": "node ./src/main.js -p",
  "build": "vite build",
  "preview": "vite preview"
}
```

## How it works

1. `src/main.js` reads the command-line prompt.
2. If no prompt is provided, it prints the banner and asks for one.
3. The agent sends the prompt to the OpenRouter model using the OpenAI-compatible SDK.
4. If the model returns tool calls, `agent/toolHandlers.js` executes the requested tools.
5. Tool results are added back into the message history.
6. The loop continues until the model returns a final answer.
7. The answer is printed through `ui.js`.

## Tool categories

### File system

- `Read`
- `Write`
- `Append`
- `ListDirectory`
- `DeleteFile`
- `MoveFile`
- `CopyFile`

### Shell and process

- `Bash`

### Web and network

- `HttpRequest`
- `WebSearch`
- `ScrapeWebPage`

### Code execution

- `ExecuteCode`

### Search

- `GrepSearch`

### Memory and state

- `RememberFact`
- `RecallFact`
- `ForgetFact`

### Task management

- `CreateSubtask`
- `AskUser`

### Utilities

- `GetDateTime`
- `ReadEnvironmentVariable`

## Notes and limitations

- Memory tools are currently in-memory only and reset when the process exits.
- `CreateSubtask` and `AskUser` are stubs and do not implement persistent task queues or real blocking user input.
- `ExecuteCode` writes temporary files to `/tmp`.
- `GrepSearch` depends on the system `grep` command.
- The web-search implementation uses DuckDuckGo HTML scraping and may be replaced with a more reliable API in production.
- Do not commit `.env` files or API keys.

## License

MIT — see `LICENSE` for details.
