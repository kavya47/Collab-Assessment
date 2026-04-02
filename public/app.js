const state = {
  currentUserId: 1,
  users: [],
  ownedDocs: [],
  sharedDocs: [],
  currentDoc: null,
};

const userSelect = document.getElementById("userSelect");
const ownedDocsList = document.getElementById("ownedDocsList");
const sharedDocsList = document.getElementById("sharedDocsList");
const newDocBtn = document.getElementById("newDocBtn");
const docTitleInput = document.getElementById("docTitle");
const docMeta = document.getElementById("docMeta");
const editor = document.getElementById("editor");
const saveBtn = document.getElementById("saveBtn");
const shareBtn = document.getElementById("shareBtn");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const shareModal = document.getElementById("shareModal");
const shareUserSelect = document.getElementById("shareUserSelect");
const confirmShareBtn = document.getElementById("confirmShareBtn");
const closeShareModalBtn = document.getElementById("closeShareModalBtn");
const toast = document.getElementById("toast");

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.style.borderColor = isError ? "#dc2626" : "#2b3648";
  toast.style.background = isError ? "#3b0a0a" : "#111827";

  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2500);
}

function setEditorEnabled(enabled) {
  docTitleInput.disabled = !enabled;
  editor.contentEditable = enabled ? "true" : "false";
  saveBtn.disabled = !enabled;
}

function updateShareButtonState() {
  if (!state.currentDoc) {
    shareBtn.disabled = true;
    return;
  }
  shareBtn.disabled = Number(state.currentDoc.owner_id) !== Number(state.currentUserId);
}

function renderUsers() {
  userSelect.innerHTML = "";
  state.users.forEach((user) => {
    const option = document.createElement("option");
    option.value = user.id;
    option.textContent = `${user.name} (ID: ${user.id})`;
    if (Number(user.id) === Number(state.currentUserId)) option.selected = true;
    userSelect.appendChild(option);
  });
}

function renderShareUsers() {
  shareUserSelect.innerHTML = "";
  const currentOwnerId = state.currentDoc?.owner_id;
  state.users
    .filter((u) => Number(u.id) !== Number(currentOwnerId))
    .forEach((user) => {
      const option = document.createElement("option");
      option.value = user.id;
      option.textContent = user.name;
      shareUserSelect.appendChild(option);
    });
}

function docListItem(doc, type) {
  const li = document.createElement("li");
  li.className = "doc-item";
  if (state.currentDoc && Number(state.currentDoc.id) === Number(doc.id)) {
    li.classList.add("active");
  }

  const ownerName = state.users.find((u) => Number(u.id) === Number(doc.owner_id))?.name || `User ${doc.owner_id}`;

  li.innerHTML = `
    <div class="doc-item-title">${escapeHtml(doc.title || "Untitled Document")}</div>
    <div class="doc-item-meta">
      ${type === "shared" ? `Owner: ${escapeHtml(ownerName)} · ` : ""}
      Updated: ${formatDate(doc.updated_at)}
    </div>
  `;

  li.addEventListener("click", () => openDocument(doc.id));
  return li;
}

function renderDocLists() {
  ownedDocsList.innerHTML = "";
  sharedDocsList.innerHTML = "";

  if (state.ownedDocs.length === 0) {
    const empty = document.createElement("li");
    empty.className = "doc-item";
    empty.innerHTML = `<div class="doc-item-meta">No owned documents yet</div>`;
    ownedDocsList.appendChild(empty);
  } else {
    state.ownedDocs.forEach((doc) => ownedDocsList.appendChild(docListItem(doc, "owned")));
  }

  if (state.sharedDocs.length === 0) {
    const empty = document.createElement("li");
    empty.className = "doc-item";
    empty.innerHTML = `<div class="doc-item-meta">No shared documents yet</div>`;
    sharedDocsList.appendChild(empty);
  } else {
    state.sharedDocs.forEach((doc) => sharedDocsList.appendChild(docListItem(doc, "shared")));
  }
}

function clearEditor() {
  state.currentDoc = null;
  docTitleInput.value = "";
  docMeta.textContent = "Create a new document or open an existing one.";
  editor.innerHTML = "";
  setEditorEnabled(false);
  shareBtn.disabled = true;
  renderDocLists();
}

function renderCurrentDoc() {
  if (!state.currentDoc) {
    clearEditor();
    return;
  }

  docTitleInput.value = state.currentDoc.title || "";
  editor.innerHTML = state.currentDoc.content || "";
  docMeta.textContent = `Document ID: ${state.currentDoc.id} · Owner: ${
    state.users.find((u) => Number(u.id) === Number(state.currentDoc.owner_id))?.name || state.currentDoc.owner_id
  }`;
  setEditorEnabled(true);
  updateShareButtonState();
  renderDocLists();
}

