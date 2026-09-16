const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const stateAddition = `
  const [leftActionBar, setLeftActionBar] = useState<InventorySlot[]>(Array(10).fill(null));
  const [rightActionBar, setRightActionBar] = useState<InventorySlot[]>(Array(10).fill(null));
  const [showLeftActionBar, setShowLeftActionBar] = useState(false);
  const [showRightActionBar, setShowRightActionBar] = useState(false);
`;

code = code.replace(
  "const [chestInventory, setChestInventory] = useState<InventorySlot[]>(() => Array(27).fill(null));",
  "const [chestInventory, setChestInventory] = useState<InventorySlot[]>(() => Array(27).fill(null));\n" + stateAddition
);

const handleSlotAddition = `
    let currentSlot = null;
    let setSlot: (newSlot: InventorySlot) => void = () => {};

    if (type === 'leftActionBar') {
       currentSlot = leftActionBar[index];
       setSlot = (newSlot) => {
          setLeftActionBar(prev => {
             const next = [...prev];
             next[index] = newSlot;
             return next;
          });
       };
    } else if (type === 'rightActionBar') {
       currentSlot = rightActionBar[index];
       setSlot = (newSlot) => {
          setRightActionBar(prev => {
             const next = [...prev];
             next[index] = newSlot;
             return next;
          });
       };
    } else if (type === 'hotbar') {
`;

code = code.replace(
  "if (type === 'hotbar') {",
  handleSlotAddition.trim()
);

fs.writeFileSync('src/App.tsx', code);
console.log('Action bars state patched.');
