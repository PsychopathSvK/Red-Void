# 🔴 RED VOID BOT v4.0 — FINAL

Jeden integrovaný Discord RPG bot. Všetky systémy používajú spoločnú JSON databázu.

## Systémy
XP/Level, leaderboard, Void Points, daily streak, transfer, Alignment, Relics, Achievements, Titles, Classes, Factions, reputation, Bounties, Rifts, Boss, Shop, Events, Blood Moon, Void Surge, Shadow Hour, Double XP, Void Dice, Curse, Fate, Void Map, Exploration, Quests, Faction War, Void Whispers, Daily Ritual, Collection, Cooldowns, Welcome, moderation.

## Slash commands
/profile /rank /leaderboard /balance /daily /pay
/alignment /relics /achievements /titles /title
/classes /class /factions /faction /reputation
/bounties /bounty /rift /rift-join /boss /attack
/shop /buy /event /roll /curse /fate
/map /explore /quest /war /whisper /ritual
/collection /streak /cooldowns
/clear /warn /warnings /timeout

## Bot-Hosting
Startup:
`cd /home/container && npm install --no-fund --no-audit && node src/index.js`

Environment:
DISCORD_TOKEN, CLIENT_ID, GUILD_ID
Optional:
WELCOME_CHANNEL_ID, MEMBER_ROLE_ID, LOG_CHANNEL_ID

## Slash commands deployment
On your PC:
`npm install`
set DISCORD_TOKEN, CLIENT_ID, GUILD_ID
`npm run deploy`

## Discord Developer Portal
Enable Server Members Intent and Message Content Intent. Presence Intent is optional.
Bot permissions: View Channels, Send Messages, Embed Links, Read Message History, Manage Messages, Moderate Members, Manage Roles.

## Persistence
Keep `data/` persistent on the host so XP/VP/progression survives restarts.

## 📐 Code formatting
The JavaScript source is formatted so statements and blocks are shown on separate lines.


## 🔒 Command Channel Protection

The bot now supports per-command channel restrictions. If a member uses a command in the wrong channel, the bot sends an ephemeral warning and does not execute the command.

Example:
- `/event` → Event channel
- `/roll` → Roll channel
- `/rift` and `/rift-join` → Rift channel
- `/boss` and `/attack` → Boss channel
- `/shop` and `/buy` → Shop channel
- `/bounties` and `/bounty` → Bounty channel
- `/quest` → Quest channel
- `/map` and `/explore` → Map channel
- `/war` → War channel
- profile/class/faction commands → Profile channel
- economy commands → Economy channel
- fate/curse/whisper/ritual → their own channels

Set the channel IDs in the hosting environment variables. If an environment variable is empty, that command remains unrestricted.

## 🔴 Automatic roles v4.2
The bot can automatically add roles for:
- Level 10 / 25 / 50 / 100
- Void Classes
- Void Factions
- Blood Moon / Void Surge / Shadow Hour / Double XP participation
- Riftwalker, Relic Hunter, Boss Hunter, The Chosen and Ritual Keeper achievements

Set the corresponding role IDs in `.env` / Bot-Hosting environment variables.
The bot needs **Manage Roles**, and the bot's highest role must be above every role it needs to assign. discord.js supports adding/removing GuildMember roles through its role manager. 

## 🏆 Red Void v4.3 — Dynamic Achievement Roles

v4.3 can **create Discord roles automatically** when a user reaches an achievement.
Use `/setup-roles` once as an administrator to create all predefined roles, or let the bot create each role on first unlock.

