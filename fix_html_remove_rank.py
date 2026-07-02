import re
with open('index.html', 'r') as f:
    content = f.read()

content = re.sub(r'                <div id="user_default_rank_container".*?</div>\n', '', content, flags=re.DOTALL)

with open('index.html', 'w') as f:
    f.write(content)
