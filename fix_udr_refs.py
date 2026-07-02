import re
with open('app.js', 'r') as f:
    content = f.read()

content = re.sub(r'        const udrContainer = document\.getElementById\(\s*"user_default_rank_container",\s*\);\s*if \(udrContainer\) udrContainer\.style\.display = "flex";', '', content)
content = re.sub(r'        const udrContainer = document\.getElementById\(\s*"user_default_rank_container",\s*\);\s*if \(udrContainer\) udrContainer\.style\.display = "none";', '', content)
content = re.sub(r'            const udr = document\.getElementById\("user_default_rank"\);\s*if \(udr && udr\.value !== data\.rank\) \{\s*udr\.value = data\.rank;', '            if (true) {', content)

with open('app.js', 'w') as f:
    f.write(content)
