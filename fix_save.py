with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("placeholder=\"Enter Nickname...\"", "onBlur={saveProgress}\n                        placeholder=\"Enter Nickname...\"")

# And for joinServer
content = content.replace("setAppState('playing');\n  };", "saveProgress();\n    setAppState('playing');\n  };")

with open('src/App.tsx', 'w') as f:
    f.write(content)
