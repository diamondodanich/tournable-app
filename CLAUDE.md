@AGENTS.md

# Project Rules

## Language — Russian Only
All chat responses, reports, and instructions MUST be in Russian.
Technical terms (component names, library names, CLI commands, file paths, etc.) may remain in their original form.



## No Emojis — Ever
NEVER use emojis anywhere in this codebase: not in UI text, not in data/arrays, not in JSX, not in comments.
Replace any emoji with a premium visual element instead:
- Use Lucide React icons (`import { Trophy, Zap, Star, ... } from 'lucide-react'`)
- Use CSS/Tailwind gradients, colored dots, or accent lines
- Use numbered indicators (01, 02, ...) as visual elements
- Use colored icon containers with Lucide icons inside

If you find an emoji in existing code, replace it in the same edit.
This rule applies globally: landing page, dashboard, forms, legal pages, emails, everywhere.
