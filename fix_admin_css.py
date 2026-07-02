with open('style.css', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if '#admin_dashboard > div { height: 95vh !important; }' in line:
        continue
    if '#admin_dashboard > div > div { flex-direction: column !important; }' in line:
        new_lines.append('    #admin_dashboard > div:nth-child(2) { flex-direction: column !important; }\n')
        continue
    if '#admin_dashboard > div > div > div:first-child' in line:
        new_lines.append('    #admin_dashboard > div:nth-child(2) > div:first-child { width: 100% !important; flex-direction: row !important; border-right: none !important; border-bottom: 1px solid #e2e8f0; overflow-x: auto; white-space: nowrap; }\n')
        continue
    new_lines.append(line)

with open('style.css', 'w') as f:
    f.writelines(new_lines)
