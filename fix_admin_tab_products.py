import re
with open('index.html', 'r') as f:
    content = f.read()

tab_html = """                   <div id="admin_tab_products" class="admin-content" style="display: none; height: 100%; flex-direction: column;">
                       <h2 class="card-title">📦 Quản Lý Sản Phẩm Gom Nhóm</h2>
                       <p class="subtitle-note">Chức năng quản lý sản phẩm gom nhóm đang được cập nhật...</p>
                   </div>
"""

# Insert before admin_tab_agri_products
if 'id="admin_tab_products"' not in content:
    content = content.replace('<div id="admin_tab_agri_products"', tab_html + '                   <div id="admin_tab_agri_products"')

with open('index.html', 'w') as f:
    f.write(content)
