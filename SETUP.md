# Single Slot — JEE Formula Studio

A focused, no-login study website with the original Single Slot logo and a black / orange / white / gold design.

## Included
- Original Single Slot logo restored in the website header and browser favicon
- Responsive dashboard for mobile and laptop
- Chapter-wise JEE Main formula handbook populated from the three supplied Maths, Physics and Chemistry formula notes, with LaTeX cleaned and rendered as readable mathematical notation
- Trigonometric ratios table with degree values, radian values, and all six ratios (sin, cos, tan, cosec, sec, cot)
- Subject filters (Mathematics, Physics, Chemistry) and full-text search across chapter titles and notes
- Formula names, equations, key conditions, short explanations and tables where present in the supplied notes
- Bookmark chapters for revision
- Study progress checklist and session counter
- Weekly timetable maker with overlap checks, auto-save on the current browser, sample plan and individual slot removal
- Timetable downloads: CSV spreadsheet, ICS calendar file, and Print / Save as PDF

## Deploy on Netlify
1. Extract the ZIP.
2. Open https://app.netlify.com/drop
3. Upload the `single-slot-platform` folder (or its contents, keeping the project files together).
4. Open the Netlify URL.

For Git-based deployment, commit this folder to a repository, import it in Netlify and set the publish directory to `.`.

## Important notes
- No login / create-account screen is included.
- Timetable, bookmarks and progress are saved in this browser on this device only; they do not sync between devices.
- MathJax is loaded from jsDelivr to render mathematical notation. Internet access is needed for rendered equations; the text content remains in the page if the CDN is unavailable.
- Formula handbook chapter content is based on the three notes supplied for this project. Check the current official JEE Main syllabus before exam preparation because syllabus coverage can change.


## JARVIS (OpenAI API) setup

JARVIS uses a Netlify serverless function so the API key is not placed in browser JavaScript. Deploy this folder to Netlify, then open **Site configuration → Environment variables** and add `OPENAI_API_KEY` with an OpenAI API key from https://platform.openai.com/api-keys. Optionally set `OPENAI_MODEL` (default: `gpt-4.1-mini`). Redeploy after setting variables. API usage may cost money; check your OpenAI billing and usage limits. Do not commit or share the API key. When opened directly as a local HTML file, the serverless JARVIS function will not run; use Netlify deploy or Netlify Dev.
