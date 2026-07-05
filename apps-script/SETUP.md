# Portal Backend — One-Time Setup (~5 minutes)

The portal backend is a Google Apps Script that lives in YOUR Google account.
It writes uploads into your Drive, keeps notes in a Google Sheet, and emails
ventas@5hift.com.mx + Produccion@5hift.com.mx when clients act.

## 1. Create the script
1. Open https://script.new — **log in as Produccion@5hift.com.mx**. Everything portal-related (script, client Drive folders, data sheet, notification sender) lives in that account. SHIFT ≠ DJD: never use the desijunctiondjs account for any of this.
2. Name it **SHIFT Portal Backend** (click "Untitled project" top-left).
3. Delete the placeholder code, paste ALL of `apps-script/portal-backend.gs`, save (⌘S).

## 2. Set the secrets (Script Properties)
1. Left sidebar → ⚙️ **Project Settings** → scroll to **Script Properties** → *Add script property*:
   - `PORTAL_SECRET` → a long random string. Generate one in Terminal: `openssl rand -hex 24`
   - `ADMIN_KEY` → a DIFFERENT random string: `openssl rand -hex 24`
   - `NOTIFY_EMAILS` → `ventas@5hift.com.mx,Produccion@5hift.com.mx` (optional — this is already the default)
   - `ROOT_FOLDER_ID` → (optional) a Drive folder ID if you want auto-created client
     folders somewhere specific. Leave unset to use a "SHIFT Clients" folder at My Drive root.
2. Keep both random strings — you'll paste them into the manager in step 5.

## 3. Deploy as web app
1. Top-right **Deploy → New deployment**.
2. Type: **Web app**. Description: `v1`.
3. **Execute as: Me**. **Who has access: Anyone.** (Required — clients are not logged
   into Google. Security comes from the signed link tokens, not from Google login.)
4. Click Deploy → **Authorize access** → choose your account → Advanced → Allow.
5. Copy the **Web app URL** (ends in `/exec`).
6. Sanity check: open that URL in a browser tab — you should see
   `{"ok":true,"service":"SHIFT Portal Backend",...}`.

## 4. Bake the URL into the portal page
In `SHIFT_proposals_hub.html`, find `const BACKEND_URL =` (near the top) and replace
the placeholder with your `/exec` URL. Commit + push.

## 5. Configure the manager
Manager → **Settings → Client Portal Backend**:
- Backend URL → the `/exec` URL
- Admin Key → the `ADMIN_KEY` value
- Portal Signing Secret → the `PORTAL_SECRET` value
Click **Save Portal Settings**.

## 6. Regenerate client links
Rotating the secret kills every old portal link. Go to **Portal Links**, generate a
fresh link per active client, and send them out.

## Updating the backend later
After editing the script: **Deploy → Manage deployments → ✏️ edit → Version: New version → Deploy.**
The URL stays the same. (Just saving the file does NOT update the live web app.)

## Rotating keys
Generate new values, update the Script Property AND the manager Settings field,
then regenerate client links (for `PORTAL_SECRET`) — `ADMIN_KEY` rotation needs no link changes.
Quick-quote links (`SHIFT_quick_quote.html`) use their own separate link-signer and are NOT affected by rotating `PORTAL_SECRET`.
