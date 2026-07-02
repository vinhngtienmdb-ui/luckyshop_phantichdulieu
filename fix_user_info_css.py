with open('style.css', 'r') as f:
    content = f.read()

old_css = """    button { font-size: 0.7rem !important; padding: 4px 8px !important; border-radius: 4px !important; }"""
new_css = """    button { font-size: 0.7rem !important; padding: 4px 8px !important; border-radius: 4px !important; }
    
    #user_info {
        font-size: 0.75rem !important;
    }
    
    #user_default_rank {
        font-size: 0.75rem !important;
        padding: 2px 4px !important;
    }"""

content = content.replace(old_css, new_css)

with open('style.css', 'w') as f:
    f.write(content)
