require("dotenv").config();
const axios = require("axios");

const prompt =
  'Translate the following text to French: "{\\"text\\": \\"Hello, world!\\"}"';
const model = "gpt-3.5-turbo";

axios({
  method: "post",
  url: "https://openrouter.ai/api/v1/chat/completions",
  data: {
    model,
    messages: [
      {
        content: "You are a translator.",
        role: "system",
      },
      {
        content: "The world is beautiful.",
        role: "user",
        name: "potential_context",
      },
      {
        content: "Hello sweety!",
        role: "user",
      },
    ],
    max_tokens: 990,
    temperature: 0,
    user: "github|user_01HW5RB62EWNR55HXTFERCDAPK",
    stream: true,
  },
  headers: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
  },
  responseType: "stream",
})
  .then((response) => {
    let finalText = "";

    response.data.on("data", (chunk) => {
      const chunkStr = chunk.toString();
      console.log("Received chunk: ", chunkStr);
      // if (chunkStr.trim().startsWith("{")) {
      //   const data = JSON.parse(chunkStr);
      //   finalText += data.choices[0]["text"];
      //   console.log("Received chunk: ", data.choices[0]["text"]);
      // }
    });

    response.data.on("end", () => {
      console.log("Stream ended");
      console.log("Final text: ", finalText);
    });
  })
  .catch((error) => {
    console.error(error);
  });
