# SHIFT Client Portal 2.0 — Design

**Date:** 2026-07-05
**Status:** Approved by Edwin (design), pending spec review
**Scope:** Upgrade the client portal (`SHIFT_proposals_hub.html`) from a read-only proposal viewer into a two-way portal: client file uploads to Google Drive, brand assets (logo/monogram), optional profile picture, notes threads on proposals, and email notifications to SHIFT.

---

## 1. Context

- The portal is a token-gated static page on GitHub Pages (`https://shiftevnts.com/SHIFT_proposals_hub.html`). Links are generated in `manager_v2.html` and carry `clientName|expiry|driveFolderId` signed with HMAC-SHA256 (first 32 hex chars).
- Today the Files tab only embeds a read-only Drive folder view. There are no uploads, no notes, no notifications, and no client identity beyond the name in the token.
- The site has no backend. The HMAC secret is embedded in public page source (both portal and manager), so token verification is currently forgeable by anyone who reads the source.

## 2. Decisions made

| Question | Decision |
|---|---|
| Backend | **Google Apps Script web app** in the **Produccion@5hift.com.mx** Google account — SHIFT and DJD are separate businesses; nothing portal-related touches the desijunctiondjs account (free, writes directly to the Produccion Drive, sends email natively) |
| Drive folders | **Hybrid**: use the contact's manually-pasted Drive folder if present; otherwise auto-create `SHIFT Clients/<Client Name>/` with `Uploads/` and `Brand Assets/` subfolders and remember the mapping |
| Notes | **Two-way thread** per proposal, plus one general "Event info" thread per client. Client writes in portal; Edwin replies from the manager |
| Notifications | **Email** to `ventas@5hift.com.mx` and `Produccion@5hift.com.mx` on every upload and every client note, with direct links |

## 3. Architecture

```
Client browser (portal page, GitHub Pages)
    │  fetch POST, Content-Type: text/plain (JSON body — avoids CORS preflight)
    ▼
Google Apps Script web app  (owned by Produccion@5hift.com.mx, deployed "execute as me", "anyone with link")
    ├── verifies portal token server-side (secret in Script Properties)
    ├── Google Drive        — client folders, uploads, brand assets, avatars
    ├── Google Sheet        — "SHIFT Portal Data" (Clients, Notes, Activity tabs)
    └── MailApp             — notification emails to ventas@ + Produccion@
```

The manager talks to the same web app with a separate **admin key** (also in Script Properties) for reading activity and replying to notes.

## 4. Components

### 4.1 Apps Script backend (`apps-script/portal-backend.gs`, new)

Single `doPost(e)` dispatching on `action`:

| Action | Auth | Behavior |
|---|---|---|
| `verify` | portal token | Validates HMAC + expiry server-side. Returns `{ok, clientName, expiry, profile}` — profile includes avatar/logo/monogram thumbnail URLs and Drive folder link. Portal page uses this instead of client-side HMAC, so the secret leaves public source. |
| `upload` | portal token | Body: `{filename, mimeType, dataB64, kind: file\|logo\|monogram\|avatar}`. Decodes base64, writes to the client's `Uploads/` or `Brand Assets/` subfolder (avatar also in `Brand Assets/`). For image kinds, sets link-sharing so the portal can render `drive.google.com/thumbnail?id=…`. Records to Activity tab, updates Clients tab pointers (avatar/logo/monogram file IDs), sends notification email. Returns file ID + thumbnail URL. Per-file cap ~25 MB (base64 payload limit); the portal enforces 20 MB client-side with a friendly redirect to the Drive folder for bigger files. |
| `files.list` | portal token | Lists the client's uploaded files (name, size, date, thumbnail URL for images) from the Uploads + Brand Assets folders. |
| `notes.list` | portal token | Returns thread for `{proposalId}` (proposal filename or `"general"`). |
| `notes.add` | portal token | Appends `{proposalId, text, author: "client"}` to Notes tab, sends notification email. |
| `admin.activity` | admin key | Recent uploads + notes across all clients, for the manager's activity feed. |
| `admin.reply` | admin key | Appends a SHIFT reply to a thread. |

**Storage — Google Sheet "SHIFT Portal Data"** (auto-created on first run):
- `Clients`: clientName, folderId, folderSource (manual|auto), avatarFileId, logoFileId, monogramFileId, lastSeen
- `Notes`: timestamp, clientName, proposalId, author (client|shift), text
- `Activity`: timestamp, clientName, type (upload|note), detail, fileId/link

**Folder resolution (hybrid):** on first write for a client — if the token payload carries a `driveId` (Edwin pasted a folder on the contact), use it and record `manual`; else create `SHIFT Clients/<Client Name>/` + subfolders, record `auto`. Subsequent writes reuse the recorded folder.

