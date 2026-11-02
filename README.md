# Salicare Launch Board

Project management for the Salicare toothpaste launch: a 9-phase launch template, dashboard, kanban board, list and "My Tasks" views.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Press `C` anywhere to add a task.

## Status

- [x] Steps 1–2: app shell, fluoride-free launch template (37 tasks, 9 phases), Home, My Tasks, Board (drag and drop), List, Settings
- [x] Steps 3–4: Supabase email login, workspaces and tasks in Postgres with row-level security (`supabase/migrations/`)
- [ ] Steps 5–7: records (suppliers, formulas, tests, regulatory), timeline, calendar, Cmd-K
- [ ] Steps 8–9: Google Docs and KakaoTalk integrations, daily reminder
- [ ] Step 10: security pass, tests, deploy checklist

Stack: Next.js, TypeScript, Tailwind CSS, Supabase, dnd-kit, lucide icons. Deploys on Vercel.

The Supabase URL and publishable key default to the project's values in `src/lib/supabase.ts`; override them with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never put the service-role key in this app.
