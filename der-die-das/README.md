# Der Die Das Trainer

Learn the article (der, die, das) of 5000 German nouns, a little at a time.

## What it does

- **100 levels of 50 words**, ordered from everyday words to rarer ones. Each word comes with an English translation.
- **Short rounds:** 5 to 20 new words per round (you choose). A new word is shown with its article first, then asked twice.
- **Spaced repetition:** a correct word comes back after 1, 3, 7, 14, 30 and 60 days. A mistake sends it back to tomorrow and repeats it in the same round.
- **Memory aids after every answer:** ending rules (-ung is die, -chen is das), exceptions, and compound words ("das Haus → das Krankenhaus").
- **Colours:** der is blue, die is red, das is green, everywhere.
- **Levels view** with search, a **rules page**, and a "difficult words" practice mode.
- Interface in German or English.

## Every device

- Works on phones (from 320 px wide), tablets and computers, in portrait and landscape, light and dark mode.
- Big touch targets on touch screens; keys 1, 2, 3 and Enter on a keyboard.
- Can be added to the home screen and then works offline (service worker, web app manifest, app icons).
- Progress is saved in the browser on that device. The start page has a code to back it up or move it to another device.

## Files

| File | Purpose |
|------|---------|
| `index.html` | The whole app, including all 5000 words. Built from the files below. |
| `template.html` | Page layout, styles and app logic. |
| `data/w01.txt` … `data/w06.txt` | The word lists, grouped by gender, from common to rare. |
| `build.js` | Puts the words into the template and writes `index.html` (`node build.js`). |
| `gen-icons.js` | Draws `icon.svg` and the PNG app icons (`node gen-icons.js`). |
| `sw.js`, `manifest.webmanifest` | Offline use and installing to the home screen. |

No dependencies: open `index.html` in a browser, or serve the folder (needed for offline use and installing).

## Note

The word list was written by hand, not checked against a dictionary. Nouns with two common articles (der/das Joghurt, der/die See) are left out. If you find a wrong article, fix it in `data/` and run `node build.js`.
