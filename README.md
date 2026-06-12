# AI Agent CLI

A command-line AI agent built with Node.js that executes tasks from natural language prompts. Simply provide a prompt, and the agent will analyze the request and perform the necessary actions.

## Features

- Natural language task execution
- Command-line interface
- Environment variable configuration
- AI-powered reasoning and planning
- Lightweight and easy to extend

## Installation

Clone the repository:

```bash
git clone https://github.com/yourusername/ai-agent.git
cd ai-agent
```

Install dependencies:

```bash
npm install
```

## Configuration

Create a `.env` file in the project root:

```env
OPENROUTER_API_KEY=your_api_key_here
```

## Usage

Run the agent with a prompt:

```bash
npm run dev "your prompt here"
```

### Examples

List project files:

```bash
npm run dev "List all files in the project"
```

Find the largest file:

```bash
npm run dev "Find the largest file in this repository"
```

Summarize a file:

```bash
npm run dev "Read package.json and explain what this project does"
```

## Project Structure

```text
.
├── src/
│   ├── main.js
├── .env
├── package.json
└── README.md
```

## Scripts

```bash
npm run dev "your prompt"
```

## Tech Stack

- Node.js
- JavaScript (ES Modules)
- OpenRouter API
- dotenv

## Example

Input:

```bash
npm run dev "List all JavaScript files in this project"
```

Output:

```text
src/index.js
```

## Roadmap

- [ ] Multi-step task planning
- [ ] Memory and context persistence
- [ ] Additional tool integrations
- [ ] File editing capabilities
- [ ] Web search support

## License

MIT License

---

Built to explore AI agents, tool calling, and autonomous task execution with Node.js.