**Notifications:** every `upload` and `notes.add` sends one email to `ventas@5hift.com.mx, Produccion@5hift.com.mx`: subject like `📁 Palwinder Chamdal uploaded 3 files` / `💬 New note on "Indian Wedding CDMX — Sep 2026"`, body with file names/note text and direct links (Drive file, client folder). No batching in v1.

**Script Properties (set once by Edwin):** `PORTAL_SECRET` (new rotated secret), `ADMIN_KEY`, `NOTIFY_EMAILS`, optional `ROOT_FOLDER_ID`.

**Setup doc (`apps-script/SETUP.md`, new):** step-by-step with screenshots-level detail: script.new → paste → set properties → Deploy as web app (execute as me / anyone) → copy URL into manager Settings. Includes how to redeploy after edits and how to rotate keys.

### 4.2 Portal page (`SHIFT_proposals_hub.html`, modified)

- **Gate:** on load, POST `verify` with the URL token. Remove the embedded `_SK` secret and local HMAC. Keeps existing deny states (no-token / expired / invalid) plus a new "can't reach server — retry" state.
- **Profile header:** avatar (uploaded photo or initials monogram), client name, company, link expiry. Tap avatar → upload/change photo.
- **Brand assets strip:** two labeled slots — Logo and Monogram — with preview, upload/replace. Visible near the top so wedding clients see exactly where their monogram goes.
- **Files tab → Upload center:** drag-and-drop zone + tap-to-pick (multi-file), per-file progress (base64 encode + fetch), then gallery of uploaded files from `files.list` (image thumbnails, file-type icons otherwise, name/size/date). Existing Drive embed moves below as "Browse full folder" — also the documented path for files > 20 MB.
- **Notes:** each proposal card gets a "Notes" button with a note-count badge (no read/unread tracking in v1) → slide-over panel with the thread (client right-aligned, SHIFT replies left-aligned with SHIFT icon), textarea + send. A general "Event info & requests" panel lives on the main view for anything not tied to a proposal.
- **Design language:** keep the existing dark award-style aesthetic (Sora/Inter, existing Tailwind config). All new surfaces get designed hover/focus/loading/empty/error states. Mobile-first checks at 375 px — clients open these links from their phones.

### 4.3 Manager (`manager_v2.html`, modified)

- **Settings tab:** two new fields — Portal Backend URL, Admin Key (stored with existing settings persistence).
- **Portal Links tab:** "Client Activity" feed via `admin.activity` (uploads + notes, newest first), with inline reply on notes (`admin.reply`).
- **Token generation:** unchanged mechanics, but uses the new rotated `PORTAL_SECRET` (Edwin updates the constant when rotating). Old links die when the secret rotates — regenerate active client links after deploy (there is at most a handful).

## 5. Error handling

- Every backend response is `{ok: true, …}` or `{ok: false, error}`; the portal never fails silently — toast + retry affordance.
- Oversized file → pre-flight client-side check, message: "This file is over 20 MB — use the Drive folder link below to add it."
- Expired/invalid token on any action → same gate messaging as page load.
- Apps Script cold start (~1–3 s) → all actions show immediate pending UI.
- Upload partially fails in a multi-file batch → per-file status; only failed files offer retry.

## 6. Security

- Token verification moves server-side; the HMAC secret is removed from portal page source and rotated (the old one is public in git history — treat as burned).
- The manager still embeds the secret for link generation; accepted for v1 (manager URL is unlisted), noted as a future hardening item.
- Admin actions require the separate `ADMIN_KEY`, never present in portal page source.
- Uploaded files: only image kinds get link-sharing enabled (thumbnails); documents stay private to Edwin's account.
- Upload validation server-side: filename sanitized, size cap enforced, writes only inside the resolved client folder.

## 7. Testing

Manual E2E checklist (run before telling clients):
1. Generate a fresh portal link in the manager for a test contact **without** a Drive folder → open portal → folder auto-created correctly under `SHIFT Clients/`.
2. Repeat with a contact **with** a pasted Drive folder → uploads land there.
3. Upload: image, PDF, 19 MB file (passes), 25 MB file (friendly rejection).
4. Logo + monogram + avatar upload → previews render after reload and on a second device.
5. Note on a proposal → email arrives at both addresses → reply from manager → reply visible in portal thread.
6. Expired link → gate; tampered token → gate; backend URL unreachable → retry state.
7. Mobile pass at 375 px and desktop at 1440 px on portal views.

## 8. Out of scope (v1)

Client accounts/passwords, payments, e-signatures, proposal editing from the portal, WhatsApp/push notifications, notification batching/digests, moving link generation out of the manager.