function formatDate(dateValue) {
  if (!dateValue) return "N/A";
  const d = new Date(dateValue.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return dateValue;
  return d.toLocaleString();
}

function escapeHtml(str = "") {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadUsers() {
  state.users = await api("/api/users");
  renderUsers();
}

async function loadDocuments() {
  const data = await api(`/api/documents?userId=${state.currentUserId}`);
  state.ownedDocs = data.owned || [];
  state.sharedDocs = data.shared || [];

  if (state.currentDoc) {
    const allDocs = [...state.ownedDocs, ...state.sharedDocs];
    const refreshed = allDocs.find((d) => Number(d.id) === Number(state.currentDoc.id));
    if (refreshed) {
      state.currentDoc = { ...state.currentDoc, ...refreshed };
    } else {
      state.currentDoc = null;
    }
  }

  if (state.currentDoc) {
    await openDocument(state.currentDoc.id, false);
  } else {
    renderDocLists();
    clearEditor();
  }
}

async function openDocument(docId, showMessage = false) {
  try {
    const doc = await api(`/api/documents/${docId}?userId=${state.currentUserId}`);
    state.currentDoc = doc;
    renderCurrentDoc();
    if (showMessage) showToast("Document opened");
  } catch (error) {
    showToast(error.message, true);
  }
}

async function createDocument() {
  try {
    const doc = await api("/api/documents", {
      method: "POST",
      body: JSON.stringify({
        title: "New Workspace Doc",
        content: "<p></p>",
        ownerId: state.currentUserId,
      }),
    });

    await loadDocuments();
    await openDocument(doc.id);
    showToast("Document created");
  } catch (error) {
    showToast(error.message, true);
  }
}

async function saveDocument() {
  if (!state.currentDoc) {
    showToast("No document selected", true);
    return;
  }

  const title = docTitleInput.value.trim();
  if (!title) {
    showToast("Title cannot be empty", true);
    return;
  }

  try {
    const updated = await api(`/api/documents/${state.currentDoc.id}?userId=${state.currentUserId}`, {
      method: "PUT",
      body: JSON.stringify({
        title,
        content: editor.innerHTML,
        userId: state.currentUserId,
      }),
    });

    state.currentDoc = updated;
    await loadDocuments();
    renderCurrentDoc();
    showToast("Changes saved successfully");
  } catch (error) {
    showToast(error.message, true);
  }
}

async function shareDocument() {
  if (!state.currentDoc) {
    showToast("No document selected", true);
    return;
  }

  const targetUserId = Number(shareUserSelect.value);
  if (!targetUserId) {
    showToast("Select a user to share with", true);
    return;
  }

  try {
    await api(`/api/documents/${state.currentDoc.id}/share?userId=${state.currentUserId}`, {
      method: "POST",
      body: JSON.stringify({
        targetUserId,
        userId: state.currentUserId,
      }),
    });

    closeShareModal();
    showToast("Document shared successfully");
  } catch (error) {
    showToast(error.message, true);
  }
}

async function uploadFile() {
  const file = fileInput.files[0];
  if (!file) {
    showToast("Please select a .txt or .md file", true);
    return;
  }

  const ext = file.name.toLowerCase();
  if (!ext.endsWith(".txt") && !ext.endsWith(".md")) {
    showToast("Only .txt and .md files are supported", true);
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("ownerId", state.currentUserId);

  try {
    const doc = await api("/api/upload", {
      method: "POST",
      body: formData,
    });

    fileInput.value = "";
    await loadDocuments();
    await openDocument(doc.id);
    showToast("File imported as document");
  } catch (error) {
    showToast(error.message, true);
  }
}

function openShareModal() {
  if (!state.currentDoc) return;
  if (Number(state.currentDoc.owner_id) !== Number(state.currentUserId)) {
    showToast("Only the owner can share this document", true);
    return;
  }
  renderShareUsers();
  shareModal.classList.remove("hidden");
}

function closeShareModal() {
  shareModal.classList.add("hidden");
}

function applyFormat(command, value = null) {
  editor.focus();
  document.execCommand(command, false, value);
}

function wireToolbar() {
  document.querySelectorAll(".tool-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!state.currentDoc) {
        showToast("Open or create a document first", true);
        return;
      }
      const cmd = btn.dataset.cmd;
      const value = btn.dataset.value || null;
      applyFormat(cmd, value);
    });
  });
}

userSelect.addEventListener("change", async (e) => {
  state.currentUserId = Number(e.target.value);
  clearEditor();
  await loadDocuments();
});

newDocBtn.addEventListener("click", createDocument);
saveBtn.addEventListener("click", saveDocument);
shareBtn.addEventListener("click", openShareModal);
confirmShareBtn.addEventListener("click", shareDocument);
closeShareModalBtn.addEventListener("click", closeShareModal);
uploadBtn.addEventListener("click", uploadFile);

shareModal.addEventListener("click", (e) => {
  if (e.target === shareModal) closeShareModal();
});

window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    if (!saveBtn.disabled) saveDocument();
  }
});

async function init() {
  try {
    await loadUsers();
    await loadDocuments();
    wireToolbar();
    docMeta.textContent = "Create a new document or open an existing one.";
  } catch (error) {
    showToast(error.message, true);
  }
}

init();
