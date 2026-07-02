with open('index.html', 'r') as f:
    content = f.read()

# Make sure user_default_rank_container is completely gone and replaced by a simple rank display badge
import re
content = re.sub(
    r'<div id="user_default_rank_container".*?</div>',
    '',
    content,
    flags=re.DOTALL
)

with open('index.html', 'w') as f:
    f.write(content)

with open('app.js', 'r') as f:
    content = f.read()

# Update the display of user info to include the rank
old_info_display = """        if (currentUserRole === "admin") {
          if (btnAdminPanel) btnAdminPanel.style.display = isSuperAdmin ? "flex" : "none";
          if (userInfoDisplay) {
            userInfoDisplay.style.display = "block";
            userInfoDisplay.innerText = isSuperAdmin
                ? "Trạng thái: Super Admin"
                : `Xin chào Admin: ${user.displayName || user.email}`;
          }"""

new_info_display = """        if (currentUserRole === "admin") {
          if (btnAdminPanel) btnAdminPanel.style.display = isSuperAdmin ? "flex" : "none";
          if (userInfoDisplay) {
            userInfoDisplay.style.display = "block";
            const rankStr = data.defaultRank === "tgd" ? "Tổng Giám đốc" :
                            data.defaultRank === "gd" ? "Giám đốc" :
                            data.defaultRank === "ql" ? "Quản lý" :
                            data.defaultRank === "nv" ? "Nhân viên" :
                            data.defaultRank === "kh" ? "Khách hàng" : "Chưa có chức danh";
            userInfoDisplay.innerHTML = isSuperAdmin
                ? `<span>Trạng thái: Super Admin</span><span style="margin-left: 10px; padding: 2px 8px; background: #dbeafe; color: #1e40af; border-radius: 12px; font-size: 0.85em;">${rankStr}</span>`
                : `<span>Xin chào Admin: ${user.displayName || user.email}</span><span style="margin-left: 10px; padding: 2px 8px; background: #dbeafe; color: #1e40af; border-radius: 12px; font-size: 0.85em;">${rankStr}</span>`;
          }"""

content = content.replace(old_info_display, new_info_display)

old_info_display_user = """        } else {
          if (btnAdminPanel) btnAdminPanel.style.display = "none";
          if (userInfoDisplay) {
            userInfoDisplay.style.display = "block";
            userInfoDisplay.innerText = `Xin chào: ${user.displayName || user.email}`;
          }"""

new_info_display_user = """        } else {
          if (btnAdminPanel) btnAdminPanel.style.display = "none";
          if (userInfoDisplay) {
            userInfoDisplay.style.display = "block";
            const rankStr = data.defaultRank === "tgd" ? "Tổng Giám đốc" :
                            data.defaultRank === "gd" ? "Giám đốc" :
                            data.defaultRank === "ql" ? "Quản lý" :
                            data.defaultRank === "nv" ? "Nhân viên" :
                            data.defaultRank === "kh" ? "Khách hàng" : "Chưa có chức danh";
            userInfoDisplay.innerHTML = `<span>Xin chào: ${user.displayName || user.email}</span><span style="margin-left: 10px; padding: 2px 8px; background: #dbeafe; color: #1e40af; border-radius: 12px; font-size: 0.85em;">${rankStr}</span>`;
          }"""

content = content.replace(old_info_display_user, new_info_display_user)

with open('app.js', 'w') as f:
    f.write(content)
