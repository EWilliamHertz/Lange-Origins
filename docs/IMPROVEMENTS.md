# Lange: Origins — improvement plan

## Changes in this pass

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
| P0 | Server-authoritative identity and combat | Verify Firebase ID tokens on socket connection; derive UID/admin access from verified claims, not client-supplied email. Validate damage, cooldowns, range, inventory and rewards on the server. |
| P0 | One versioned character schema | Consolidate `profiles` and `characters_v2` references, including trading. Add explicit schema validation and migrations instead of scattered JSON strings/defaults. |
| P0 | Automated character lifecycle tests | Use the Firebase emulator and browser tests for create → select → enter → save → reload → delete, including permission/network failures, slow requests and multiple accounts. |
| P1 | Loadout presets | Named exploration/combat/mining presets, quick-equip comparisons, binding conflicts, and a clear selected-slot indicator across all action bars. |
| P1 | Complete the asset catalog | Inventory race/class/armor combinations, produce missing artwork, then validate the catalog in CI. Add a preload/loading indicator for essential player sprites. |
| P1 | Unify ability progression | Present skill-point upgrades and stat-unlocked class abilities together; clearly label requirements, mana cost, cooldown, rank and binding. |
| P1 | Persistence feedback and recovery | Show saving/saved/offline/error states, retry safely, and protect against stale multi-tab writes with revisions or transactions. |
| P1 | Responsive and accessible controls | Test narrow screens, keyboard-only inventory operation, focus management, touch targets, contrast and reduced-motion settings. |
| P2 | Smaller startup bundle | Split lobby/menu/game code and lazy-load optional features. The production build still warns about a large JavaScript chunk. |
| P2 | Refactor large components | Extract character persistence, notifications, inventory, combat and sprite handling into focused modules with typed interfaces. Archive root-level one-off patch scripts. |
| P2 | Gameplay feedback | Add unarmed mining/tool-required hints, clear hit feedback, quest reward summaries and a dismissible notification history. |
| P2 | Performance/diagnostics | Measure frame time, socket traffic and asset errors; add reproducible profiling scenarios for dense worlds and multiplayer combat. |

## Verification

Automated checks completed:

- `npm test`: six regression tests covering legacy inventory migration, defaults, empty hands, notification expiry, sprite resolution and retry behavior.
- `npm run lint`: TypeScript passes.
- `npm run build`: client and server production builds pass (large-chunk warning remains).
- npm lockfile synchronized so `npm ci` can install the declared dependencies.

Authenticated multiplayer/browser flows were not exercised in this workspace. Before release, manually check:

1. Character/ability layout at narrow and wide viewport sizes; inventory and both optional side bars.
2. Two characters with different gear, class, skills, quests and keybinds; switch repeatedly, enter/leave, and reload.
3. Delete cancellation, successful deletion, last-character deletion and denied/offline deletion; confirm a deleted character stays deleted after a pending save.
4. Every empty primary hotbar position: punch a mob, auto-attack, mine dirt/wood; ensure stone still requires a pickaxe.
5. Complete a quest and wait five seconds; manually dismiss a toast and verify unrelated invitations remain.
6. Missing race/armor sprite combinations and a failed image request followed by recovery.