Automatic roles include:
- 💬 Void Speaker / 🗣️ Void Voice / 👁️ Void Presence
- ⚡ Void Awakened / 🌑 Void Veteran / 👑 Void Elite / 🔴 Red Void Legend
- 💰 Void Tycoon / 💎 Void Rich
- 🎲 Fate Gambler / 👑 Perfect Roll
- 🌀 Rift Hunter / 🌌 Rift Master
- ⚔️ Abyss Hunter / 💀 Abyss Slayer
- 💎 Relic Seeker / 🔮 Relic Keeper
- 🧭 Void Explorer / 🌌 Void Cartographer
- 🔥 Void Devoted / 🩸 Void Faithful
- 👁️ Fatebound / 🕯️ Void Priest / 🏛️ Faction Elite
- secret roles: 👁️ The Watched, 🕳️ Void Touched, 🌑 Child of the Abyss, 💀 Deathless

Set `ACHIEVEMENT_CHANNEL_ID` if you want the bot to announce newly unlocked roles in a dedicated channel.

The bot requires **Manage Roles**. discord.js supports creating roles through `guild.roles.create()` and assigning them through `guildMember.roles.add()`. citeturn0search0turn0search2

## 🔴 Red Void v5.0 — Visual RPG
- Welcome embed automatically uses the Discord server banner as the main image.
- `/boss` shows a configurable boss image.
- `/event`, `/help`, `/void`, `/contracts`, `/evolution`, `/corruption`, `/legacy`, `/season`, `/duel` support configurable images.
- Set image URLs in `.env`/Bot-Hosting. If omitted, the server banner is used as fallback.
- New RPG commands: `/help`, `/void`, `/contracts`, `/duel`, `/evolution`, `/corruption`, `/legacy`, `/season`.
- Channel protection can be configured for the new commands as well.

## 📈 Level Role Ladder
Every 5 levels from **5 → 100** has a dedicated role. Existing Red Void role names are preserved first (especially Level 10, 25, 50 and 100); missing milestones are created automatically.

Use `/setup-level-roles` once as an administrator to create/prepare the full ladder.
The bot then automatically assigns the role when a member reaches each 5-level milestone.

## 📈 v5.1 — Level Roles Every 5 Levels

The level ladder now has a role at every 5 levels from **5 to 100**.

5  🩸 Void Initiate
10 ⚡ Void Awakened (preserves the older role if it already exists)
15 🌒 Void Walker
20 🔮 Void Seeker
25 🌑 Void Veteran (preserves the older role)
30 🌀 Riftborn
35 👁️ Void Watcher
40 💀 Abyss Marked
45 🔥 Voidforged
50 👑 Void Elite (preserves the older role)
55 🩸 Bloodbound
60 🌌 Void Master
65 🕳️ Abyss Walker
70 ⚔️ Void Warden
75 👁️ Void Ascendant
80 🌀 Rift Master
85 🔴 Red Herald
90 💎 Void Relic Lord
95 ☠️ Deathless
100 🔴 Red Void Legend (preserves the older role)

Use `/setup-level-roles` once as an administrator. Existing roles from older Red Void versions are reused when their names/IDs match; missing milestones are created automatically. When a member reaches a 5-level milestone, the bot assigns the corresponding role.

## 🔒 v6.0 — Channel Guard
Every RPG slash command is mapped to a dedicated channel via `.env`. If the channel ID is missing, the command remains usable; once configured, the bot rejects the command outside the assigned channel with an ephemeral redirect.

## 🖼️ Visual RPG
Bundled original visuals live in `/assets`. Welcome uses the server banner when available. `/boss` attaches an animated GIF with the current Boss HP, plus a Boss-specific visual. Bosses rotate between The Red Abyss, The Void Eater, The Watcher and The Red God.

## 👹 Boss HP GIF
The bot dynamically builds `current_boss_hp.gif` when `/boss` or `/attack` is used, so the displayed HP bar matches the current Boss HP.

## 🚀 Bot-Hosting setup

Startup:
`cd /home/container && npm install --no-fund --no-audit && node src/index.js`

Environment must include:
- `DISCORD_TOKEN`
- `CLIENT_ID`
- `GUILD_ID`
- `WELCOME_CHANNEL_ID`
- channel IDs listed in `.env.example`

