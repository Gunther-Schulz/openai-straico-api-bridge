# OpenAI Straico API Bridge

## Description

This is a simple Node.js server that acts as a bridge between the Straico API and the OpenAI API. It listens for POST requests on the `/chat/completions` endpoint and forwards them to the OpenAI API. The response is then sent back to the client.

## Configuration

To override the default settings, create a `.env` file in the root directory and add the following:

```
STRAICO_API_KEY=<YOUR_STRAICO_API_KEY>
PORT=<PORT>
DEBUG=<false|true>
```

If you don't provide the Straico API key, you will need to provide it in the request. If you do both, the request key will take precedence.
If you provide the Straico API key in the environment, a list of available modls will be printed on the console when the server starts.

Default port is 3000.
Debug is set to false by default.

## Running the server

Start Ngrok on the local machine:

```
ngrok http <PORT>
```

Start the server:

```
npm start
```

## Example request

```
curl https://1234567.ngrok.app/chat/completions -H "Content-Type: application/json" -H "Authorization: Bearer MY_STRAICO_API_KEY" -d '{
  "messages": [
    {
      "role": "system",
      "content": "You are a test assistant."
    },
    {
      "role": "user",
      "content": "Testing. Just say hi and nothing else."
    }
  ],
  "model": "openai/gpt-3.5-turbo-0125"
}'
```

## Caveats

When using Cursor.sh (and likely other apps), currently it requires Ngrok to be running on the local machine to expose the local server to the internet.

## TODO

- [ ] Create a Dockerfile
- [ ] Remove Ngrok dependency
