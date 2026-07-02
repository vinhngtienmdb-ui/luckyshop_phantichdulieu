with open('index.html', 'r') as f:
    content = f.read()
content = content.replace("           </div>\n       </div>\n    </div>", "           </div>\n       </div>\n    </main>")
with open('index.html', 'w') as f:
    f.write(content)