Discord Developer Portal:
- Enable **Server Members Intent**
- Enable **Message Content Intent** if you want message-based XP
- Bot needs **Manage Roles** for automatic level roles
- Put the bot's highest role ABOVE every role it must assign

After changing slash commands, run locally:
`npm run deploy`

### Channel map
PROFILE → profile/rank/relics/achievements/titles/classes/factions/reputation/evolution/corruption/legacy/void
ECONOMY → balance/daily/pay
EVENT → event
ROLL → roll
FATE → fate
CURSE → curse
WHISPER → whisper
RITUAL → ritual
RIFT → rift/rift-join
BOSS → boss/attack
SHOP → shop/buy
BOUNTY → bounties/bounty
QUEST → quest/contracts
MAP → map/explore
WAR → war
LEADERBOARD → season
DUEL → duel
BOT COMMANDS → help

If a command's channel variable is configured, that slash command is rejected everywhere else.

## 🛒 v6.1 — Visual Void Market
`/shop` now displays a dedicated Void Market image and six items. `/buy` supports `voidboost`, `relicbox`, `voidtitle`, `factionseal`, `bloodelixir`, and `riftkey`.

## 📢 Level-up announcement channel
Set `LEVEL_CHANNEL_ID` to the Discord channel where ALL level-up and level-role unlock announcements should appear. The bot will no longer announce level-ups in the channel where the member happened to send a message. If `LEVEL_CHANNEL_ID` is empty, it falls back to the current message channel.

## 🌐 v7.0 — Red Void Command Nexus
The bot now includes a built-in Express web dashboard served by the same Node process.

Set `PORT` to the port assigned by your bot hosting (usually an allocated port; use the exact value from the host).
The website is available at:
`http://YOUR_HOST:PORT/`

Dashboard sections:
- Nexus / live status
- Profile
- RPG systems
- World Boss
- Void Market
- Command Nexus
- Join Discord

The dashboard reads live public data from `/api/dashboard`. Personal Discord profiles and purchases are still handled by Discord commands; OAuth can be added later if you want a full account dashboard.

## 🔐 v7.1 — Discord OAuth2 Dashboard

The dashboard now supports a real Discord OAuth2 Authorization Code login.

### Developer Portal
In **Developer Portal → Your Application → OAuth2 → Redirects**, add the exact URL:
`https://YOUR-DOMAIN/auth/callback`

Set:
- `CLIENT_ID` = Discord Application ID
- `DISCORD_CLIENT_SECRET` = OAuth2 Client Secret
- `DISCORD_REDIRECT_URI` = the exact registered callback URL
- `GUILD_ID` = Red Void server ID

The dashboard requests only `identify` and `guilds`. Discord documents `identify` for basic user profile data and `guilds` for the user's server list. citeturn0search0turn0search2

After login, the backend verifies that the Discord user is actually a member of `GUILD_ID` using the bot token. Personal profile data is returned only to the authenticated browser session.

### Dashboard
- Discord login/logout
- Level + XP progress
- Void Points
- Streak
- Alignment / class / faction
- Corruption / legacy
- Relics
- Achievements
- Titles
- Discord roles
- Boss damage / duel wins
- Season XP
- Live World Boss
- Live event
- Visual Void Market
- Full command directory
- Daily Void Trials

### New bot feature — `/trial`
Every day the bot selects one of three trials:
- 💬 Echo Trial — 25 messages
- 🎲 Fate Trial — 5 rolls
- 🗺️ Gate Trial — 3 explorations

Use `/trial` to see progress and `/trial-claim` after completing it. Progress resets per day and rewards XP + VP.

### Bot-Hosting
Keep the startup:
`cd /home/container && npm install --no-fund --no-audit && node src/index.js`

Set `PORT` to the public/allocated port provided by the host.

