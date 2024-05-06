const cors = require("cors");
const express = require("express");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DEBUG = process.env.DEBUG === "true";

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Function to handle completions for both chat and regular completions
const handleCompletions = async (req, res) => {
  const originalUrl = req.originalUrl;
  const stopWords = [
    "\n",
    "\n\n",
    "\r\n\r\n",
    "/src/",
    "#- coding: utf-8",
    "```",
    "function",
    "class",
    "module",
    "export",
    "import",
  ];

  if (DEBUG) {
    console.log("Received headers:", req.headers);
    console.log("Received body:", req.body);
  }

  // Prepare data for Straico API request based on the endpoint
  const { model, ...rest } = req.body;
  let data;

  if (originalUrl === "/chat/completions") {
    const { messages } = rest;
    data = {
      model,
      message: JSON.stringify(messages),
    };
  } else {
    const { prompt } = rest;
    data = {
      model,
      message: `system: You are professional in generating in-line code autocompletion for VS Code. Never use these strings in your response:${JSON.stringify(
        stopWords[0]
      )}, prompt:${prompt}`,
    };
  }

  const isStream = req.body.stream;

  // Prepare headers and config for Straico API request
  const config = {
    headers: {
      Authorization: req.headers.authorization,
      "Content-Type": "application/json",
    },
    maxBodyLength: Infinity,
  };

  if (DEBUG) console.log("Received request with data:", data);

  try {
    const response = await axios.post(
      "https://api.straico.com/v0/prompt/completion",
      data,
      config
    );

    const { completion } = response.data.data;
    let transformedChoices;

    if (originalUrl === "/chat/completions") {
      transformedChoices = completion.choices.map((choice, index) => ({
        index,
        delta: {
          role: choice.message.role,
          content: choice.message.content,
        },
        finish_reason: choice.finish_reason,
      }));
    } else {
      transformedChoices = completion.choices.map((choice) => ({
        text: choice.message.content.replace(/^```.*$/gm, ""),
        finish_reason: choice.finish_reason,
      }));
    }

    // Handle streaming response
    if (isStream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write(": STRAICO-BRIDGE PROCESSING\n\n");

      const responseStructure = {
        id: completion.id, // TODO: Take id from Straico response
        object: "chat.completion.chunk",
        created: Date.now(),
        model,
        choices: transformedChoices,
      };

      const chunk = `data: ${JSON.stringify(responseStructure)}\n\n`;
      res.write(chunk);

      res.write("data: [DONE]\n\n");
      res.end();
    } else {
      // Send regular JSON response
      res.json(completion);
    }
  } catch (error) {
    console.error("Error making request to Straico API:", error);
    res.status(500).send("Error making request to Straico API");
  }
};

app.post("/chat/completions", handleCompletions);
app.post("/completions", handleCompletions);
