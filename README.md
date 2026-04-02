# Collaborative Document Workspace (MVP)

A lightweight full-stack collaborative document editor inspired by Google Docs, built to demonstrate strong product judgment, full-stack capability, and clear prioritization under time constraints.

## What This App Supports

### Core Capabilities
- Create a new document
- Rename a document
- Edit document content in the browser
- Save and reopen documents
- Basic rich-text formatting:
  - Bold
  - Italic
  - Underline
  - Headings
  - Bulleted lists
  - Numbered lists

### File Handling
- Upload `.txt` or `.md` files
- Imported file becomes a new editable document

> `.docx` is intentionally excluded in this MVP to keep the file ingestion flow reliable within scope.

### Sharing
- Each document has an owner
- Owner can share a document with another seeded user
- UI clearly separates:
  - Owned documents
  - Shared documents

### Persistence
- Documents persist after refresh
- Shared access persists after refresh
- Formatting/content is stored and reopened successfully

## Tech Stack

### Frontend
- HTML
- CSS
- Vanilla JavaScript
- `contenteditable` editor with formatting toolbar

### Backend
- Node.js
- Express.js
- Multer for file uploads

### Database
- SQLite3

### Testing
- Jest
- Supertest

## Project Structure

```text
collab-docs-app/
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── src/
│   ├── app.js
│   └── db.js
├── tests/
│   └── api.test.js
├── uploads/
├── server.js
├── package.json
├── render.yaml
├── README.md
└── ARCHITECTURE.md
```

## Seeded Users

This app uses a lightweight seeded-user model to keep sharing demonstrable without building a full authentication system.

- Alex (ID: 1)
- Priya (ID: 2)

Use the user selector in the UI to switch between them.

## Setup Instructions

### 1. Open the project
```bash
cd collab-docs-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the application
```bash
npm start
```

### 4. Open in browser
```bash
http://localhost:3000
```

## Run Tests

```bash
npm test
```

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/users` | List seeded users |
| GET | `/api/documents?userId=1` | Load owned + shared docs |
| GET | `/api/documents/:id?userId=1` | Open a document |
| POST | `/api/documents` | Create a document |
| PUT | `/api/documents/:id?userId=1` | Save / rename document |
| POST | `/api/documents/:id/share?userId=1` | Share a document |
| POST | `/api/upload` | Upload `.txt` / `.md` file |

## How to Demo the App

### Flow 1: Create and Edit
1. Select **Alex**
2. Click **New Document**
3. Rename the document
4. Add content in the editor
5. Apply formatting using the toolbar
6. Click **Save**
7. Refresh the page and reopen the document

### Flow 2: File Upload
1. Select **Alex**
2. Choose a `.txt` or `.md` file
3. Click **Upload as Document**
4. Confirm it appears in owned documents and opens in editor

### Flow 3: Sharing
1. Select **Alex**
2. Open an owned document
3. Click **Share**
4. Share with **Priya**
5. Switch active user to **Priya**
6. Confirm the document appears under **Shared With Me**

## Validation and Error Handling

This MVP includes:
- empty title validation
- invalid `userId` validation
- invalid share target validation
- owner-only sharing enforcement
- unsupported file type validation
- access control check for shared documents
- generic API error handling

## Automated Test Coverage

Included:
- document creation success
- document creation validation failure
- document sharing success

This was prioritized to ensure meaningful automated coverage around critical product flows.

## Architecture Summary

The application follows a simple client-server architecture:

- **Frontend** handles editor interactions, document list rendering, upload UI, and sharing UI
- **Backend** handles document CRUD, sharing logic, file ingestion, and validation
- **SQLite** persists users, documents, and access mappings

This structure was chosen to optimize for:
- fast delivery
- easy local setup
- straightforward debugging
- clear extensibility

## Key Product / Engineering Tradeoffs

### Prioritized
- complete end-to-end document lifecycle
- simple sharing workflow
- persistent storage
- usable editing experience

### Deferred
- real-time collaboration
- version history
- comments
- granular roles/permissions
- `.docx` support

These were intentionally deferred to keep the MVP reliable and complete within the timebox.

## Deployment

This project can be deployed easily on Render using the included `render.yaml`.

### Render Quick Steps
1. Push this project to GitHub
2. Create a new Web Service in Render
3. Connect the repository
4. Deploy using:
   - Build Command: `npm install`
   - Start Command: `npm start`

> Note: This deployment uses SQLite for simplicity. In cloud environments with ephemeral storage, document data may reset after redeploy or restart. For production readiness, the next step would be migrating persistence to Postgres or Supabase.

## Future Improvements
- Replace `contenteditable` + `execCommand` with TipTap or Slate
- Add real authentication
- Add viewer/editor roles
- Add real-time collaboration
- Add document version history
- Add `.docx` import support
- Add richer automated test coverage
- Add a production-grade database

## Notes
This project is intentionally scoped as a practical MVP and not a full Google Docs clone. The focus is on demonstrating prioritization, product judgment, and working full-stack delivery.
