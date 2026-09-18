# Lange: Origins — MMORPG Roadmap

This document lays out where *Lange: Origins* is heading as a browser-based, multiplayer
sandbox MMORPG, and how the next phases of work build on what already ships today.
It complements [`IMPROVEMENTS.md`](./IMPROVEMENTS.md), which tracks engineering quality
items; the roadmap here is the *game* trajectory and the foundation work it depends on.

## Vision

A persistent, session-based world where players pick a race and class, explore a procedurally
generated voxel world together, progress through skills and abilities, and shape a shared
economy — with server-authoritative rules so that progress means something.

## Where we are today (shipped)

- **Characters & progression** — four races and three classes (warrior / mage / archer) with
  per-combination sprite art, XP orbs, levels, stat points, skill points, and
  strength / dexterity / intelligence skills plus mining and woodcutting professions.
- **Unified Skills menu** — one `UnifiedMenu` (character, inventory, crafting, quests,
  **skill tree**, settings) instead of scattered panels; class abilities are upgraded with
  skill points and requirements are shown inline.
- **Combat** — 15+ class abilities (slash, whirlwind, dash, fireball, frostbolt, heal, shoot,
  snipe, trap, multishot, poison arrow, ground slam, battle shout, arcane blast, teleport),
  projectiles, unarmed actions, ammo, armor, and PvE mobs and bosses.
- **Action bars** — a 10-slot hotbar plus optional left/right action bars, with drag-and-drop
  from inventory/backpack, re-binding of abilities to keys, and number-key slot swaps.
- **World & crafting** — procedural biomes, mining/woodcutting, crafting and smelting, weapons,
  armor, grappling hook, chests and loot.
- **Multiplayer** — server browser, socket.io rooms backed by a bitECS entity system, chat,
  friends, parties of content like dungeons, PvP duels, gangs with gang trade, a marketplace,
  pets, quests, NPCs and merchants, and admin commands.
- **Persistence** — Firebase-backed character profiles with in-app creation, selection,
  deletion and save hydration.

## Guiding principles

1. **Server authority before new content.** Anything a client can validate, a cheater can
   forge. Gameplay mutations must be verified server-side before the surface area grows.
2. **One schema, versioned.** Character/profile data consolidates into a single versioned,
   validated schema so features like trading and seasons can rely on it.
3. **Prove it with tests.** Every progression milestone ships with regression coverage.
4. **Ship thin vertical slices.** Each phase delivers a playable, testable increment.

## Phase 1 — Trustworthy foundations (P0)

*Goal: make the existing game hard to cheat and safe to build on.*

- **Server-authoritative identity and combat.** Verify Firebase ID tokens on socket
  connection; derive UID/admin from verified claims instead of client-supplied email.
  Validate damage, cooldowns, range, inventory mutations and rewards in `GameRoom`.
- **One versioned character schema.** Consolidate `profiles` and `characters_v2`
  (including trading payloads) behind explicit validation and migrations; replace
  scattered JSON-string fields.
- **Character lifecycle tests.** Firebase-emulator coverage of
  create → select → enter → save → reload → delete, including permission and network
  failure paths; keep the Vitest regression suite green in CI.
- **Persistence feedback & recovery.** Save/save-pending/offline/error states, safe retries,
  and protection against stale multi-tab writes (revisions or transactions).

*Exit criteria:* a modified client cannot grant itself damage, items, XP or admin rights;
character state round-trips through the emulator test suite.

## Phase 2 — Progression depth

*Goal: make leveling and loot feel like an MMO.*

- **Unified ability progression UI.** Present skill-point upgrades and stat-unlocked class
  abilities together with rank, mana cost, cooldown, requirement and keybind label —
  extending the existing skill-tree tab.
- **Talent specializations.** Two paths per class (e.g. warrior → berserker / guardian) with
  capstone abilities; server-side talent effects.
- **Gear tiers & set bonuses.** Extend the armor system (cloth/leather/iron → tiered sets)
  with server-computed stats and a character-sheet gear score.
- **Professions 2.0.** Raise the mining/woodcutting model to all professions (smithing,
  alchemy, cooking) with recipe discovery and profession quests.
- **Loadout presets.** Named exploration/combat/mining presets with quick-equip comparisons
  and binding-conflict detection across all three action bars.

*Exit criteria:* a fresh character can reach the level cap through three distinct builds,
and all stat math is exercised by server-side tests.

## Phase 3 — World, social and endgame

*Goal: reasons to log in together.*

- **Parties & raids.** Formal party system (invite, roles, shared XP) scaling into 4–8 player
  dungeon raids with mechanics-driven bosses and loot rules.
- **World bosses & events.** Scheduled open-world spawn windows with server-side participation
  tracking and reward tables.
- **Guilds 2.0.** Evolve gangs into guilds: ranks, permissions, guild bank, guild chat, and
  guild-versus-guild events built on the existing gang-trade and duel systems.
- **Player economy.** Expand the marketplace into an auction house with listings, price
  history and anti-duplication safeguards tied to the versioned schema.
- **Housing & cosmetics.** Placeable structures on claimed plots; pure-cosmetic store
  (skins, title, banner) that never sells power.
- **PvP battlegrounds.** Scored, team-based matches reusing duel matchmaking, with seasonal
  ladders.

*Exit criteria:* a scheduled raid and a battleground run end-to-end on real servers with
observability (frame time, socket traffic, error rates) in place.

## Phase 4 — Live game operations

*Goal: run it like a service.*

- **Seasons & battle pass.** Rotating seasonal themes, cosmetic reward tracks, and a reset
  cadence that keeps ladders fresh.
- **Live events & GM tooling.** Admin panel for spawn control, announcements, mutes and
  rollbacks; event replay via structured logs.
- **Anti-cheat telemetry.** Heuristics for movement, combat-rate and economy anomalies,
  feeding review queues rather than auto-bans.
- **Performance & accessibility.** Bundle splitting for the large client chunk, lazy-loaded
  menus, keyboard-only inventory operation, focus management, reduced-motion support.
- **Onboarding.** Tutorial flow, suggested-first-quests, and account/character recovery
  helpers.

## Near-term work queue

| Order | Item | Phase |
| --- | --- | --- |
| 1 | Token-verified socket auth + server-side combat validation | 1 |
| 2 | Versioned character schema + migrations | 1 |
| 3 | Emulator-based lifecycle tests in CI | 1 |
| 4 | Unified ability progression view in the skills tab | 2 |
| 5 | Loadout presets for the three action bars | 2 |
| 6 | Party system groundwork (invites, shared XP) | 3 |

## Tracking

- Engineering-quality backlog and verification notes: [`IMPROVEMENTS.md`](./IMPROVEMENTS.md).
- Regression suite: `npm test` (Vitest) — keep green on every change; type check with
  `npm run lint`.
