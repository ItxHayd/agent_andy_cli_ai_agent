const tools = [
  // ─────────────────────────────────────────────
  // FILE SYSTEM
  // ─────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "Read",
      description: "Read and return the full contents of a file from disk.",
      parameters: {
        type: "object",
        required: ["file_path"],
        properties: {
          file_path: {
            type: "string",
            description: "Absolute or relative path to the file to read.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "Write",
      description:
        "Write (or overwrite) content to a file. Creates the file if it does not exist.",
      parameters: {
        type: "object",
        required: ["file_path", "content"],
        properties: {
          file_path: {
            type: "string",
            description: "Absolute or relative path of the file to write.",
          },
          content: {
            type: "string",
            description: "The full content to write to the file.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "Append",
      description:
        "Append content to the end of an existing file without overwriting it.",
      parameters: {
        type: "object",
        required: ["file_path", "content"],
        properties: {
          file_path: {
            type: "string",
            description: "Path to the file to append to.",
          },
          content: {
            type: "string",
            description: "The content to append.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ListDirectory",
      description:
        "List all files and sub-directories inside a directory. Optionally recurse into sub-directories.",
      parameters: {
        type: "object",
        required: ["directory_path"],
        properties: {
          directory_path: {
            type: "string",
            description: "Path to the directory to list.",
          },
          recursive: {
            type: "boolean",
            description:
              "Whether to list files recursively. Defaults to false.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "DeleteFile",
      description: "Permanently delete a file or an empty directory.",
      parameters: {
        type: "object",
        required: ["file_path"],
        properties: {
          file_path: {
            type: "string",
            description: "Path to the file or empty directory to delete.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "MoveFile",
      description: "Move or rename a file or directory.",
      parameters: {
        type: "object",
        required: ["source_path", "destination_path"],
        properties: {
          source_path: {
            type: "string",
            description: "Current path of the file or directory.",
          },
          destination_path: {
            type: "string",
            description: "New path (including new name if renaming).",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "CopyFile",
      description: "Copy a file from one location to another.",
      parameters: {
        type: "object",
        required: ["source_path", "destination_path"],
        properties: {
          source_path: {
            type: "string",
            description: "Path of the file to copy.",
          },
          destination_path: {
            type: "string",
            description: "Destination path for the copy.",
          },
        },
      },
    },
  },

  // ─────────────────────────────────────────────
  // SHELL / PROCESS
  // ─────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "Bash",
      description:
        "Execute a shell command and return stdout, stderr, and exit code.",
      parameters: {
        type: "object",
        required: ["command"],
        properties: {
          command: {
            type: "string",
            description: "The shell command to execute.",
          },
          working_directory: {
            type: "string",
            description:
              "Directory to run the command in. Defaults to the current working directory.",
          },
          timeout_ms: {
            type: "number",
            description:
              "Maximum execution time in milliseconds. Defaults to 30000.",
          },
        },
      },
    },
  },

  // ─────────────────────────────────────────────
  // WEB / NETWORK
  // ─────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "HttpRequest",
      description:
        "Make an HTTP/HTTPS request and return the status code, headers, and response body.",
      parameters: {
        type: "object",
        required: ["url"],
        properties: {
          url: {
            type: "string",
            description: "The full URL to request.",
          },
          method: {
            type: "string",
            enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"],
            description: "HTTP method. Defaults to GET.",
          },
          headers: {
            type: "object",
            description: "Key-value map of request headers.",
            additionalProperties: { type: "string" },
          },
          body: {
            type: "string",
            description:
              "Request body (for POST / PUT / PATCH). JSON-stringify objects before passing.",
          },
          timeout_ms: {
            type: "number",
            description: "Request timeout in milliseconds. Defaults to 15000.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "WebSearch",
      description:
        "Search the web and return a list of relevant results (title, URL, snippet).",
      parameters: {
        type: "object",
        required: ["query"],
        properties: {
          query: {
            type: "string",
            description: "The search query string.",
          },
          num_results: {
            type: "number",
            description: "How many results to return. Defaults to 5.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ScrapeWebPage",
      description:
        "Fetch a web page and return its visible text content, stripping HTML tags.",
      parameters: {
        type: "object",
        required: ["url"],
        properties: {
          url: {
            type: "string",
            description: "URL of the page to scrape.",
          },
          include_links: {
            type: "boolean",
            description:
              "Whether to include hyperlinks found on the page. Defaults to false.",
          },
        },
      },
    },
  },

  // ─────────────────────────────────────────────
  // CODE
  // ─────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "ExecuteCode",
      description:
        "Execute a snippet of code in the specified language and return stdout, stderr, and the return value.",
      parameters: {
        type: "object",
        required: ["language", "code"],
        properties: {
          language: {
            type: "string",
            enum: ["python", "javascript", "typescript", "bash", "ruby"],
            description: "Programming language to execute the code in.",
          },
          code: {
            type: "string",
            description: "The code snippet to execute.",
          },
          timeout_ms: {
            type: "number",
            description: "Execution timeout in milliseconds. Defaults to 10000.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "GrepSearch",
      description:
        "Search for a regex pattern inside files within a directory and return matching lines with file paths and line numbers.",
      parameters: {
        type: "object",
        required: ["pattern", "directory_path"],
        properties: {
          pattern: {
            type: "string",
            description: "Regular expression pattern to search for.",
          },
          directory_path: {
            type: "string",
            description: "Directory to search in.",
          },
          file_glob: {
            type: "string",
            description:
              "Glob pattern to restrict which files are searched, e.g. '**/*.ts'. Defaults to all files.",
          },
          case_insensitive: {
            type: "boolean",
            description: "Whether the search is case-insensitive. Defaults to false.",
          },
          max_results: {
            type: "number",
            description: "Maximum number of matching lines to return. Defaults to 50.",
          },
        },
      },
    },
  },

  // ─────────────────────────────────────────────
  // MEMORY / STATE
  // ─────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "RememberFact",
      description:
        "Store a key-value fact in the agent's persistent memory for use in future steps.",
      parameters: {
        type: "object",
        required: ["key", "value"],
        properties: {
          key: {
            type: "string",
            description: "Unique identifier for the fact.",
          },
          value: {
            type: "string",
            description: "The value to store. Serialise complex objects to JSON.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "RecallFact",
      description: "Retrieve a previously stored fact from the agent's memory by key.",
      parameters: {
        type: "object",
        required: ["key"],
        properties: {
          key: {
            type: "string",
            description: "The key of the fact to retrieve.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ForgetFact",
      description: "Delete a stored fact from the agent's memory by key.",
      parameters: {
        type: "object",
        required: ["key"],
        properties: {
          key: {
            type: "string",
            description: "The key of the fact to delete.",
          },
        },
      },
    },
  },

  // ─────────────────────────────────────────────
  // TASK MANAGEMENT
  // ─────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "CreateSubtask",
      description:
        "Spawn a new subtask for the agent to complete as part of the current goal. Returns a subtask ID.",
      parameters: {
        type: "object",
        required: ["description"],
        properties: {
          description: {
            type: "string",
            description: "Clear description of what the subtask should accomplish.",
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "Priority level of the subtask. Defaults to medium.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "AskUser",
      description:
        "Pause execution and ask the user a clarifying question when the next step is ambiguous or requires human input. Returns the user's answer.",
      parameters: {
        type: "object",
        required: ["question"],
        properties: {
          question: {
            type: "string",
            description: "The question to present to the user.",
          },
          options: {
            type: "array",
            items: { type: "string" },
            description:
              "Optional list of suggested answer choices to show the user.",
          },
        },
      },
    },
  },

  // ─────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "GetDateTime",
      description:
        "Return the current date and time in the specified timezone and format.",
      parameters: {
        type: "object",
        properties: {
          timezone: {
            type: "string",
            description:
              "IANA timezone string, e.g. 'America/New_York'. Defaults to UTC.",
          },
          format: {
            type: "string",
            enum: ["iso8601", "unix_timestamp", "human_readable"],
            description: "Output format for the datetime. Defaults to iso8601.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ReadEnvironmentVariable",
      description:
        "Read the value of an environment variable. Returns null if the variable is not set.",
      parameters: {
        type: "object",
        required: ["variable_name"],
        properties: {
          variable_name: {
            type: "string",
            description: "Name of the environment variable to read.",
          },
        },
      },
    },
  },
];

export default tools;