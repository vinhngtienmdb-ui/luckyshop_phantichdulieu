with open('index.html', 'r') as f:
    content = f.read()
    
content = content.replace('⚙️ Cấu HÌnh</button>', '⚙️ Cấu Hình</button>')

with open('index.html', 'w') as f:
    f.write(content)
