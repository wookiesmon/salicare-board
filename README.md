# Salicare Launch Board

Project management for the Salicare toothpaste launch: a 9-phase launch template, dashboard, kanban board, list and "My Tasks" views.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Press `C` anywhere to add a task.

## Status

- [x] Steps 1–2: app shell, launch template (36 tasks, 9 phases), Home, My Tasks, Board (drag and drop), List, Settings. Data is saved in the browser.
- [ ] Steps 3–4: Supabase login and database with row-level security
- [ ] Steps 5–7: records (suppliers, formulas, tests, regulatory), timeline, calendar, Cmd-K
- [ ] Steps 8–9: Google Docs and KakaoTalk integrations, daily reminder
- [ ] Step 10: security pass, tests, deploy checklist

Stack: Next.js, TypeScript, Tailwind CSS, dnd-kit, lucide icons. Deploys on Vercel.
