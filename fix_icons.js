import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/Heart, MessageSquare, ArrowRight, Hand, LogOut, User, Star, Clock, Globe, Scroll, X, Book, Shield, Plus, Layers/g, "Heart, MessageSquare, ArrowRight, Hand, LogOut, User, Star, Clock, Globe, Scroll, X, Book, Shield, Plus, Layers, ShoppingBag");

fs.writeFileSync('src/App.tsx', code);
