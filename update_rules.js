import fs from 'fs';
let rules = fs.readFileSync('firestore.rules', 'utf8');

const newRuleStr = `
    function isValidProfile(data) {
      return data.keys().hasAll(['name', 'skin', 'health', 'hotbar', 'backpack', 'quests', 'updatedAt'])
        && data.name is string
        && data.name.size() <= 32
        && data.skin is string
        && data.skin.size() <= 16
        && data.health is number
        && data.health >= 0
        && data.health <= 100
        && data.hotbar is string
        && data.hotbar.size() <= 10000
        && data.backpack is string
        && data.backpack.size() <= 20000
        && data.quests is string
        && data.quests.size() <= 20000
        && data.updatedAt == request.time;
    }

    match /users/{userId}/profiles/{profileId} {
      allow read: if isSignedIn() && request.auth.uid == userId;
      allow create: if isSignedIn() && request.auth.uid == userId && isValidId(userId) && isValidId(profileId) && isValidProfile(incoming());
      allow update: if isSignedIn() && request.auth.uid == userId && isValidId(userId) && isValidId(profileId) && isValidProfile(incoming());
      allow delete: if isSignedIn() && request.auth.uid == userId;
    }
`;

rules = rules.replace(/match \/users\/\{userId\} \{/, newRuleStr + "\n    match /users/{userId} {");
fs.writeFileSync('firestore.rules', rules);
