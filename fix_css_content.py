with open('style.css', 'r') as f:
    content = f.read()

if '.admin-content {' not in content.split('/* Media Queries */')[0]:
    content = content + "\n\n/* Admin Content */\n.admin-content { display: none; }\n.admin-content.active { display: block; }\n"

with open('style.css', 'w') as f:
    f.write(content)
