const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

// add to props signature
code = code.replace(
  "socketRef, onFireWeapon, currentAmmoCount, duelingOpponents }: GameProps)",
  "socketRef, onFireWeapon, currentAmmoCount, duelingOpponents, skills }: GameProps)"
);

// add to propsRef
code = code.replace(
  "onChestUpdated, helmet, chestplate });",
  "onChestUpdated, helmet, chestplate, skills });"
);
code = code.replace(
  "onChestUpdated, helmet, chestplate };\n  }, [",
  "onChestUpdated, helmet, chestplate, skills };\n  }, ["
);
code = code.replace(
  "helmet, chestplate]);",
  "helmet, chestplate, skills]);"
);

// fix updatePhysics call
code = code.replace(
  "updatePhysics(player, world, state.keys);",
  "updatePhysics(player, world, state.keys, propsRef.current.skills?.speed || 0);"
);

// fix player max health
code = code.replace(
  "const prevHealth = player.health;",
  "const prevHealth = player.health;\n      player.maxHealth = 20 + (propsRef.current.skills?.vitality || 0) * 10;"
);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log('Fixed GameCanvas skills integration');
