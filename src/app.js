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

const DEBUG = process.env.DEBUG === "true";

// if (process.env.STRAICO_API_KEY) {
//   axios
//     .get("https://api.straico.com/v0/models", {
//       headers: {
//         Authorization: `Bearer ${process.env.STRAICO_API_KEY}`,
//       },
//     })
//     .then((response) => {
//       const prettyJson = JSON.stringify(response.data, null, 2);
//       console.log("Available models:");
//       console.log(prettyJson);
//     })
//     .catch((error) => {
//       console.error("Error making GET request:", error);
//     });
// }

app.post("/chat/completions", async (req, res) => {
  // debug headers
  if (DEBUG) {
    console.log("Received headers:");
    console.log(req.headers);
    console.log("Received body:");
    console.log(req.body);
  }

  const { messages, model } = req.body;
  isStream = req.body.stream;

  if (process.env.STRAICO_API_KEY && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${process.env.STRAICO_API_KEY}`;
  }

  // Prepare headers and data for Straico API request
  const config = {
    headers: {
      Authorization: req.headers.authorization,
      "Content-Type": "application/json",
    },
    maxBodyLength: Infinity,
  };

  const data = {
    model: model,
    message: JSON.stringify(messages),
  };

  if (DEBUG) console.log("Received request with data:", data);

  let response;

  if (DEBUG) console.log("Making request to Straico API...");

  try {
    response = await axios.post(
      "https://api.straico.com/v0/prompt/completion",
      data,
      config
    );
  } catch (error) {
    console.error("Error making request to Straico API:", error);
    res.status(500).send("Error making request to Straico API");
    return;
  }

  if (DEBUG) console.log("Received response from Straico API:", response);

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
    try {
      res.write(": STRAICO-BRIDGE PROCESSING\n\n");
      if (DEBUG) console.log("Sent first chunk");
    } catch (error) {
      console.error("Error writing to response stream:", error);
      return;
    }

    for (let i = 0; i < 1; i++) {
      const responseStructure = {
        id: openAiResponse.id, // TODO: Take id from Straico response
        object: "chat.completion.chunk",
        created: Date.now(),
        model: model,
        choices: transformedChoices,
      };

      const chunk = `data: ${JSON.stringify(responseStructure)}\n\n`;
      try {
        res.write(chunk);
        if (DEBUG) console.log("Sent chunk:", chunk);
      } catch (error) {
        console.error("Error writing to response stream:", error);
        return;
      }
    }

    // Send the last chunk
    try {
      res.write("data: [DONE]\n\n");
      if (DEBUG) console.log("Sent last chunk");
    } catch (error) {
      console.error("Error writing to response stream:", error);
      return;
    }

    // End the response stream
    res.end();
  } else {
    res.json(openAiResponse);
  }
});

app.post("/completions", async (req, res) => {
  // debug headers
  if (DEBUG) {
    console.log("Received headers:");
    console.log(req.headers);
    console.log("Received body:");
    console.log(req.body);
  }

  const { model, stop, prompt } = req.body;
  isStream = req.body.stream;

  // if (process.env.STRAICO_API_KEY && !req.headers.authorization) {
  //   req.headers.authorization = `Bearer ${process.env.STRAICO_API_KEY}`;
  // }

  // Prepare headers and data for Straico API request
  const config = {
    headers: {
      Authorization: req.headers.authorization,
      "Content-Type": "application/json",
    },
    maxBodyLength: Infinity,
  };

  const data = {
    model: model,
    message: JSON.stringify(stop) + prompt,
  };

  if (DEBUG) console.log("Received request with data:", data);

  let response;

  if (DEBUG) console.log("Making request to Straico API...");

  try {
    response = await axios.post(
      "https://api.straico.com/v0/prompt/completion",
      data,
      config
    );
  } catch (error) {
    // if (DEBUG) console.error("Error making request to Straico API:", error);
    res.status(500).send("Error making request to Straico API");
    return;
  }

  if (DEBUG) console.log("Received response from Straico API:", response);

  const openAiResponse = response.data.data.completion;
  const transformedChoices = response.data.data.completion.choices.map(
    (choice, index) => {
      return {
        text: choice.message.content,
        finish_reason: choice.finish_reason,
      };
    }
  );

  if (isStream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send the first chunk
    try {
      res.write(": STRAICO-BRIDGE PROCESSING\n\n");
      if (DEBUG) console.log("Sent first chunk");
    } catch (error) {
      console.error("Error writing to response stream:", error);
      return;
    }

    for (let i = 0; i < 1; i++) {
      const responseStructure = {
        id: openAiResponse.id, // TODO: Take id from Straico response
        object: "chat.completion.chunk",
        created: Date.now(),
        model: model,
        choices: transformedChoices,
      };

      const chunk = `data: ${JSON.stringify(responseStructure)}\n\n`;
      try {
        res.write(chunk);
        if (DEBUG) console.log("Sent chunk:", chunk);
      } catch (error) {
        console.error("Error writing to response stream:", error);
        return;
      }
    }

    // Send the last chunk
    try {
      res.write("data: [DONE]\n\n");
      if (DEBUG) console.log("Sent last chunk");
    } catch (error) {
      console.error("Error writing to response stream:", error);
      return;
    }

    // End the response stream
    res.end();
  } else {
    res.json(openAiResponse);
  }
});
