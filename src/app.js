const express = require("express");
const axios = require("axios");
require("dotenv").config();
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const { Readable } = require("stream");

app.post("/chat/completions", async (req, res) => {
  const { messages, model } = req.body;
  isStream = req.body.stream;

  // Prepare headers and data for Straico API request
  const config = {
    headers: {
      Authorization: `Bearer ${process.env.STRAICO_API_KEY}`,
      "Content-Type": "application/json",
    },
    maxBodyLength: Infinity,
  };

  const data = {
    model: model,
    message: JSON.stringify(messages),
  };

  const response = await axios.post(
    "https://api.straico.com/v0/prompt/completion",
    data,
    config
  );

  const openAiResponse = response.data.data.completion;
  const transformedChoices = response.data.data.completion.choices.map(
    (choice, index) => {
      return {
        index: index,
        delta: {
          role: choice.message.role,
          content: choice.message.content,
        },
        finish_reason: choice.finish_reason,
      };
    }
  );

  if (isStream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send the first chunk
    res.write(": STRAICO-BRIDGE PROCESSING\n\n");

    // Simulate streaming by sending chunks of data
    for (let i = 0; i < 1; i++) {
      const responseStructure = {
        id: openAiResponse.id, // TODO: Take id from Straico response
        object: "chat.completion.chunk",
        created: Date.now(),
        model: model,
        choices: transformedChoices,
      };

      const chunk = `data: ${JSON.stringify(responseStructure)}\n\n`;
      res.write(chunk);
    }

    // Send the last chunk
    res.write("data: [DONE]\n\n");

    // End the response stream
    res.end();
  } else {
    res.json(openAiResponse);
  }
});
