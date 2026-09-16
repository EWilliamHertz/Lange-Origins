const fs = require('fs');

let gameCanvas = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const propsRefDef = `
  const propsRef = useRef({ nickname, currentAmmoCount, selectedBlock, isInventoryOpen, onHealthChange, onArmorDamage, onBlockMined, onInteract, onPlayerInteract, onTradeRequest, onGangInvite, onDepthChange, onBlockPlaced, currentGang, onFireWeapon, characterSkin, duelingOpponents, onDuelRequest, onDuelStarted, onChestData, onChestUpdated, helmet, chestplate });
  useEffect(() => {
    propsRef.current = { nickname, currentAmmoCount, selectedBlock, isInventoryOpen, onHealthChange, onArmorDamage, onBlockMined, onInteract, onPlayerInteract, onTradeRequest, onGangInvite, onDepthChange, onBlockPlaced, currentGang, onFireWeapon, characterSkin, duelingOpponents, onDuelRequest, onDuelStarted, onChestData, onChestUpdated, helmet, chestplate };
  }, [nickname, currentAmmoCount, selectedBlock, isInventoryOpen, onHealthChange, onArmorDamage, onBlockMined, onInteract, onPlayerInteract, onTradeRequest, onGangInvite, onDepthChange, onBlockPlaced, currentGang, onFireWeapon, characterSkin, duelingOpponents, onDuelRequest, onDuelStarted, onChestData, onChestUpdated, helmet, chestplate]);
`;

gameCanvas = gameCanvas.replace(/  const propsRef = useRef\(\{ nickname,[\s\S]*?\}, \[nickname,[\s\S]*?\]\);/, propsRefDef.trim());

fs.writeFileSync('src/components/GameCanvas.tsx', gameCanvas);
console.log("propsRef fixed.");
