# Daily Fuel Check

Type what you ate and what you did today. The page works out the calories, protein, carbs, fat and what you burned, then tells you:

- calories eaten vs. burned (BMR + digestion + activity)
- tomorrow's estimated **body fat** and **muscle** change in grams
- **how many more steps** you'd need to walk off the fat you stored today (plus km, minutes, or jogging time)
- a score and honest feedback: what went well, what you could have done differently, and a plan for tomorrow
- **saved days**: save any day, open it later, add more food or activity to it and update it, or delete it; a History tab shows your last 7 days

Works on phone, tablet and computer. Light and dark mode.

## Languages

16 built-in languages: English, Deutsch, Türkçe, Español, Français, Italiano, Português, Nederlands, Polski, Русский, Українська, العربية (right-to-left), हिन्दी, 中文, 日本語, 한국어.

With an AI key connected you can also pick **🌐 Other language…** and type any language: the AI translates the whole page once and the browser remembers it.

## Privacy

- **Everything stays on your device.** Saved days, your profile and settings live only in your browser's storage. There is no account, no server and no database.
- **Optional password lock.** Encrypts all saved data with AES-256-GCM (key from PBKDF2-SHA-256, 600,000 rounds, random salt). The key only exists in memory, and the app locks itself after 10 minutes without use. A forgotten password cannot be recovered.
- **Nothing leaves the device** by default: the built-in estimator runs in your browser. Only if you add your own AI key does "Analyze" send the food/activity text plus age, sex, height, weight and goal to Anthropic.
- **No ads, trackers, cookies, analytics or outside fonts.** The GitHub version has a strict Content-Security-Policy, so the page can only talk to `api.anthropic.com`.
- **Backups** (to move to another device) are encrypted with your password when the lock is on, and never include your API key.
- **Delete all my data** wipes everything from the device in one tap.

## How to run

Open `index.html` in a browser (or host the folder on GitHub Pages). No build step.

**No AI needed.** `local-engine.js` reads the text on the device: it splits meals into items, reads amounts ("200 g", "2 slices", "a glass", "big plate", "0,5 l", "1/2"), matches about 120 foods and dishes (names in English, German, Turkish, Spanish, French, Italian, Portuguese, Dutch, Polish and some Russian) to a nutrient table (USDA FoodData Central / national food tables, per 100 g as eaten), reads steps and activities with minutes, hours or km (MET values from the 2024 Compendium) and writes rule-based feedback in all 16 languages. Unknown items are listed and not counted; write "snack 250 kcal" to add any food by its calories.

**Optional AI:** inside claude.ai the page uses Claude directly. Anywhere else, you can open "Optional: use AI" and add your own [Anthropic API key](https://console.anthropic.com/) for more precise reading of free text. The key is stored only in your browser's localStorage and is sent only to `api.anthropic.com`.

## How the numbers are calculated (research-based)

The estimator (or the optional AI) only turns your text into **grams, nutrients, step count and activities (MET + minutes)**. All energy maths is done by the app with published formulas:

| What | Method | Source |
|---|---|---|
| BMR | Mifflin–St Jeor (most reliable general equation, ±10 % for most people). With body fat entered and 1+ years of training: Cunningham, 500 + 22 × lean mass | Frankenfield 2005; O'Neill 2023; ten Haaf 2014 |
| Body fat (if not entered) | Deurenberg: 1.2 × BMI + 0.23 × age − 10.8 × sex − 5.4 | Deurenberg 1991 |
| Food energy | 4 kcal/g protein & available carbs, 9 fat, 7 alcohol, 2 fibre | FAO 2003, EU 1169/2011 |
| Digestion (TEF) | protein 25 %, carbs 7.5 %, fat 2 %, alcohol 15 % | Westerterp 2004 |
| Activities | 2024 Adult Compendium MET × 0.0175 kcal/kg/min × weight, minus resting burn (60+: Older Adult Compendium, 0.0135) | Herrmann 2024 |
| Steps | ≈0.6 kcal per kg per km, stride 41.5 % (men) / 41.3 % (women) of height; 5,000 steps assumed if none given | Schantz 2022 |
| Fat vs lean change | Forbes partition: lean share = 10.4 / (10.4 + fat mass), 9.44 kcal/g fat and 1.816 kcal/g lean | Forbes 1987; Hall 2007, 2008 |
| Muscle on training days | ≈33 g per session for novices (halving with experience), reduced below 1.6 g/kg protein and in big deficits; high protein limits lean loss in a deficit | Morton 2018; Longland 2016; Helms 2014 |
| Targets | protein 1.4 / 1.6 / 2.0 g/kg (maintain / build / lose fat); fat ≤ 30 % and saturated fat < 10 % of energy; free sugars < 10 %; fibre 14 g per 1000 kcal | WHO; Morton 2018; Helms 2014 |
| Uncertainty | each food gets a confidence (±10/20/35 %); BMR ±10 %, activity ±20 %; the app shows the likely range of intake, balance and fat change | CALERIE 2 (people under-report ~15 %) |

These are estimates for general guidance, not medical advice. The scale also moves ±0.5–1 kg a day from water, salt and carbs.

## Files

- `index.html`: the app
- `i18n.js`, `i18n-more.js`, `i18n-sci.js`: translations
