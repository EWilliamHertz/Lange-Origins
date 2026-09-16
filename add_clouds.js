import fs from 'fs';
let code = fs.readFileSync('src/components/GameCanvas.tsx', 'utf8');

// I will add a clouds array to state and render them.
const addCloudsInit = `
    timeOfDay: number;
    clouds: {x: number, y: number, speed: number, size: number}[];
`;
code = code.replace(/timeOfDay: number;/, addCloudsInit);

const addCloudsState = `
    timeOfDay: 0.35, // Start in the morning
    clouds: Array(20).fill(0).map(() => ({
       x: Math.random() * 2000,
       y: 50 + Math.random() * 200,
       speed: 0.2 + Math.random() * 0.4,
       size: 40 + Math.random() * 60
    })),
`;
code = code.replace(/timeOfDay: 0\.35, \/\/ Start in the morning/, addCloudsState);

const addCloudsRender = `
      // Update and draw clouds
      ctx.fillStyle = state.timeOfDay > 0.2 && state.timeOfDay < 0.8 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(200, 200, 220, 0.1)';
      state.clouds.forEach(cloud => {
         cloud.x -= cloud.speed * (dt * 0.06);
         if (cloud.x < -200) {
            cloud.x = dimensions.width + 200;
            cloud.y = 50 + Math.random() * 200;
         }
         // Render fluffy cloud
         ctx.beginPath();
         ctx.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
         ctx.arc(cloud.x + cloud.size * 0.4, cloud.y - cloud.size * 0.2, cloud.size * 0.4, 0, Math.PI * 2);
         ctx.arc(cloud.x + cloud.size * 0.8, cloud.y, cloud.size * 0.4, 0, Math.PI * 2);
         ctx.arc(cloud.x + cloud.size * 0.4, cloud.y + cloud.size * 0.1, cloud.size * 0.5, 0, Math.PI * 2);
         ctx.fill();
      });

      ctx.save();
`;
code = code.replace(/ctx\.save\(\);\n\s*ctx\.translate\(-Math\.floor\(state\.cameraX\), -Math\.floor\(state\.cameraY\)\);/, addCloudsRender + "      ctx.translate(-Math.floor(state.cameraX), -Math.floor(state.cameraY));");

fs.writeFileSync('src/components/GameCanvas.tsx', code);