**Never put `DISCORD_CLIENT_SECRET` or `DISCORD_TOKEN` into GitHub.** Keep them in Bot-Hosting environment variables. Discord explicitly treats OAuth tokens/secrets as sensitive credentials. citeturn0search0turn0search3

## 🔒 v7.2 — COMPLETE CHANNEL GUARD

All 53 registered slash commands are now mapped to a channel.

### Channel routing
- PROFILE: `profile`, `rank`, `alignment`, `relics`, `achievements`, `titles`, `title`, `classes`, `class`, `factions`, `faction`, `reputation`, `collection`, `streak`, `cooldowns`, `void`, `evolution`, `corruption`, `legacy`
- ECONOMY: `balance`, `daily`, `pay`
- EVENT: `event`
- ROLL: `roll`
- FATE: `fate`
- CURSE: `curse`
- WHISPER: `whisper`
- RITUAL: `ritual`
- RIFT: `rift`, `rift-join`
- BOSS: `boss`, `attack`
- SHOP: `shop`, `buy`
- BOUNTY: `bounty`, `bounties`
- QUEST: `quest`, `contracts`, `trial`, `trial-claim`
- MAP: `map`, `explore`
- WAR: `war`
- LEADERBOARD: `leaderboard`, `season`
- DUEL: `duel`
- BOT COMMANDS / ADMIN: `help`, `clear`, `warn`, `warnings`, `setup-level-roles`, `setup-roles`, `timeout`

If a required channel variable is missing, the command now refuses to run and tells the admin exactly which environment variable must be configured. It no longer silently falls back to the wrong channel.

After changing `.env` on Bot-Hosting, restart the bot. No slash-command redeploy is required for channel-ID changes; only command additions/changes require `npm run deploy`.

## 🔮 v7.3 — Combined Void Channel

`/fate`, `/whisper`, `/curse` and `/ritual` now share one protected channel:
`VOID_CHANNEL_ID`

Set:
`VOID_CHANNEL_ID=ID_TVOJHO_VOID_KANALA`

The four commands will be rejected everywhere else.

## 🛡️ v7.4 — Bot Control, Server Stats & Anti-Spam

### 30-second command cooldown
Every slash command has a per-user, per-command cooldown of **30 seconds**. The cooldown is separate for each command, so `/roll` does not block `/profile`. The guard still blocks commands in the wrong channel first.

### 📜 Bot Log
Set `BOT_LOG_CHANNEL_ID`. Every command attempt is logged with:
- user + Discord ID
- command
- channel + channel ID
- status: SUCCESS / COOLDOWN / BLOCKED
- timestamp

The bot keeps the latest 500 command logs in `data/db.json`.

### 🛡️ Bot Control
Set `BOT_CONTROL_CHANNEL_ID`.
`/bot-control` is admin-only and shows live bot status, ping, uptime, cooldown and recent command usage.
`/command-log` shows the latest 30 command attempts.

### 📊 Server Stats
Set `SERVER_STATS_CHANNEL_ID`.
`/server-stats` is Manage Server-only and shows members, text/voice channels, roles, emojis, bot ping, uptime and log count.

### New environment variables
`BOT_LOG_CHANNEL_ID=`
`BOT_CONTROL_CHANNEL_ID=`
`SERVER_STATS_CHANNEL_ID=`

After adding the new slash commands, run `npm run deploy` once.

## 👹 v7.5 — Boss HUD

`/boss` now renders a dynamic ornate text HP HUD:
`╔════════════════════╗`
`║████████████░░░░░░░░║`
`╚════════════════════╝`

It updates automatically from the real Boss HP after every `/attack`.

Optional public artwork:
- `BOSS_IMAGE_URL`
- `BOSS_THUMBNAIL_URL`

Set these to the direct public URLs of your four boss artworks.

## 🔴 v7.8 — Boss Artwork and HP Bar are SEPARATE

`/boss` now sends TWO separate embeds:

