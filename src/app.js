const express = require("express");
const axios = require("axios");
require("dotenv").config();
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DEBUG = process.env.DEBUG === "true";

app.listen(PORT, () => {
  if (DEBUG) {
    console.log(`Debug: Server running on port ${PORT}`);
  }
});

app.post("/chat/completions", handleCompletions);
app.post("/completions", handleCompletions);

async function handleCompletions(req, res) {
  const { messages, model, stop, prompt } = req.body;
  const originalUrl = req.originalUrl;
  const headers = {
    Authorization: req.headers.authorization,
    "Content-Type": "application/json",
  };
  const config = { headers, maxBodyLength: Infinity };
  let data = {
    model,
    message: originalUrl.includes("/chat")
      ? JSON.stringify(messages)
      : `system: Your prompt details, prompt: ${prompt}`,
  };
  if (DEBUG) {
    console.log("Debug: Starting stream for request");
  }

  // Start streaming response
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // Flush headers to start the response

  try {
    const response = await axios.post(
      "https://api.straico.com/v0/prompt/completion",
      data,
      config
    );
    const completion = response.data.data.completion;
    const transformedChoices = handleApiResponse(originalUrl, completion);

    if (DEBUG) {
      console.log("Debug: Received response from Straico API");
    }

    // Stream the transformed response
    const chunk = `data: ${JSON.stringify({
      choices: transformedChoices,
    })}\n\n`;
    res.write(chunk);

    if (DEBUG) {
      console.log("Debug: Streamed data chunk");
    }
  } catch (error) {
    console.error("Error making request to Straico API:", error);
    res.write("data: Error making request to Straico API\n\n");
  }

  res.write("data: [DONE]\n\n");
  res.end();
}

function handleApiResponse(url, completion) {
  return completion.choices.map((choice, index) => {
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
}
// // Set endpoints
// app.post("/chat/completions", handleCompletions);
// app.post("/completions", handleCompletions);

// // Function to handle streaming responses
// const streamResponse = (req, res, transformedChoices) => {
//   res.setHeader("Content-Type", "text/event-stream");
//   res.setHeader("Cache-Control", "no-cache");
//   res.setHeader("Connection", "keep-alive");

//   res.write(": STRAICO-BRIDGE PROCESSING\n\n");
//   const responseStructure = {
//     id: undefined,
//     object: "chat.completion.chunk",
//     created: Date.now(),
//     model: req.body.model,
//     choices: transformedChoices,
//   };

//   const chunk = `data: ${JSON.stringify(responseStructure)}\n\n`;

//   if (DEBUG) {
//     console.log("Debug: Sending chunk to client");
//     console.log(chunk);
//   }

//   res.write(chunk);

//   res.write("data: [DONE]\n\n");
//   res.end();
// };

// // Set endpoints
// app.post("/chat/completions", handleCompletions);
// app.post("/completions", handleCompletions);
