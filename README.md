# AI Chat App

A starter chat app you can make your own. Powered by Google Gemini, deployed to Vercel.

---

## What you'll do

1. Get a free Gemini API key.
2. Make your own copy of this repo from a template.
3. Open it in GitHub Codespaces.
4. Customize the look and the AI's personality.
5. Connect Vercel and deploy. You'll have a real, public URL.

Total time: ~15 minutes the first time.

---

## 1. Get a Gemini API key (free)

Go to **<https://aistudio.google.com/apikey>** → click **"Create API key"** → copy the key.

> **Important:** The key copies silently. Paste it into a Notes app right away so you don't lose it.

You will not be charged. The free tier is generous.

---

## 2. Make your own copy of this repo

On this repo's GitHub page, click the green **"Use this template"** button → **"Create a new repository"**. Name it whatever you want (e.g. `my-chat-app`).

> **Don't click "Fork."** Use Template gives you a clean, independent repo. Fork links it to the original.

---

## 3. Open it in Codespaces

On _your_ new repo:

- Click the green **Code** button → **Codespaces** tab → **Create codespace on main**.
- Wait ~2 minutes for VS Code to load in your browser.

---

## 4. Add your API key

In the Codespaces terminal:

```bash
cp .env.example .env
```

Open `.env` (left sidebar). Paste your key after `GEMINI_API_KEY=`. **No quotes. No spaces.**

```
GEMINI_API_KEY=AIzaSyAbc...your...key...here
```

Save the file.

---

## 5. Run it locally

First, install the project's dependencies (only needed once per codespace):

```bash
npm install
```

Then start the dev server:

```bash
npm run dev
```

A popup appears in the bottom-right with a preview URL. Click **"Open in Browser"**. You should see your chat app. Send a message — the AI replies, streaming word-by-word.

> Stuck on the popup? Click the **Ports** tab in the bottom panel, find port 3000, hover and click the globe icon.

---

## 6. Make it yours

### Change the colors

Open **`public/styles.css`**. The first ~20 lines are the theme:

```css
:root {
  --bg: #0a0a0a;
  --accent: #3b82f6;
  /* ...etc */
}
```

Change the values, save the file, then refresh your browser to see the change.

> **Pro tip:** Open GitHub Copilot Chat in Codespaces and ask:
> _"In styles.css, change the theme to a sunset gradient with orange and purple."_

### Change the AI's personality

Open **`api/chat.js`**. Near the top:

```js
const SYSTEM_PROMPT =
  "You are a friendly, helpful assistant. Keep answers concise unless asked otherwise.";
```

Change it. Examples:

- `"You are a sarcastic pirate. End every sentence with 'arrr'."`
- `"You are an aviation expert. Relate every answer to airplanes."`
- `"You are a calm yoga instructor. Begin every reply with a deep breath."`

Save and restart the dev server (Ctrl-C, then `npm run dev`).

### Change the title and welcome message

Open **`public/index.html`**. Look for the comment that says "CHANGE THE TEXT BELOW." Edit the title, subtitle, and the AI's first greeting.

---

## 7. Deploy to the internet (Vercel)

You only do this part **once per project**:

1. Go to **<https://vercel.com>** and sign in with your GitHub account.
2. Click **"Add New..."** → **"Project"**.
3. Find your repo in the list → click **"Import"**.
4. Expand **"Environment Variables"**. Add:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** _(paste your Gemini key)_
5. Click **"Deploy"**.

A minute later, you have a live URL like `my-chat-app.vercel.app`. **Share it.**

---

## 8. Make changes and re-deploy

```bash
git add .
git commit -m "describe what you changed"
git push
```

Two things happen automatically:

- **GitHub Actions** runs a CI check (you can see it in the **Actions** tab — green checkmark = good).
- **Vercel** builds and deploys your change. You'll see the new version on your live URL within a minute.

---

## Troubleshooting

| Problem                                  | Fix                                                                     |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| `npm run dev` says "Cannot find module"  | Run `npm install`                                                       |
| Chat says `GEMINI_API_KEY is not set`    | Your `.env` is missing or has quotes around the key                     |
| Live site loads but chat returns 500     | You didn't add `GEMINI_API_KEY` to Vercel's env vars                    |
| Codespaces preview URL won't load        | Open the **Ports** tab, set port 3000 to "Public"                       |
| Pushed code but Vercel didn't redeploy   | Vercel project not connected to this repo — re-import in Vercel dashboard |

---

## What's in the box

```
api/chat.js          The backend — talks to Gemini. Edit SYSTEM_PROMPT here.
public/index.html    The page structure. Edit titles + welcome text here.
public/styles.css    The look. Edit colors here.
public/app.js        Wires the page to the backend. You usually leave this alone.
dev-server.js        Local-dev wrapper. You leave this alone.
.github/workflows/   The CI pipeline. You leave this alone.
```
