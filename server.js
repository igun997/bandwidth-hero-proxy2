const http = require("http");
const { handler } = require("./functions/index");

const PORT = process.env.PORT || 3000;

function createEvent(req) {
  const baseUrl = `http://${req.headers.host || "localhost"}`;
  const parsed = new URL(req.url, baseUrl);
  const queryStringParameters = Object.fromEntries(parsed.searchParams.entries());

  return {
    httpMethod: req.method,
    path: parsed.pathname,
    headers: req.headers,
    queryStringParameters,
    rawQuery: parsed.searchParams.toString(),
    ip: req.socket.remoteAddress,
  };
}

function send(res, response) {
  res.statusCode = response.statusCode || 200;

  for (const [key, value] of Object.entries(response.headers || {})) {
    if (value !== undefined) {
      res.setHeader(key, value);
    }
  }

  if (response.isBase64Encoded) {
    res.end(Buffer.from(response.body || "", "base64"));
    return;
  }

  res.end(response.body || "");
}

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname;

  if (pathname !== "/" && pathname !== "/api/index" && pathname !== "/api/index/") {
    res.statusCode = 404;
    res.end("Not Found");
    return;
  }

  try {
    const response = await handler(createEvent(req));
    send(res, response);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end(err.message || "Internal Server Error");
  }
});

server.listen(PORT, () => {
  console.log(`Bandwidth Hero proxy listening on ${PORT}`);
});
