This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


🧭 How to Use
1) Sign in & pick a project

Sign in (Supabase Auth).

In the Projects bar (top):

Select an existing project from the dropdown, or

Type a new project name and click Create.

Use Refresh ↻ if you don’t see a newly created project yet.

Delete Project removes the project and all its files (disabled until a project is selected).

ℹ️ Many actions require a project to be selected first.

2) Upload images

Use the dropzone to drag & drop images, or click it to open the file picker.

The hidden file input is also triggered by the Upload control in the toolbar (if present).

Images are stored in your Supabase Storage bucket (NEXT_PUBLIC_SUPABASE_BUCKET) and listed in the gallery for the current project.

3) Work with captions

Each image card has a Caption field you can edit directly.

Click inside a caption to place the caret; your caret/focus is remembered.

Multi‑select: Use the checkbox on each card to select multiple images. Selected images show a highlighted border (on supported browsers).

Insert tokens into captions:

Click a token in the sidebar to insert it at the current caret position of the focused caption.

If you have selected images, the token will be appended to each selected caption.

4) Manage tokens (per‑project)

Tokens are reusable snippets you can inject into captions.

In the Sidebar Tokens:

Type a token and click Add, or press Enter.

Add multiple at once: separate with commas, semicolons, or new lines
e.g., car, red door; truck → creates 3 tokens.

Delete removes the token from this project.

Clicking a token inserts it into captions (see above).

✅ Tokens are saved to the database per project (table project_tokens). Switching projects loads that project’s tokens.

5) Toolbar actions (batch tools)

⬇️ Download ZIP
Downloads a zip of the project’s images and (optionally) captions/metadata (depending on your implementation).

✏️ Rename
Opens a flow to batch‑rename files. You can use patterns (e.g., prefixes, counters) depending on your implementation.

🧹 Duplicates
Runs a duplicate detection pass (implementation typically hashes images and flags identical ones). You’ll be prompted to keep/remove.

🔑 Add Prefix
Prompts for a string and adds it to all captions in the current project.

If you want “selected only” behavior, first select cards; otherwise the default is all.

🔁 Replace
Search & replace text in captions across the project (or only selected images if your flow supports it).

6) Select, reorder, and preview

Select images: Use the checkbox on each card. Many actions (token insert, replace, rename) can target the selection if present.

Reorder (drag & drop):

Drag a card and hover it above another to reorder visually.

Drop to commit the new order.

If your DB has a sort_index column on images, order is persisted; otherwise it remains local and you’ll see a status hint.

Preview modal: Click an image to open a larger preview. Press Esc or the close button to exit.

7) Status bar & messages

A small status text (top left of the Projects bar) shows quick feedback:

“Token added to 3 caption(s)”

“Order saved” / “Reordered (local only)”

“Select a project first”

Errors from Supabase (e.g., network, auth, RLS policies) are surfaced here as well.

⌨️ Shortcuts (optional but recommended)

If you enable them, typical shortcuts could be:

Enter in the token input → Add token(s).

Esc → close Preview.

Cmd/Ctrl + A in gallery → select all (if you implement it).

Cmd/Ctrl + Z → undo last caption edit (browser default).

(Adjust this list to reflect your actual keybindings.)

⚙️ Configuration & Persistence

Auth: Supabase Auth manages sessions. Signed‑in email is shown in the header; Sign Out clears local Supabase keys and redirects to /.

Projects & Images:

projects table owns a project (id, name, user_id, created_at).

images table stores each image row (id, project_id, caption, sort_index, etc.).

Tokens:

Stored in project_tokens with unique (project_id, value).

Loaded/saved automatically when you add/delete tokens in the sidebar.

RLS: Ensure Row Level Security policies allow the current user to select/insert/delete their rows. If projects are shared, adapt policies accordingly.

🧪 Typical flows

Add multiple tokens at once

In Sidebar, type: car, red door; truck

Click Add → 3 tokens appear.

Click truck → it inserts into the focused caption or all selected captions.

Prefix all captions

Make sure a project is selected.

Click 🔑 Add Prefix → enter High Quality.

All captions get High Quality prepended (persisted to DB).

Insert token into a selection

Select 4–5 cards using their checkboxes.

Click a token in the sidebar.

That token is appended to all 4–5 selected captions.

Find duplicates

Click 🧹 Duplicates.

The app computes matches and offers to remove/keep (UI may vary).

Confirm → duplicate images are removed from project and storage.

🧰 Troubleshooting

Buttons/inputs look white or “native”:
Ensure app/globals.css contains the .ui-bar, .ui-btn, .ui-input, .ui-select rules and is imported in app/layout.js.

Tokens don’t save:

Check project_tokens RLS policies.

Make sure you have a projectId selected.

Open DevTools → Network → check Supabase responses for errors.

Reorder not persisting:
Add a numeric sort_index column to images and ensure the update query runs without RLS blocking it.

Not seeing new projects/images:
Use Refresh ↻ in the Projects bar or reload the page. Confirm Supabase Storage bucket is set in .env.local.
