import http from "node:http";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";

const PORT = 3000;

const database = [
  { name: "Apple", description: "A fruit and technology company" },
  { name: "Application", description: "A program or software application" },
  { name: "App", description: "A software application" },
  { name: "Apricot", description: "A small orange fruit" },
  { name: "Banana", description: "A yellow fruit" },
  { name: "Cat", description: "A common domestic animal" },
  { name: "Car", description: "A road vehicle" },
  { name: "Camera", description: "A device for taking photographs" }
];

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/") {
    return sendFile(res, "index.html", "text/html; charset=utf-8");
  }

  if (url.pathname === "/app.js") {
    return sendFile(res, "app.js", "text/javascript; charset=utf-8");
  }

  if (url.pathname === "/api/search") {
    const query = (url.searchParams.get("q") || "").toLowerCase();

    // Deliberately variable latency.
    // Longer queries respond faster, making the race easy to reproduce
    // if requests are not cancelled/ordered correctly.
    const delay = Math.max(50, 700 - query.length * 150);

    await sleep(delay);

    const results = database.filter(item =>
      item.name.toLowerCase().includes(query)
    );

    res.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    });

    return res.end(JSON.stringify({
      query,
      delay,
      results
    }));
  }

  res.writeHead(404);
  res.end("Not found");
});

async function sendFile(res, filename, contentType) {
  try {
    const content = await readFile(new URL(filename, import.meta.url));
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  } catch {
    res.writeHead(500);
    res.end("Server error");
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

server.listen(PORT, () => {
  console.log(`Search demo running at http://localhost:${PORT}`);
});
