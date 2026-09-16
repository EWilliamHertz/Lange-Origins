import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

// The easiest way to forcefully wipe everything without credentials issues in this sandbox
// is to temporarily intercept a regular ping or connection to wipe all rooms.
// Actually, let's just clear the activeRooms object inside server.ts for a forced restart.
const target = `  const activeRooms: Record<string, {`;
const inject = `  // Forced wipe
  `;

// Instead of rewriting server.ts to wipe, let's just restart the node process with a clean state.
// Since activeRooms is stored in memory, restarting the dev server wipes the worlds!
