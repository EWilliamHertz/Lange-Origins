import fs from 'fs';
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const skyVisuals = `
      {/* Sky & Clouds Background */}
      <div className="absolute inset-0 z-0">
        {/* Sun */}
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, 360] }}
          transition={{ scale: { repeat: Infinity, duration: 10, ease: "easeInOut" }, rotate: { repeat: Infinity, duration: 200, ease: "linear" } }}
          className="absolute top-10 right-20 w-32 h-32 bg-yellow-300 rounded-full blur-[2px] shadow-[0_0_100px_40px_rgba(253,224,71,0.6)]"
        />

        <motion.div 
          animate={{ x: ['-10%', '110%'] }} 
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          className="absolute top-20 left-0 text-white/40"
        >
          <Cloud size={120} />
        </motion.div>
        
        <motion.div 
          animate={{ x: ['-20%', '120%'] }} 
          transition={{ repeat: Infinity, duration: 60, ease: "linear", delay: 10 }}
          className="absolute top-40 left-0 text-white/30"
        >
          <Cloud size={180} />
        </motion.div>
        <motion.div 
          animate={{ x: ['-15%', '115%'] }} 
          transition={{ repeat: Infinity, duration: 50, ease: "linear", delay: 25 }}
          className="absolute top-10 left-0 text-white/50"
        >
          <Cloud size={90} />
        </motion.div>
        
        {/* Additional slow moving clouds */}
        <motion.div 
          animate={{ x: ['-30%', '130%'] }} 
          transition={{ repeat: Infinity, duration: 80, ease: "linear", delay: 5 }}
          className="absolute top-32 left-0 text-white/20"
        >
          <Cloud size={200} />
        </motion.div>
      </div>
`;

code = code.replace(/\{\/\* Sky & Clouds Background \*\/\}\n\s*<div className="absolute inset-0 z-0">[\s\S]*?<\/div>\n\s*\{\/\* Animated Foreground Scene \*\/\}/, skyVisuals + "\n      {/* Animated Foreground Scene */}");

fs.writeFileSync('src/components/LandingPage.tsx', code);
