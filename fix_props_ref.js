import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

const oldRef = `  const propsRef = useRef({ nickname, selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onPlayerInteract, onTradeRequest, onGangInvite, onDepthChange, onBlockPlaced });
  useEffect(() => {
    propsRef.current = { nickname, currentGang, onFireWeapon, characterSkin, helmet, chestplate, selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onPlayerInteract, onTradeRequest, onGangInvite, onDepthChange, onBlockPlaced };
  }, [nickname, selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onPlayerInteract, onTradeRequest, onGangInvite, onDepthChange, onBlockPlaced]);`;

const newRef = `  const propsRef = useRef({ nickname, currentAmmoCount, selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onPlayerInteract, onTradeRequest, onGangInvite, onDepthChange, onBlockPlaced, currentGang, onFireWeapon, characterSkin, helmet, chestplate });
  useEffect(() => {
    propsRef.current = { nickname, currentAmmoCount, currentGang, onFireWeapon, characterSkin, helmet, chestplate, selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onPlayerInteract, onTradeRequest, onGangInvite, onDepthChange, onBlockPlaced };
  }, [nickname, currentAmmoCount, currentGang, onFireWeapon, characterSkin, helmet, chestplate, selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onPlayerInteract, onTradeRequest, onGangInvite, onDepthChange, onBlockPlaced]);`;

code = code.replace(oldRef, newRef);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
