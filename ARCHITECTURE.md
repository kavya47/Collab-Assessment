# Architecture Note – Collaborative Document Workspace (MVP)

## Overview

This system was designed as a lightweight internal productivity tool that supports document creation, editing, file ingestion, sharing, and persistence.

The primary goal was to deliver the strongest working MVP under a constrained scope, with clear prioritization and full-stack completeness rather than overbuilding advanced collaboration features.

## What Was Prioritized

The implementation prioritized the following capabilities first:

1. **Document lifecycle**
   - Create
   - Rename
   - Edit
   - Save
   - Reopen

2. **Persistence**
   - Documents remain available after refresh
   - Shared access remains demonstrable after refresh

3. **Simple sharing**
   - Owner-based sharing model
   - Visible owned vs shared distinction

4. **File workflow**
   - `.txt` and `.md` upload into the document flow

This prioritization ensured that the product delivered a complete and usable end-to-end workflow before adding more complex enhancements.

## Architecture Summary

### Frontend
The frontend is a lightweight browser-based UI built with:
- HTML
- CSS
- Vanilla JavaScript

Responsibilities:
- render owned and shared document lists
- support document creation and selection
- provide editable document surface
- expose formatting controls
- support sharing and file upload actions

### Backend
The backend is built with:
- Node.js
- Express.js

Responsibilities:
- document CRUD APIs
- sharing logic
- file upload handling
- validation and error handling
- document access enforcement

### Database
Persistence is handled with SQLite.

Core entities:
- `users`
- `documents`
- `permissions`

This keeps the persistence model simple, portable, and easy to demo locally.

## Data Model

### Users
Represents seeded users for lightweight sharing demonstration.

### Documents
Stores:
- title
- content
- owner
- timestamps

### Permissions
Stores shared access mappings between:
- document
- user

This provides a simple but functional ownership + access model.

## Rich Text Editing Approach

The editor uses a browser-native `contenteditable` surface with formatting commands.

Why this was chosen:
- fastest path to a usable browser editor
- sufficient for MVP formatting requirements
- avoids introducing heavy editor dependencies too early

Tradeoff:
- not as robust as modern structured editors such as TipTap, Slate, or ProseMirror
- formatting control is adequate for MVP, but not ideal for long-term product scalability

## File Handling Approach

Supported file types:
- `.txt`
- `.md`

Behavior:
- uploaded file content is read on the backend
- file content becomes a newly created document

Why this was chosen:
- product-relevant workflow
- fast to implement
- avoids the complexity of `.docx` parsing

Tradeoff:
- limited file support
- `.docx` intentionally excluded from MVP

## Sharing Model

The sharing model is intentionally simple:

- each document has a single owner
- owner can grant another seeded user access
- shared documents appear separately in the UI

Why this was chosen:
- demonstrates collaboration intent clearly
- satisfies assessment requirements
- avoids enterprise-grade ACL complexity

Tradeoff:
- no editor/viewer role distinction
- no revocation UI
- no advanced permission hierarchy

## Validation and Error Handling

Basic validation was included for:
- empty document titles
- invalid user selection
- invalid share target
- unsupported file types
- unauthorized document access

This was prioritized to ensure the MVP behaves predictably during demo flows.

## Test Strategy

Automated tests were included around core API behavior:
- successful document creation
- failed document creation without title
- successful document sharing

Why this was prioritized:
- verifies critical product flows
- demonstrates engineering discipline within scope
- keeps test implementation proportional to time constraints

## Key Tradeoffs

### Chosen
- simple client-server architecture
- SQLite for local persistence
- seeded users instead of full auth
- limited file support
- single-owner sharing model

### Deferred
- real-time collaboration
- comments
- version history
- `.docx` import
- structured editor framework
- enterprise-grade permissions

These were intentionally deferred to preserve delivery quality on the critical path.

## Why This Architecture Fits the Scope

This architecture fits the scope because it:
- delivers all prioritized capabilities end-to-end
- stays easy to run locally
- keeps logic understandable and demo-friendly
- provides a clean base for future extensibility

The design reflects deliberate product and engineering tradeoffs rather than attempting to imitate Google Docs at full complexity.
