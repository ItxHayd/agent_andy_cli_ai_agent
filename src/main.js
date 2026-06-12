import OpenAI from "openai";
import fs from "fs";
import { execSync } from "child_process";


async function main() {
  const [, , flag, prompt] = process.argv;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL =
    process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  if (flag !== "-p" || !prompt) {
    throw new Error("error: -p flag is required");
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });

  const tools =  [{
          "type": "function",
          "function": {
              "name": "Read",
              "description": "Reads and return the contents of a file",
              "parameters": {
                "type": "object",
                "properties": {
                  "file_path": {
                    "type": "string",
                    "description": "The path to the file to read"
                  }
                },
              "required": ["file_path"]
            }
          }
  },
  {
    "type": "function",
    "function": {
      "name": "Write",
      "description": "Write content to a file",
      "parameters": {
        "type": "object",
        "required": ["file_path", "content"],
        "properties": {
          "file_path": {
            "type": "string",
            "description": "The path of the file to write to"
          },
          "content": {
            "type": "string",
            "description": "The content to write to the file"
          }
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "Bash",
      "description": "Execute a shell command",
      "parameters": {
        "type": "object",
        "required": ["command"],
        "properties": {
          "command": {
            "type": "string",
            "description": "The command to execute"
          }
        }
      }
    }
  }
];

  let messages = [
    { role: "user", content: prompt }
  ];
  
  while (true) {
    
    const response = await client.chat.completions.create({
      model: "nex-agi/nex-n2-pro:free",
      messages,
      tools,
      }
    );
    
    const message = response.choices[0].message;

    messages.push(message);
    
    const toolCalls = message.tool_calls;

    
    if (!toolCalls || toolCalls.length === 0) {
      console.log(message.content);
      break;
    }

    for (const toolCall of toolCalls) {

      if (toolCall) {
        const name = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

        let result;

        if (name === "Bash") {
          try {
            result = execSync(args.command, {encoding: "utf-8",stdio: "pipe"});
          } catch (err) {
            
            result = err.stderr?.toString() || err.message;
          }
        }

        
        if (name === "Read") {
          result = fs.readFileSync(args.file_path, "utf-8");
        }

        if (name === "Write") {
          const { file_path, content } = args;

          fs.writeFileSync(file_path, content, "utf-8");

          result = "file written successfully";
        }

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result ?? "",
        });
      }
    }
    if (!response.choices || response.choices.length === 0) {
      throw new Error("no choices in response");
    }
  }

}

main();
