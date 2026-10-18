/* 工場在庫管理 - 静的ファイル配信サーバー（外部パッケージ不要）
 * 起動: node server.js   （ポート変更: PORT=8080 node server.js）
 * public/ フォルダの中身だけを配信します。
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".css": "text/css; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    return res.end("Method Not Allowed");
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch (e) {
    res.writeHead(400);
    return res.end("Bad Request");
  }
  if (pathname.endsWith("/")) pathname += "index.html";

  // public/ の外へ出るアクセス（../ など）を拒否
  const filePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not Found");
    }
    const ext = path.extname(filePath).toLowerCase();
    const headers = {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Content-Length": st.size,
      "X-Content-Type-Options": "nosniff"
    };
    // 画面・manifest・Service Worker は常に最新を取得させる（古い画面が残らないように）
    if ([".html", ".json", ".webmanifest"].includes(ext) || path.basename(filePath) === "sw.js") {
      headers["Cache-Control"] = "no-cache";
    } else {
      headers["Cache-Control"] = "public, max-age=86400"; // アイコン等
    }
    if (path.basename(filePath) === "sw.js") headers["Service-Worker-Allowed"] = "/";

    res.writeHead(200, headers);
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log("在庫管理アプリを起動しました:  http://localhost:" + PORT + "/");
});