1. **Boss Artwork** — standalone PNG with only the Boss artwork.
2. **HP Core** — standalone animated GIF containing only the HP bar, with no Boss artwork.

`/attack` sends the updated HP Core separately as well.

Files:
- `assets/boss_red_abyss.png` + `assets/boss_red_abyss_hp.gif`
- `assets/boss_void_eater.png` + `assets/boss_void_eater_hp.gif`
- `assets/boss_watcher.png` + `assets/boss_watcher_hp.gif`
- `assets/boss_red_god.png` + `assets/boss_red_god_hp.gif`

## v7.9 — Pure Boss Art + Matching HP GIF

Each Boss now has two truly separate assets:

- `boss_<boss>.png` — ONLY the Boss artwork.
- `boss_<boss>_hp.gif` — ONLY the animated HP bar, on a dark background visually matched to that Boss.

`/boss` sends them as separate embeds. The HP GIF contains no Boss artwork and no Boss name.

## v8.0 — Boss Combat Buttons

- `/boss` now shows a clickable **⚔️ ATTACK** button.
- Clicking **ATTACK** performs the same damage roll as `/attack`.
- Attack uses the existing **30-second per-user attack cooldown**.
- HP decreases after each successful attack.
- The bot selects a Boss-specific animated HP GIF matching the current HP bracket (100/90/.../0).
- The HP GIF contains only the HP bar; Boss artwork remains a separate image.
- **☠️ ABILITIES** opens the active Boss's abilities privately.
- Bosses now have unique abilities and a small chance of a counter effect.

## v8.1 — Expanded Boss Combat System

Boss fights now have combat phases and mechanics:

- 🩸 **Damage scaling by phase:** NORMAL, WOUNDED, FRENZY, ENRAGED, APOCALYPSE.
- 💥 **Critical hits:** each Boss has its own crit chance.
- 🛡️ **Boss defense:** some attacks are partially absorbed.
- 💀 **Boss counters:** the Boss can punish attackers; DEFEND reduces the effect.
- 🛡️ **DEFEND button:** gives a 45-second personal protection window against Boss counters and +5 VP.
- ⚔️ **ATTACK button:** remains the main combat action and keeps the 30-second anti-spam cooldown.
- ☠️ **ABILITIES button:** displays the Boss's unique abilities privately.
- 📊 **Raid damage tracking:** the bot records total damage and individual player damage.
- 🏆 **Top Damage podium:** shown when the Boss is defeated.
- 🔥 The active combat phase and damage multiplier are shown in every successful attack.
- ❤️ HP GIF is selected automatically according to the Boss's current HP bracket.

## 🌐 v8.2 — RED VOID VOID NEXUS Dashboard

The bot includes a full responsive web dashboard with Discord OAuth2.

### Player portal
After Discord login, members can view:
- Level + current XP and progress bar
- total XP
- Void Points
- streak + corruption
- active title / class / faction
- Boss damage and duel stats
- relics, achievements and titles count
- synchronized Discord roles

### Public portal
Without login, visitors can view:
- live bot/server status
- registered player count
- world boss state and HP
- boss combat phase and multiplier
- top 25 progression leaderboard
- Void Market
- complete command catalog
- Discord invite

### OAuth2 setup
In Discord Developer Portal:
1. Open your bot application.
2. OAuth2 → General → Redirects.
3. Add the exact URL from `DISCORD_REDIRECT_URI`, e.g. `https://redvoid.sk/auth/callback`.
4. Put the OAuth2 Client Secret into `DISCORD_CLIENT_SECRET`.
5. Keep `CLIENT_ID` equal to the application/client ID.
6. Set `PORT` to the port supplied by your hosting provider (Bot-Hosting normally exposes this through its web allocation).

The dashboard never sends the OAuth access token to the browser; it is kept server-side in the Node process.


## BOT-ONLY EDITION
The web/VOID NEXUS dashboard has been removed. This package is Discord bot only.
