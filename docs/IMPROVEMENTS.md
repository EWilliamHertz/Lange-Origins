# Lange: Origins — improvement plan

## Phase 1 security pass (2026-09-18)

- **Token-verified identity.** Socket connections hand a Firebase ID token to
  the server on the handshake; the server verifies it (firebase-admin) and
  derives uid/email/admin from the claims. Client-asserted emails are ignored
  everywhere — socket `join_room`, chat admin commands, and the
  `/api/admin/*` + `/api/servers/:id/reset` REST endpoints (which previously
  trusted an `email` field in the body, and `/reset` which had no auth at
  all) now require a verified admin token. Without credentials (local dev)
  the server degrades to non-admin guest mode instead of failing.
- **Server-side combat validation.** Melee hits (`hit_mob`/`hit_player`) are
  checked for range (≤96px), swing cooldown (250ms) and a damage cap;
  projectiles get server-authoritative damage/lifetime, speed caps, and must
  originate at the shooter; abilities are gated by server-enforced cooldowns;
  block edits must be within 6-block reach and AdminBrick is admin-only;
  item spawns are admin-only; pickups require proximity; chests and trade
  offers pass through the inventory sanitizer; trade handlers derive the
  caller's side from membership so third parties can't mutate or force-confirm
  trades. Verified uid is the only uid recorded — guest-claimed uids are
  dropped, closing a trade impersonation hole.
- **Versioned character schema.** `src/lib/characterSchema.ts` is the single
  source of truth (schema v2): decode validates + migrates every loaded doc,
  encode validates every save. Unknown item types, forged counts/stats,
  corrupt JSON and out-of-range values are rejected or clamped. Server-side
  trades now read `characters_v2` (they pointed at the old `profiles`
  collection) and parse inventories through the sanitizer.
- **Stale-write protection.** Saves run in a Firestore transaction against a
  `revision` counter; a lagging tab gets `StaleCharacterError`, adopts the
  remote revision and retries once. Deleted characters are detected
  (`CharacterMissingError`) instead of being silently recreated.
- **Lifecycle tests & CI.** Emulator-based suite covering
  create → load → save → reload → stale rejection → delete plus owner-only
  permission enforcement (runs via `npm run test:emulators` and the
  `lifecycle-emulators` CI job). New GitHub Actions CI runs lint + unit tests
  + build, and the emulator lifecycle suite.

## Previous pass (UI & loadout)

- **Ability layout:** the skill-point banner and ability grid now span the character menu's full width instead of occupying one column of a 12-column grid.
- **Loadout:** responsive backpack layout, editable optional side action bars, slot accessibility labels and clearer interaction instructions. Granting the starter grappling hook no longer overwrites an occupied slot.
- **Character deletion:** in-app confirmation (no dependency on browser confirmation dialogs), awaited Firestore deletion, pending/error feedback, and complete hydration of the next character. Saves update existing documents rather than recreating deleted ones.
- **Character identity:** authentication loading no longer reruns on screen changes. Selection is remembered per account, all saved fields receive defaults when switching, and lobby snapshots update on save/exit. Character creation waits for persistence before selecting the new character.
- **Empty hands:** new characters start without a fists item; legacy fists are removed from inventory/equipment/action bars when loaded. Empty slots support direct melee, auto-attacks and mining soft blocks. Stone/ore still require a pickaxe.
- **Notifications:** a single expiry mechanism covers quest completion and level-up messages (5 seconds); interaction requests get 30 seconds. Timers are cleaned up on updates/unmount.
- **Sprites:** lobby and world share a shipped-asset resolver, with unarmored/same-class human fallbacks for missing variants. Failed image requests can retry after 30 seconds. Armor previews correctly read equipment item IDs.

Missing artwork is **not newly created**: fallbacks keep characters visible but do not provide distinct art for every race/class/armor combination.

## Prioritized enhancements

| Priority | Improvement | Why / suggested next step |
| --- | --- | --- |
| P0 | Server-authoritative identity and combat | ✅ Done (Phase 1 pass): token-verified sockets + admin REST, server-validated damage/cooldowns/ranges/inventories. Next: move player stats server-side so projectile/melee bonus damage is computed, not capped. |
| P0 | One versioned character schema | ✅ Done (Phase 1 pass): schema v2 with decode/encode validation and migrations; trades consolidated on `characters_v2`. Next: promote the stricter DRAFT Firestore rules once live data is migrated. |
| P0 | Automated character lifecycle tests | ✅ Emulator suite + CI job added. First CI run validates the emulator job; then extend to enter-world/save-from-gameplay flows. |
| P1 | Loadout presets | Named exploration/combat/mining presets, quick-equip comparisons, binding conflicts, and a clear selected-slot indicator across all action bars. |
| P1 | Complete the asset catalog | Inventory race/class/armor combinations, produce missing artwork, then validate the catalog in CI. Add a preload/loading indicator for essential player sprites. |
| P1 | Unify ability progression | Present skill-point upgrades and stat-unlocked class abilities together; clearly label requirements, mana cost, cooldown, rank and binding. |
| P1 | Persistence feedback and recovery | Stale multi-tab protection ✅ (revision transactions). Remaining: visible saving/saved/offline/error indicators in the HUD. |
| P1 | Responsive and accessible controls | Test narrow screens, keyboard-only inventory operation, focus management, touch targets, contrast and reduced-motion settings. |
| P2 | Smaller startup bundle | Split lobby/menu/game code and lazy-load optional features. The production build still warns about a large JavaScript chunk. |
| P2 | Refactor large components | Extract character persistence, notifications, inventory, combat and sprite handling into focused modules with typed interfaces. Archive root-level one-off patch scripts. |
| P2 | Gameplay feedback | Add unarmed mining/tool-required hints, clear hit feedback, quest reward summaries and a dismissible notification history. |
| P2 | Performance/diagnostics | Measure frame time, socket traffic and asset errors; add reproducible profiling scenarios for dense worlds and multiplayer combat. |

## Verification

Automated checks completed:

- `npm test`: 45 unit tests — the original six regression tests plus schema
  decode/migrate, auth claims/token verification, and combat validation
  coverage. The emulator lifecycle suite (2 tests) skips without emulators.
- `npm run lint`: TypeScript passes.
- `npm run build`: client and server production builds pass (large-chunk warning remains).
- Server smoke-tested locally: forged socket tokens rejected at the handshake,
  guest joins work with admin/spoofed-uid claims dropped, and all admin REST
  endpoints return 403 without a verified bearer token.
- `npm run test:emulators`: character lifecycle + permission suite against the
  Auth/Firestore emulators (also wired into CI).
- npm lockfile synchronized so `npm ci` can install the declared dependencies.

Authenticated multiplayer/browser flows were not exercised in this workspace. Before release, manually check:

1. Character/ability layout at narrow and wide viewport sizes; inventory and both optional side bars.
2. Two characters with different gear, class, skills, quests and keybinds; switch repeatedly, enter/leave, and reload.
3. Delete cancellation, successful deletion, last-character deletion and denied/offline deletion; confirm a deleted character stays deleted after a pending save.
4. Every empty primary hotbar position: punch a mob, auto-attack, mine dirt/wood; ensure stone still requires a pickaxe.
5. Complete a quest and wait five seconds; manually dismiss a toast and verify unrelated invitations remain.
6. Missing race/armor sprite combinations and a failed image request followed by recovery.
