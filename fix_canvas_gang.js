import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

code = code.replace(/onGangInvite\?: \(senderId: string, senderName: string\) => void;/, 
`onGangInvite?: (senderId: string, senderName: string) => void;
  currentGang?: any;`);

code = code.replace(/currentGang, socketRef/, "currentGang, socketRef");
code = code.replace(/onTradeRequest, onGangInvite, socketRef \}: GameProps/, "onTradeRequest, onGangInvite, currentGang, socketRef }: GameProps");
code = code.replace(/propsRef\.current = \{/, "propsRef.current = { currentGang,");

code = code.replace(/const drawPlayer = \(pX: number, pY: number, pVx: number, facingRight: boolean, colorBase: string, name: string, tool: BlockType \| null = null, isMining: boolean = false\) => \{/, 
`const drawPlayer = (pX: number, pY: number, pVx: number, facingRight: boolean, colorBase: string, name: string, tool: BlockType | null = null, isMining: boolean = false, isGangMember: boolean = false) => {`);

code = code.replace(/ctx\.fillRect\(pX \- 4, pY \- 10 \+ bodyYOffset, pWidth \+ 8, 20\);/, 
`ctx.fillRect(pX - 4, pY - 10 + bodyYOffset, pWidth + 8, 20);
        if (isGangMember) {
            ctx.strokeStyle = '#4ADE80';
            ctx.lineWidth = 2;
            ctx.strokeRect(pX - 5, pY - 11 + bodyYOffset, pWidth + 10, 22);
        }`);

code = code.replace(/drawPlayer\(other\.x, other\.y, other\.vx, other\.facingRight, 'blue', \(other as any\)\.name \|\| other\.id\.substring\(0, 4\), other\.tool, other\.isMining\);/, 
`const isGang = propsRef.current.currentGang?.members?.includes(other.id);
        drawPlayer(other.x, other.y, other.vx, other.facingRight, 'blue', (other as any).name || other.id.substring(0, 4), other.tool, other.isMining, isGang);`);

fs.writeFileSync('src/components/GameCanvas.tsx', code);
