# OpenAI Straico API Bridge

## Caveats

Currently it requires Ngrok to be running on the local machine to expose the local server to the internet.

## Configuration

Create a `.env` file in the root directory and add the following:

```
PORT=<PORT>
DEBUG=<false|true>
```

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

Use it for Cursor.ai

## TODO

- [ ] Create a Dockerfile
- [ ] Remove Ngrok dependency
- [ ] Use key provided by Cursor.sh

## Notes

authorization: 'Bearer <StraicoKey>',
