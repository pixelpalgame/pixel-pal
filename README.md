# Pixel Pal

A pixel-art life-sim RPG set in a living city. Build your character, gather resources, craft powerful gear, brawl your way through the Downtown Strip, and take on a brutal boss — all in a world that feels alive. Play solo or bring a friend along for online co-op.

---

## Install & Play

1. Double-click **INSTALL.bat** — this handles everything automatically the first time (no manual setup required)
2. Once it finishes, a **Pixel Pal** shortcut will appear on your Desktop
3. Double-click the shortcut any time you want to play

> The installer bundles everything the game needs to run. You do not need to install Node.js, Python, or any other software manually.

## Keeping the Game Updated

Double-click **UPDATE.bat** at any time to check for a new version. If one is available it will download and install it automatically. Your save data is never touched during updates.

---

## Features

### Exploration
The world is split across multiple distinct zones, each with its own look, feel, and purpose. Travel between them instantly using the **World Map** (`M` key) with a warp animation that plays between zones.

- **The Grove Apt** — your home base and starting point
- **Grove Park** — gather wood and fiber from the trees and plants
- **Stonepick Mines** — mine for ore, stone, coal, and rare materials
- **Coastal Docks** — a wide waterfront area to explore and fish
- **The Bazaar** — a bustling market district
- **City Library** — a quiet landmark in the upper city
- **Neon Basement** — a nightclub tucked into the lower streets
- **Downtown Strip** — the combat zone where enemies patrol the streets

### Crafting
Unlock the crafting bench by visiting the Mines. From there you can forge weapons, shields, mining tools, and consumables using materials you gather across the world. Every item can roll random **affixes** — stat modifiers that make each craft unique. Rare affixes, set bonuses, and tier upgrades give you something to grind for long after the basics are covered.

### Mining
Enter Stonepick Mines and swing at ore nodes to gather resources. Craft and equip **mining tools** (Pickaxe, Axe, Scythe) to increase your swing speed, ore yield, and reach. An auto-mine mode (`F1`) lets you grind passively while you take a break.

### Combat
The Downtown Strip is a side-scrolling combat zone where enemies patrol and engage. The system is fully action-based:
- **Attack** with `E` — timing your swings after an enemy's recovery window deals the most damage
- **Block** with `Q` — absorbs the majority of incoming damage with a small chip through
- **Jump** with `Space` — dodge charges and shockwaves that can't be blocked
- Enemies telegraph attacks with a **red glow windup** — learn the patterns and punish accordingly

### Boss Fight — The Downtown Warden
Craft a **Warden's Summon** from Street Tags dropped by enemies on the Strip, then use it at the portal to enter the boss arena. The Warden has three distinct attack phases and enters a rage mode at 50% HP. Defeating him completes the demo.

### Online Co-op
Play the full game with a friend on the same network. Both players share the world in real time — movement, combat, and the boss fight are all synced. The host runs the boss AI; both players contribute damage. See the **Co-op** section below for setup instructions.

### AI Companion
Your character has a built-in AI that reacts to the world around them — commenting on where they are, what they're doing, and responding to messages you send in the chat panel. Conversations are context-aware and update based on your in-game situation.

### Progression
- **XP & Skills** — gain experience in Combat, Mining, Gathering, and more through normal play. Each skill levels up independently and contributes to your overall build.
- **Equipment slots** — weapon, off-hand, helmet, chest, legs, boots, and tools. Each slot accepts crafted gear with its own stat profile.
- **Affixes** — crafted items can roll offensive, defensive, utility, and gathering affixes that stack and interact with each other.

### Save System
The game auto-saves regularly. You can also manually save, create a named backup, or clear your data from the **Save panel** (💾 button in the top bar).

---

## Controls

| Key | Action |
|-----|--------|
| `← → / A D` | Move left / right |
| `Space / W` | Jump |
| `E` | Interact / Attack / Mine |
| `Q` | Block |
| `F` | Use item / activate portal |
| `M` | Open world map |
| `TAB` | Open inventory |
| `G` | Open equipment screen |
| `C` | Open crafting bench |
| `F1` | Toggle auto-mine (in Mines) |
| `F11` | Toggle fullscreen |
| `ESC` | Leave current scene / close panel |

---

## Online Co-op

Both players need the game installed. Co-op works over a local network (same Wi-Fi or wired connection).

**To host:**
1. Click **PLAY ONLINE** in the top bar
2. Go to the **HOST GAME** tab
3. Click **CREATE ROOM** — your local IP address and a 6-character room code will appear
4. Share both with your friend

**To join:**
1. Click **PLAY ONLINE** in the top bar
2. Go to the **JOIN GAME** tab
3. Enter the host's IP address and room code
4. Click **JOIN ROOM**

Once connected, both players are in the same world. Either player can enter any zone and the other will follow. The boss fight is fully co-op — both players fight the Warden together.

---

## Demo Content & Important Disclaimer

The current release is an **early access demo** covering Tier 1 of the full game. It includes the complete starting zone, all gathering areas, the Downtown Strip, and the Warden boss fight.

> ⚠️ **All demo save data will be wiped when the full game releases.** Progress made during the demo — including items, levels, crafted gear, and currency — will not carry over. The demo is for experiencing the game, not for keeping permanent progress.

**Planned for the full release:**
- Tier 2 zone — The Heights, with new enemies and a new boss
- Housing and base building
- Faction system with reputation and quest lines
- Bows, daggers, magic skills, and arcane weapons
- Expanded world map with new districts
- Deeper NPC storylines and scheduled world events
