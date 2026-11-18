# Daily Fuel Check

Type what you ate and what you did today. An AI works out the calories, protein, carbs, fat and what you burned, then tells you:

- calories eaten vs. burned (BMR + digestion + activity)
- tomorrow's estimated **body fat** and **muscle** change in grams
- **how many more steps** you'd need to walk off the fat you stored today (plus km, minutes, or jogging time)
- a score and honest feedback: what went well, what you could have done differently, and a plan for tomorrow
- **saved days**: save any day, open it later, add more food or activity to it and update it, or delete it; a History tab shows your last 7 days

Works on phone, tablet and computer. Light and dark mode.

## Languages

16 built-in languages: English, Deutsch, Türkçe, Español, Français, Italiano, Português, Nederlands, Polski, Русский, Українська, العربية (right-to-left), हिन्दी, 中文, 日本語, 한국어.

Pick **🌐 Other language…** and type any language: the AI translates the whole page once and the browser remembers it. The AI also writes the food names and feedback in the selected language.

## Privacy

- **Everything stays on your device.** Saved days, your profile and settings live only in your browser's storage. There is no account, no server and no database.
- **Optional password lock.** Encrypts all saved data with AES-256-GCM (key from PBKDF2-SHA-256, 600,000 rounds, random salt). The key only exists in memory, and the app locks itself after 10 minutes without use. A forgotten password cannot be recovered.
- **Only "Analyze" sends data**: the food/activity text plus age, sex, height, weight and goal go to the AI to calculate the results. Nothing else leaves the device.
- **No ads, trackers, cookies, analytics or outside fonts.** The GitHub version has a strict Content-Security-Policy, so the page can only talk to `api.anthropic.com`.
- **Backups** (to move to another device) are encrypted with your password when the lock is on, and never include your API key.
- **Delete all my data** wipes everything from the device in one tap.

## How to run

Open `index.html` in a browser (or host the folder on GitHub Pages). No build step.

**AI:** inside claude.ai the page uses Claude directly. Anywhere else, it shows a box for your own [Anthropic API key](https://console.anthropic.com/). The key is stored only in your browser's localStorage and is sent only to `api.anthropic.com`.

## How the numbers are calculated

- **BMR:** Mifflin–St Jeor formula.
- **Burned:** BMR + 10 % of food eaten (digestion) + activity above rest (AI estimate).
- **Steps:** about 0.55 kcal per kg per km of walking, stride ≈ 41.5 % of height.
- **Fat change:** (surplus − energy put into muscle) ÷ 7.7 kcal per gram of fat tissue.
- **Muscle change:** simple rule. It only goes up on strength-training days (more with ≥ 1.6 g protein per kg) and goes down with big deficits and low protein.

These are estimates for general guidance, not medical advice. The scale also moves ±0.5–1 kg a day from water, salt and carbs.

## Files

- `index.html`: the app
- `i18n.js`, `i18n-more.js`: translations
