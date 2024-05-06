// Import necessary libraries and initialize app
const express = require("express");
const axios = require("axios");
require("dotenv").config();
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

// Set up server port
const PORT = process.env.PORT || 3000;
const DEBUG = process.env.DEBUG === "true";

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Function to handle both types of completions
const handleCompletions = async (req, res) => {
  const originalUrl = req.originalUrl;

  // Debugging: Log headers and body if debug mode is on
  if (DEBUG) {
    console.log("Received headers:", req.headers);
    console.log("Received body:", req.body);
  }

  // Prepare data based on the endpoint called
  const { messages, model, stop, prompt } = req.body;
  let data = { model };
  if (originalUrl.includes("/chat")) {
    data.message = JSON.stringify(messages);
  } else {
    data.message = `system: You are professional in generating in-line code autocompletion for VS Code., prompt: ${prompt}`;
  }

  const isStream = req.body.stream;
  const headers = {
    Authorization: req.headers.authorization,
    "Content-Type": "application/json",
  };
  const config = { headers, maxBodyLength: Infinity };

  // Make the request to the Straico API
  try {
    const response = await axios.post(
      "https://api.straico.com/v0/prompt/completion",
      data,
      config
    );
    const completion = response.data.data.completion;
    handleResponse(originalUrl, completion, req, res, isStream);
  } catch (error) {
    console.error("Error making request to Straico API:", error);
    res.status(500).send("Error making request to Straico API");
  }
};

// Function to handle the response from the API
const handleResponse = (url, completion, req, res, isStream) => {
  let transformedChoices = completion.choices.map((choice, index) => {
    if (url.includes("/chat")) {
      return {
        index,
        delta: choice.message,
        finish_reason: choice.finish_reason,
      };
    } else {
      return {
        text: choice.message.content.replace(/^```.*$/gm, ""),
        finish_reason: choice.finish_reason,
      };
    }
  });

  if (isStream) {
    // Handle streaming responses
    streamResponse(req, res, transformedChoices);
  } else {
    // Handle standard responses
    res.json({ completion: transformedChoices });
  }
};

// Function to handle streaming responses
const streamResponse = (req, res, transformedChoices) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(": STRAICO-BRIDGE PROCESSING\n\n");
  const responseStructure = {
    id: undefined,
    object: "chat.completion.chunk",
    created: Date.now(),
    model: req.body.model,
    choices: transformedChoices,
  };
  const chunk = `data: ${JSON.stringify(responseStructure)}\n\n`;
  res.write(chunk);

  res.write("data: [DONE]\n\n");
  res.end();
};

// Set endpoints
app.post("/chat/completions", handleCompletions);
app.post("/completions", handleCompletions);
