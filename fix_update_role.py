with open('app.js', 'r') as f:
    content = f.read()

old_select_html = """          selectHtml = `
                        <select onchange="updateUserRole('${doc.id}', this.value)" style="padding: 4px; border-radius: 4px; border: 1px solid #ccc; width: 100%;">
                            <option value="user" ${!isAdmin ? "selected" : ""}>Người dùng</option>
                            <option value="admin" ${isAdmin ? "selected" : ""}>Admin</option>
                        </select>
                    `;"""

new_select_html = """          const uRank = data.defaultRank || "gd";
          selectHtml = `
                        <select onchange="updateUserRole('${doc.id}', this.value)" style="padding: 4px; border-radius: 4px; border: 1px solid #ccc; width: 100%; margin-bottom: 5px;">
                            <option value="user" ${!isAdmin ? "selected" : ""}>Người dùng</option>
                            <option value="admin" ${isAdmin ? "selected" : ""}>Admin</option>
                        </select>
                        <select onchange="updateUserRank('${doc.id}', this.value)" style="padding: 4px; border-radius: 4px; border: 1px solid #ccc; width: 100%;">
                            <option value="tgd" ${uRank === 'tgd' ? "selected" : ""}>Tổng Giám đốc</option>
                            <option value="gd" ${uRank === 'gd' ? "selected" : ""}>Giám đốc</option>
                            <option value="ql" ${uRank === 'ql' ? "selected" : ""}>Quản lý</option>
                            <option value="nv" ${uRank === 'nv' ? "selected" : ""}>Nhân viên</option>
                            <option value="kh" ${uRank === 'kh' ? "selected" : ""}>Khách hàng (0%)</option>
                        </select>
                    `;"""

content = content.replace(old_select_html, new_select_html)

old_update_role = """  window.updateUserRole = (userId, newRole) => {
    if (!auth.currentUser || currentUserRole !== "admin") return;
    updateDoc(doc(db, "users", userId), { role: newRole })
      .then(() => {
        showToast("Cập nhật quyền thành công!", "success");
        logAction("Cập nhật quyền", { targetId: userId, role: newRole });
      })
      .catch((err) =>
        showToast("Lỗi cập nhật quyền: " + err.message, "error"),
      );
  };"""

new_update_role = """  window.updateUserRole = (userId, newRole) => {
    if (!auth.currentUser || currentUserRole !== "admin") return;
    updateDoc(doc(db, "users", userId), { role: newRole })
      .then(() => {
        showToast("Cập nhật quyền thành công!", "success");
        logAction("Cập nhật quyền", { targetId: userId, role: newRole });
      })
      .catch((err) =>
        showToast("Lỗi cập nhật quyền: " + err.message, "error"),
      );
  };

  window.updateUserRank = (userId, newRank) => {
    if (!auth.currentUser || currentUserRole !== "admin") return;
    updateDoc(doc(db, "users", userId), { defaultRank: newRank })
      .then(() => {
        showToast("Cập nhật chức danh thành công!", "success");
        logAction("Cập nhật chức danh", { targetId: userId, defaultRank: newRank });
      })
      .catch((err) =>
        showToast("Lỗi cập nhật chức danh: " + err.message, "error"),
      );
  };"""

content = content.replace(old_update_role, new_update_role)

with open('app.js', 'w') as f:
    f.write(content)
