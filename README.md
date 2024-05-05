# OpenAI Straico API Bridge

## Caveats

Currently it requires Ngrok to be running on the local machine to expose the local server to the internet.

## Configuration

Create a `.env` file in the root directory and add the following:

```
PORT=<PORT>
STRATIO_API_KEY=<YOUR_API_KEY>
```

Default port is 3000.

## Running the server

Start Ngrok on the local machine:

```
ngrok http <PORT>
```

Start the server:

```
npm start
```

## Usecases

Use it for Cursor.ai

## TODO

- [ ] Create a Dockerfile
- [ ] Remove Ngrok dependency
