import os
import re

files_to_process = [
    'src/App.tsx',
    'src/components/GameCanvas.tsx',
    'server.ts'
]

def replace_gang(text):
    text = re.sub(r'\bgangId\b', 'partyId', text)
    text = re.sub(r'\bonGangInvite\b', 'onPartyInvite', text)
    text = re.sub(r'\bcurrentGang\b', 'currentParty', text)
    text = re.sub(r'\bsend_gang_invite\b', 'send_party_invite', text)
    text = re.sub(r'\bgang_invite\b', 'party_invite', text)
    text = re.sub(r'\baccept_gang_invite\b', 'accept_party_invite', text)
    text = re.sub(r'\bgang_update\b', 'party_update', text)
    text = re.sub(r'\bleave_gang\b', 'leave_party', text)
    text = re.sub(r'\bkick_gang\b', 'kick_party', text)
    text = re.sub(r'\bgang\b', 'party', text)
    text = re.sub(r'\bgangs\b', 'parties', text)
    text = re.sub(r'\bGang\b', 'Party', text)
    text = re.sub(r'\bGangs\b', 'Parties', text)
    return text

for file_path in files_to_process:
    with open(file_path, 'r') as f:
        content = f.read()
    
    new_content = replace_gang(content)
    
    with open(file_path, 'w') as f:
        f.write(new_content)

print("Done replacing gang with party.")
