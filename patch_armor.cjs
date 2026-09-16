const fs = require('fs');
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(
  'onHealthChange: (health: number) => void;',
  'onHealthChange: (health: number) => void;\n  onArmorDamage?: () => void;'
);

code = code.replace(
  'export default function Game({ nickname, characterSkin, helmet, chestplate, selectedBlock, roomId, isInventoryOpen, onHealthChange, sendChatMsg, onChatMessage, onBlockMined, onBlockPlaced, onInteract, onPlayerInteract, onDepthChange, onTradeRequest, onGangInvite, onFriendRequest, currentGang, socketRef, onFireWeapon, currentAmmoCount }: GameProps) {',
  'export default function Game({ nickname, characterSkin, helmet, chestplate, selectedBlock, roomId, isInventoryOpen, onHealthChange, onArmorDamage, sendChatMsg, onChatMessage, onBlockMined, onBlockPlaced, onInteract, onPlayerInteract, onDepthChange, onTradeRequest, onGangInvite, onFriendRequest, currentGang, socketRef, onFireWeapon, currentAmmoCount }: GameProps) {'
);

code = code.replace(
  'const propsRef = useRef({ nickname, currentAmmoCount, selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onPlayerInteract, onTradeRequest, onGangInvite, onDepthChange, onBlockPlaced, currentGang, onFireWeapon, characterSkin, helmet, chestplate });',
  'const propsRef = useRef({ nickname, currentAmmoCount, selectedBlock, isInventoryOpen, onHealthChange, onArmorDamage, onBlockMined, onInteract, onPlayerInteract, onTradeRequest, onGangInvite, onDepthChange, onBlockPlaced, currentGang, onFireWeapon, characterSkin, helmet, chestplate });'
);

code = code.replace(
  '    propsRef.current = { nickname, currentAmmoCount, currentGang, onFireWeapon, characterSkin, helmet, chestplate, selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onPlayerInteract, onTradeRequest, onGangInvite, onDepthChange, onBlockPlaced };\n  }, [nickname, currentAmmoCount, currentGang, onFireWeapon, characterSkin, helmet, chestplate, selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onPlayerInteract, onTradeRequest, onGangInvite, onDepthChange, onBlockPlaced]);',
  '    propsRef.current = { nickname, currentAmmoCount, currentGang, onFireWeapon, characterSkin, helmet, chestplate, selectedBlock, isInventoryOpen, onHealthChange, onArmorDamage, onBlockMined, onInteract, onPlayerInteract, onTradeRequest, onGangInvite, onDepthChange, onBlockPlaced };\n  }, [nickname, currentAmmoCount, currentGang, onFireWeapon, characterSkin, helmet, chestplate, selectedBlock, isInventoryOpen, onHealthChange, onArmorDamage, onBlockMined, onInteract, onPlayerInteract, onTradeRequest, onGangInvite, onDepthChange, onBlockPlaced]);'
);

// Apply damage to armor
const takeDamageRepl = `          const mitigation = hMitig + cMitig;
          const finalDamage = Math.max(1, Math.floor(data.damage * (1 - mitigation)));
          p.health = Math.max(0, p.health - finalDamage);
          if (mitigation > 0 && propsRef.current.onArmorDamage) {
             propsRef.current.onArmorDamage();
          }`;

code = code.replace(
  `          const mitigation = hMitig + cMitig;
          const finalDamage = Math.max(1, Math.floor(data.damage * (1 - mitigation)));
          p.health = Math.max(0, p.health - finalDamage);`,
  takeDamageRepl
);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
console.log("Success");
