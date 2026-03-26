# Randomizer Wheel

A lightweight, self-contained “Wheel of Prompts” web app, initially to be used for The Randomizer by Peter Overzet.

## What it does
- Lets you create a wheel from prompts (`name`, `description`, optional `link`).
- Users can spin the wheel to select a prompt.
- The selected prompt is shown in a popup after the spin.
- The selected prompt is removed from the wheel and added to a **Used Prompts** history.
- After each selection, you can record an **outcome**:
  - `Success` (green)
  - `Fail` (red)
- Optional **guest image** upload replaces the center “SPIN” circle.

No server or build step is required. Everything runs in the browser.

## Files
- `index.html` - page layout
- `styles.css` - styling / wheel look
- `app.js` - wheel logic (spin, selection, rendering, uploads)

## Local run
From the `randomizer-wheel` folder:

```powershell
cd C:\Users\Owner\.cursor-tutor\randomizer-wheel
python -m http.server 8000
```

Open:
- `http://localhost:8000`

## How to add prompts

### Option A: Manual add
Use the left “Prompts” form:
- Name
- Description
- Link (optional)
- Add Prompt

### Option B: Paste (bulk)
In **Paste prompts (bulk)**, paste one prompt per line:

`name | description | link`

The delimiter can also be a tab (best for copy/paste from spreadsheets).

Examples (one per line):
- `Hot Seat | Answer chat questions for 2 minutes | https://example.com`
- `Story Time | Tell a fun story from your past`

### Option C: Upload file

#### JSON
Upload a JSON array of prompts:

```json
[
  { "name": "Hot Seat", "description": "Answer chat questions for 2 minutes", "link": "https://example.com" }
]
```

#### CSV
CSV headers must include at least:
- `name`
- `description`

Optional:
- `link`

Example header row:
- `name,description,link`

## Spin + Used Prompts
- Spin chooses a prompt from the remaining wheel.
- After selection:
  - the prompt appears in a popup
  - the prompt is added to **Used Prompts**
  - it is removed from the wheel
- Used prompt entries show:
  - `Prompt Name: Success/Fail`

## Guest image
In the left “Prompts” panel you can upload:
- **Guest image (optional)**

If an image is uploaded, the center wheel circle is replaced with your image.

## Publish online (no backend)
Since it’s pure static frontend, you can deploy the folder using:
- GitHub Pages
- Netlify
- Cloudflare Pages
- Vercel (static)

You just need to host `index.html`, `styles.css`, and `app.js` at the site root (or update paths accordingly).

## Notes / limitations
- The app uses browser-side processing. Uploaded images and pasted content stay in the current session (no database).
- If you add many prompts, slice text may overlap depending on your font/viewport size.
