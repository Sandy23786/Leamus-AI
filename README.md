# Leamus AI — Intelligent Assistant Web App

A modern, navy-blue themed AI assistant web application with multi-mode chat capabilities.

## Features

- **Authentication** — Email/password sign-in, sign-up, and Google OAuth (UI ready)
- **5 AI Modes** — Chat, Writing, Coding, Data Analysis, Research
- **Chat Interface** — Message bubbles, typing indicators, timestamps, copy/save actions
- **Code Blocks** — Syntax highlighting, copy-to-clipboard, language badges
- **File Attachments** — Upload and reference files in conversations
- **Voice Input** — Web Speech API integration
- **Chat History** — Browse and resume past conversations
- **Dashboard** — Usage stats and mode breakdown
- **Theme Toggle** — Dark (default) and light mode
- **Responsive Sidebar** — Collapsible with mode selector and history

## Tech Stack

- **Pure HTML, CSS, JavaScript** — No frameworks, no build step required
- **ES Modules** — Clean component architecture
- **CSS Custom Properties** — Full theme system with light/dark support

## Getting Started

### Option 1 — Direct Open
Just open `index.html` in a browser. Note: ES modules require a server for local dev.

### Option 2 — Local Server (recommended)
```bash
# Python 3
python -m http.server 3000

# Node.js (npx)
npx serve .

# Or use VS Code Live Server extension
```
Then visit `http://localhost:3000`

## Project Structure

```
leamus-ai/
├── index.html                  # Entry point
├── README.md
├── src/
│   ├── main.js                 # App bootstrap & routing
│   ├── styles/
│   │   └── main.css            # Full theme + component styles
│   ├── components/
│   │   ├── Auth.js             # Sign-in / Sign-up screen
│   │   ├── Sidebar.js          # Navigation sidebar
│   │   └── Chat.js             # Chat interface + input
│   └── utils/
│       └── aiReplies.js        # AI response templates
└── public/                     # Static assets (add icons, images here)
```

## Connecting to Real AI (Anthropic API)

In `src/utils/aiReplies.js`, replace the mock `getAIReply()` function with a real API call:

```javascript
export async function getAIReply(mode, userMessage) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': YOUR_API_KEY,        // Use env var in production
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: getModeSystemPrompt(mode),
      messages: [{ role: 'user', content: userMessage }]
    })
  });
  const data = await response.json();
  return data.content[0].text;
}
```

> ⚠️ Never expose API keys in client-side code in production. Use a backend proxy.

## Customisation

- **Branding** — Update `Leamus AI` references in `index.html`, `main.js`, and `Auth.js`
- **Colors** — Edit CSS variables in `src/styles/main.css` (`:root` block)
- **Modes** — Add/remove modes in `Sidebar.js`, `Chat.js`, and `aiReplies.js`
- **Quick actions** — Edit the `quick-actions` section in `Chat.js`

## Deployment

Works with any static host:
- **Vercel** — `vercel deploy`
- **Netlify** — drag & drop the folder
- **GitHub Pages** — push to `gh-pages` branch
- **Cloudflare Pages** — connect repo, build command: none

## License

MIT — free to use and modify.
