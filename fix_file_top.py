import re

content = open('src/App.tsx').read()
content = content.replace("import { Wind, Snowflake, Crosshair, Tent, FastForward, Activity } from 'lucide-react';", "")

abilities_block = """
export const MMO_ABILITIES = [
    { id: 'slash', class: 'warrior', name: 'Slash', desc: 'Melee attack dealing standard physical damage.', req: 0, cost: 0, cd: 3, icon: <Sword size={24}/> },
    { id: 'whirlwind', class: 'warrior', name: 'Whirlwind', desc: 'Spinning attack damaging all nearby enemies.', req: 3, cost: 15, cd: 8, icon: <Wind size={24}/> },
    { id: 'dash', class: 'warrior', name: 'Dash', desc: 'Lunge forward quickly.', req: 5, cost: 10, cd: 5, icon: <FastForward size={24}/> },
    { id: 'fireball', class: 'mage', name: 'Fireball', desc: 'Shoot a flaming projectile.', req: 0, cost: 10, cd: 5, icon: <Flame size={24}/> },
    { id: 'frostbolt', class: 'mage', name: 'Frostbolt', desc: 'Launch ice that slows enemies.', req: 3, cost: 15, cd: 6, icon: <Snowflake size={24}/> },
    { id: 'heal', class: 'mage', name: 'Heal', desc: 'Restore 20 HP.', req: 5, cost: 20, cd: 10, icon: <Heart size={24}/> },
    { id: 'shoot', class: 'archer', name: 'Shoot', desc: 'Fire a fast arrow.', req: 0, cost: 0, cd: 2, icon: <Crosshair size={24}/> },
    { id: 'snipe', class: 'archer', name: 'Snipe', desc: 'A devastating heavy shot.', req: 3, cost: 20, cd: 10, icon: <Crosshair size={24} className="text-red-500" /> },
    { id: 'trap', class: 'archer', name: 'Trap', desc: 'Place a trap that damages enemies.', req: 5, cost: 15, cd: 15, icon: <Tent size={24}/> },
];
"""

content = content.replace(abilities_block, "")

# Find the lucide-react import
import_idx = content.find("import {")
end_import_idx = content.find("} from 'lucide-react';")
if import_idx != -1 and end_import_idx != -1:
    content = content[:end_import_idx] + ", Wind, Snowflake, Crosshair, Tent, FastForward, Activity " + content[end_import_idx:]

# insert abilities block after imports
after_imports = content.find("import ", end_import_idx)
if after_imports == -1:
    after_imports = end_import_idx + 30
else:
    while content[after_imports:].startswith("import "):
        after_imports = content.find("\n", after_imports) + 1

content = content[:after_imports] + abilities_block + content[after_imports:]

open('src/App.tsx', 'w').write(content)
