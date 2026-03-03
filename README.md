# HOW TO RUN YOUR GAME

## The Problem With Double-Clicking

Before, you had ONE file and you could just double-click it and it worked.

Now you have MANY files and your browser gets confused when you double-click
index.html. It can see index.html but it refuses to load the other files
(the .js and .css files) because of a browser security rule.

So you need a tiny "local server" — think of it like a mini version of a website
running on your own computer. It takes 30 seconds to set up.

---

## Step 1 — Install Node.js (only do this once ever)

Go to https://nodejs.org and download the one that says "LTS".
Install it like any normal program. That's it.

---

## Step 2 — Put all the game files in one folder

Make sure ALL these files are in the same folder together:
- index.html
- styles.css
- game.js
- world.js
- audio_data.js
- audio_engine.js
- ui.js
- ai.js
- npc.js
- save.js
- map.js
- docks.js
- webllm.js

---

## Step 3 — Open a terminal IN that folder

**On Windows:**
- Open the folder in File Explorer
- Click the address bar at the top (where it shows the folder path)
- Type `cmd` and press Enter
- A black window opens — that's the terminal

**On Mac:**
- Open the folder in Finder
- Right-click the folder
- Click "New Terminal at Folder"

---

## Step 4 — Type this one command and press Enter

```
npx serve .
```

(That's: npx, space, serve, space, dot)

It will download a tiny helper tool and then say something like:

```
Serving!
- Local: http://localhost:3000
```

---

## Step 5 — Open your game

Open your browser and go to:

**http://localhost:3000**

Your game should load exactly like before!

---

## Every time you want to play / work on the game

You just repeat Steps 3, 4, and 5. Steps 1 and 2 are one-time only.

The terminal needs to stay open while you're working. If you close it,
the server stops and the game won't load. Just open it again and re-run
`npx serve .`

---

## Working on the game with Claude

Now that the game is split into files, when you want to add something new,
just upload the ONE relevant file instead of the whole thing:

| What you want to change | Upload this file |
|------------------------|-----------------|
| How the world looks | world.js |
| How Pixel talks / AI responses | ai.js |
| Pixel's daily routine / behavior | npc.js |
| Inventory, HUD, panels | ui.js |
| The docks scene | docks.js |
| The world map | map.js |
| Save/load system | save.js |
| Music tracks | audio_data.js |
| Music playback logic | audio_engine.js |
| XP, skills, stats | game.js |
| All the styling | styles.css |

After Claude edits a file, download it and replace the old one in your folder.
Refresh the browser and your changes are live!

---

# PIXEL — File Structure (technical reference)

Split from a single 6,607-line file into focused, manageable modules.

## Files

| File | Size | Contents |
|------|------|----------|
| `index.html` | ~8KB | HTML structure only — all DOM elements |
| `styles.css` | 34KB | All CSS styles |
| `game.js` | 13KB | Constants, state, XP system, mood, time, logging |
| `world.js` | 65KB | World/environment drawing, character drawing, movement, camera |
| `audio_data.js` | 6.1MB | Base64-encoded MP3 audio files (AUDIO_DB) |
| `audio_engine.js` | 11KB | Audio playback engine, music panel logic |
| `ui.js` | 24KB | HUD, speech/thought bubbles, inventory, news alerts |
| `ai.js` | 33KB | AI system, chat panel, intent classifier, response generator |
| `npc.js` | 25KB | Needs, personality, emotional state, routines, game loop |
| `save.js` | 9KB | Save/load system and save UI |
| `map.js` | 17KB | World map overlay and warp travel system |
| `docks.js` | 22KB | Coastal docks scene |
| `webllm.js` | 1KB | WebLLM/Llama browser AI (ES module) |

## Script Load Order (in index.html)

Order matters — each file may depend on globals from files above it:
1. `webllm.js` (ES module — sets `window.webllmState` etc.)
2. `game.js` → defines `SKILLS`, `char`, `mood`, `gt`, `VW`, `VH`, etc.
3. `world.js` → drawing functions, `drawWorld()`, `drawChar()`
4. `audio_data.js` → defines `AUDIO_DB`
5. `audio_engine.js` → defines `audioEngine`
6. `ui.js` → HUD, inventory, news
7. `ai.js` → `pixelRespond()`, chat panel
8. `npc.js` → `loop()`, `tickNeeds()`, `pickBestAction()`
9. `save.js` → `saveGame()`, `loadGame()`
10. `map.js` → `openMap()`, `doWarpTravel()`
11. `docks.js` → `enterDocksScene()`, `docksLoop()`

## Running Locally

Browsers block ES modules from `file://` URLs. Use a local server:
```
npx serve .
# or
python3 -m http.server 8080
```
Then open `http://localhost:8080`

## Adding New Features

- New location art → `world.js`
- New UI panel → `ui.js` + add HTML to `index.html`
- New AI/chat behavior → `ai.js`
- New NPC routine/behavior → `npc.js`
- New items → `ui.js` (ITEMS database section)
- New map location → `map.js`
- New music track → `audio_data.js` (add to `AUDIO_DB.bgm`)
- New scene → create `scene_name.js`, add `<script>` to `index.html`
