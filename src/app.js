const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { run, get, all } = require("./db");

const app = express();

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "public")));

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  dest: uploadsDir,
  fileFilter: (req, file, cb) => {
    const allowed = [".txt", ".md"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error("Only .txt and .md files are supported"));
    }
    cb(null, true);
  },
});

function parseUserId(req, res) {
  const userId = Number(req.query.userId || req.body.userId || 1);
  if (!userId || ![1, 2].includes(userId)) {
    res.status(400).json({ error: "Invalid userId. Use 1 or 2." });
    return null;
  }
  return userId;
}

async function canAccessDocument(documentId, userId) {
  const owned = await get(
    `SELECT id FROM documents WHERE id = ? AND owner_id = ?`,
    [documentId, userId]
  );
  if (owned) return true;

  const shared = await get(
    `SELECT id FROM permissions WHERE document_id = ? AND user_id = ?`,
    [documentId, userId]
  );
  return !!shared;
}

app.get("/api/health", async (req, res) => {
  res.json({ ok: true });
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await all(`SELECT id, name FROM users ORDER BY id`);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to load users" });
  }
});

app.get("/api/documents", async (req, res) => {
  try {
    const userId = parseUserId(req, res);
    if (!userId) return;

    const owned = await all(
      `SELECT id, title, content, owner_id, created_at, updated_at
       FROM documents
       WHERE owner_id = ?
       ORDER BY updated_at DESC`,
      [userId]
    );

    const shared = await all(
      `SELECT d.id, d.title, d.content, d.owner_id, d.created_at, d.updated_at
       FROM documents d
       INNER JOIN permissions p ON d.id = p.document_id
       WHERE p.user_id = ?
       ORDER BY d.updated_at DESC`,
      [userId]
    );

    res.json({ owned, shared });
  } catch (err) {
    res.status(500).json({ error: "Failed to load documents" });
  }
});

app.get("/api/documents/:id", async (req, res) => {
  try {
    const userId = parseUserId(req, res);
    if (!userId) return;

    const docId = Number(req.params.id);
    if (!docId) {
      return res.status(400).json({ error: "Invalid document id" });
    }

    const hasAccess = await canAccessDocument(docId, userId);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const doc = await get(
      `SELECT id, title, content, owner_id, created_at, updated_at
       FROM documents
       WHERE id = ?`,
      [docId]
    );

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: "Failed to load document" });
  }
});

app.post("/api/documents", async (req, res) => {
  try {
    const { title, content = "", ownerId = 1 } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    const result = await run(
      `INSERT INTO documents (title, content, owner_id)
       VALUES (?, ?, ?)`,
      [title.trim(), content, Number(ownerId)]
    );

    const doc = await get(
      `SELECT id, title, content, owner_id, created_at, updated_at
       FROM documents
       WHERE id = ?`,
      [result.lastID]
    );

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: "Failed to create document" });
  }
});

app.put("/api/documents/:id", async (req, res) => {
  try {
    const userId = parseUserId(req, res);
    if (!userId) return;

    const docId = Number(req.params.id);
    const { title, content } = req.body;

    if (!docId) {
      return res.status(400).json({ error: "Invalid document id" });
    }

    const hasAccess = await canAccessDocument(docId, userId);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const existing = await get(`SELECT * FROM documents WHERE id = ?`, [docId]);
    if (!existing) {
      return res.status(404).json({ error: "Document not found" });
    }

    const nextTitle =
      typeof title === "string" && title.trim() ? title.trim() : existing.title;
    const nextContent =
      typeof content === "string" ? content : existing.content;

    await run(
      `UPDATE documents
       SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nextTitle, nextContent, docId]
    );

    const updated = await get(
      `SELECT id, title, content, owner_id, created_at, updated_at
       FROM documents
       WHERE id = ?`,
      [docId]
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update document" });
  }
});

app.post("/api/documents/:id/share", async (req, res) => {
  try {
    const ownerId = parseUserId(req, res);
    if (!ownerId) return;

    const docId = Number(req.params.id);
    const { targetUserId } = req.body;

    if (!docId) {
      return res.status(400).json({ error: "Invalid document id" });
    }

    if (!targetUserId || ![1, 2].includes(Number(targetUserId))) {
      return res.status(400).json({ error: "Invalid target user" });
    }

    const doc = await get(`SELECT * FROM documents WHERE id = ?`, [docId]);
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (doc.owner_id !== ownerId) {
      return res.status(403).json({ error: "Only owner can share document" });
    }

    if (Number(targetUserId) === ownerId) {
      return res.status(400).json({ error: "Owner already has access" });
    }

    await run(
      `INSERT OR IGNORE INTO permissions (document_id, user_id)
       VALUES (?, ?)`,
      [docId, Number(targetUserId)]
    );

    res.json({ success: true, message: "Document shared successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to share document" });
  }
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const ownerId = Number(req.body.ownerId || 1);

    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    const rawContent = fs.readFileSync(req.file.path, "utf-8");
    const originalName = req.file.originalname;
    const baseTitle = path.basename(
      originalName,
      path.extname(originalName)
    );

    const result = await run(
      `INSERT INTO documents (title, content, owner_id)
       VALUES (?, ?, ?)`,
      [baseTitle || "Imported Document", rawContent, ownerId]
    );

    fs.unlinkSync(req.file.path);

    const doc = await get(
      `SELECT id, title, content, owner_id, created_at, updated_at
       FROM documents
       WHERE id = ?`,
      [result.lastID]
    );

    res.status(201).json(doc);
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ error: err.message || "File upload failed" });
  }
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message || "Internal server error" });
});

module.exports = app;
