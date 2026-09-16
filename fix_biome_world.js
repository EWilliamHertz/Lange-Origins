import fs from 'fs';
let code = fs.readFileSync('src/lib/world.ts', 'utf8');

// The noise functions use simple 1D noise which generates very small values near 0 because they are unscaled coordinates, or they don't swing far enough.
// Let's multiply the noise results or change the thresholds!
// If moisture is between -1 and 1, maybe it never gets below -0.3 often enough?
const oldBiome = `    // Determine biome properties based on moisture and temperature
    const moisture = moistureNoise.get(x * 0.002); // -1 to 1 roughly
    const temperature = temperatureNoise.get(x * 0.0025); // -1 to 1

    const isCold = temperature < -0.3; // Snow biome
    const isDesert = moisture < -0.3 && !isCold; // Don't make it desert if it's freezing`;

const newBiome = `    // Determine biome properties based on moisture and temperature
    // Multiply by a larger scale to get wider variance
    const moisture = moistureNoise.get(x * 0.004) * 1.5; 
    const temperature = temperatureNoise.get(x * 0.005) * 1.5;

    const isCold = temperature < -0.1; // Make snow much more common!
    const isDesert = moisture < -0.1 && !isCold; // Make desert much more common!`;

code = code.replace(oldBiome, newBiome);
fs.writeFileSync('src/lib/world.ts', code);
