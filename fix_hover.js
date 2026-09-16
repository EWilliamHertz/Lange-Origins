import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(/mouseX: number;\n    mouseY: number;/, "mouseX: number;\n    mouseY: number;\n    cameraX: number;\n    cameraY: number;");
code = code.replace(/mouseX: 0, mouseY: 0,/, "mouseX: 0, mouseY: 0, cameraX: 0, cameraY: 0,");

const hoverLogic = `
    const checkPlayerHover = (x: number, y: number) => {
      const mx = x + gameState.current.cameraX;
      const my = y + gameState.current.cameraY;
      for (const [id, other] of Object.entries(gameState.current.otherPlayers)) {
        const px = other.x - (TILE_SIZE * 0.8) / 2;
        const py = other.y - (TILE_SIZE * 1.8) / 2;
        if (mx >= px && mx <= px + TILE_SIZE * 0.8 && my >= py && my <= py + TILE_SIZE * 1.8) {
          return { id, name: (other as any).name || id.substring(0, 4) };
        }
      }
      return null;
    };
`;

code = code.replace(/const updateMousePos = \(e: MouseEvent\) => \{/, hoverLogic + "\n    const updateMousePos = (e: MouseEvent) => {");

code = code.replace(/const handleContextMenu = \(e: MouseEvent\) => \{\n\s*e\.preventDefault\(\);\n\s*\};/, `const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (canvas.height / rect.height);
      const hoveredPlayer = checkPlayerHover(mx, my);
      if (hoveredPlayer && propsRef.current.onPlayerInteract) {
         propsRef.current.onPlayerInteract(hoveredPlayer.id, hoveredPlayer.name);
      }
    };`);

code = code.replace(/if \(key === 'm'\) \{/, `if (key === 'e') {
        const hoveredPlayer = checkPlayerHover(gameState.current.mouseX, gameState.current.mouseY);
        if (hoveredPlayer && propsRef.current.onPlayerInteract) {
           propsRef.current.onPlayerInteract(hoveredPlayer.id, hoveredPlayer.name);
        }
      }
      if (key === 'm') {`);

code = code.replace(/state\.cameraX \+= \(targetCameraX - state\.cameraX\) \* 0\.1;/, "state.cameraX += (targetCameraX - state.cameraX) * 0.1;\n      gameState.current.cameraX = state.cameraX;");
code = code.replace(/state\.cameraY \+= \(targetCameraY - state\.cameraY\) \* 0\.1;/, "state.cameraY += (targetCameraY - state.cameraY) * 0.1;\n      gameState.current.cameraY = state.cameraY;");

fs.writeFileSync('src/components/GameCanvas.tsx', code);
