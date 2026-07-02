with open('index.html', 'r') as f:
    content = f.read()

old_str = """                       <div class="input-list" style="max-width: 500px;">
                           <div class="input-group">
                               <label>Tỷ lệ lì xì / ngày</label>"""

new_str = """                       <div class="input-list" style="max-width: 500px;">
                           <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 1rem; color: #2563eb;">Phân Quyền Mặc Định</h3>
                           <div class="input-group">
                               <label>Chức danh cho user mới</label>
                               <div class="input-wrapper" style="padding-right: 10px;">
                                   <select id="p_defaultUserRank" style="width: 100%; padding: 6px; border: none; background: transparent; outline: none; font-size: 0.9rem; font-weight: 600; color: #1e293b;">
                                       <option value="tgd">Tổng Giám đốc</option>
                                       <option value="gd" selected>Giám đốc</option>
                                       <option value="ql">Quản lý</option>
                                       <option value="nv">Nhân viên</option>
                                       <option value="kh">Khách hàng (0%)</option>
                                   </select>
                               </div>
                           </div>
                           <h3 style="margin-top: 15px; margin-bottom: 10px; font-size: 1rem; color: #10b981;">Cấu hình Lì Xì</h3>
                           <div class="input-group">
                               <label>Tỷ lệ lì xì / ngày</label>"""

content = content.replace(old_str, new_str)
with open('index.html', 'w') as f:
    f.write(content)
