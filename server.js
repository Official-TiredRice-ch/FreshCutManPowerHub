import express from "express";
import path from "path";

const app = express();
const __dirname = path.resolve();

const SUPABASE_DOMAIN = "https://hunsymrayonkonkyzvot.supabase.co";
const GOOGLE_ACCOUNTS = "https://accounts.google.com";
const GOOGLE_APIS = "https://apis.google.com";
const FONTS = "https://fonts.googleapis.com";
const FONTS_STATIC = "https://fonts.gstatic.com";

const csp = [
  `default-src 'self' ${SUPABASE_DOMAIN} ${GOOGLE_ACCOUNTS}`,
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${SUPABASE_DOMAIN} ${GOOGLE_ACCOUNTS} ${GOOGLE_APIS}`,
  `style-src 'self' 'unsafe-inline' ${FONTS}`,
  `img-src 'self' data: blob: ${SUPABASE_DOMAIN} ${GOOGLE_ACCOUNTS}`,
  `font-src 'self' ${FONTS_STATIC}`,
  `connect-src 'self' ${SUPABASE_DOMAIN} ${SUPABASE_DOMAIN.replace("https://", "wss://")}`,
  `frame-src 'self' ${SUPABASE_DOMAIN} ${GOOGLE_ACCOUNTS}`,
  "frame-ancestors 'self'",
].join("; ");

// Middleware to parse JSON
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", csp);
  next();
});

// --- Example API route ---
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

// --- 404 handler for API routes ---
app.use(/^\/api\//, (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// --- Serve frontend (React build) ---
app.use(express.static(path.join(__dirname, "dist")));

// --- Catch-all route for React Router ---
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
