import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(/onInteract\?: \(blockType: BlockType, tx: number, ty: number\) => void;/, "onInteract?: (blockType: BlockType, tx: number, ty: number) => void;\n  onPlayerInteract?: (playerId: string, playerName: string) => void;");
code = code.replace(/export default function Game\(\{[\s\S]*?socketRef \}: GameProps\) \{/, "export default function Game({ nickname, selectedBlock, roomId, isInventoryOpen, onHealthChange, sendChatMsg, onChatMessage, onBlockMined, onBlockPlaced, onInteract, onPlayerInteract, onDepthChange, socketRef }: GameProps) {");

code = code.replace(/const propsRef = useRef\(\{ selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onDepthChange, onBlockPlaced \}\);/g, "const propsRef = useRef({ selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onPlayerInteract, onDepthChange, onBlockPlaced });");
code = code.replace(/propsRef\.current = \{ selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onDepthChange, onBlockPlaced \};/g, "propsRef.current = { selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onPlayerInteract, onDepthChange, onBlockPlaced };");
code = code.replace(/\[selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onDepthChange, onBlockPlaced\]\)/g, "[selectedBlock, isInventoryOpen, onHealthChange, onBlockMined, onInteract, onPlayerInteract, onDepthChange, onBlockPlaced])");

fs.writeFileSync('src/components/GameCanvas.tsx', code);
