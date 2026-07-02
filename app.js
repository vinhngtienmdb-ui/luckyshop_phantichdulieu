// Utility to format numbers as VND
const formatVND = (num) => {
  return new Intl.NumberFormat("vi-VN").format(Math.round(num)) + " đ";
};

const formatPercent = (num) => {
  return (num * 100).toFixed(1) + "%";
};

// Global variables for limit check and dropdown tracking
let globalUsersList = [];
let updateUcheckDropdowns = () => {};
let runUcheckCalculations = () => {};
let db;
let auth;

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  getDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const toastContainer =
  document.getElementById("toast_container") ||
  (function () {
    const tc = document.createElement("div");
    tc.id = "toast_container";
    tc.style.position = "fixed";
    tc.style.bottom = "20px";
    tc.style.right = "20px";
    tc.style.zIndex = "9999";
    document.body.appendChild(tc);
    return tc;
  })();

const showToast = (msg, type = "info") => {
  const t = document.createElement("div");
  t.style.padding = "12px 20px";
  t.style.marginTop = "10px";
  t.style.borderRadius = "4px";
  t.style.color = "#fff";
  t.style.fontSize = "14px";
  t.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
  t.style.transition = "opacity 0.3s ease-in-out";
  if (type === "error") t.style.backgroundColor = "#ef4444";
  else if (type === "success") t.style.backgroundColor = "#10b981";
  else t.style.backgroundColor = "#3b82f6";
  t.innerText = msg;
  toastContainer.appendChild(t);
  setTimeout(() => {
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 300);
  }, 3000);
};

// --- FIREBASE SETUP ---
// Cấu hình Firebase dự án của bạn
const firebaseConfig = {
  projectId: "luckyshopanalytics",
  appId: "1:552187553603:web:6b2f9863c3db236009f1f6",
  apiKey: "AIzaSyC1VvOXN8vBlOOXgyuKRz4eE0uYj1kfRgk",
  authDomain: "luckyshopanalytics.firebaseapp.com",
  storageBucket: "luckyshopanalytics.firebasestorage.app",
  messagingSenderId: "552187553603",
};

// Khởi tạo Firebase nếu thư viện đã được load
if (true) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(
    app,
    "ai-studio-855a4b8a-5ffb-4334-8296-6a2455e93c44",
  );
  auth = getAuth(app);

  const btnLogin = document.getElementById("btn_login");
  const btnLogout = document.getElementById("btn_logout");
  const btnAdminPanel = document.getElementById("btn_admin_panel");

  const adminModal = document.getElementById("admin_modal");
  const btnCloseAdmin = document.getElementById("btn_close_admin");
  const userMgmtTableBody = document.getElementById("user_mgmt_table_body");
  const btnAddUser = document.getElementById("btn_add_user");
  const newUserEmail = document.getElementById("new_user_email");
  const newUserName = document.getElementById("new_user_name");
  const newUserRole = document.getElementById("new_user_role");
  const userInfoDisplay = document.getElementById("user_info");
  const loginModal = document.getElementById("login_modal");
  const btnDoLoginGoogle = document.getElementById("btn_do_login_google");
  const btnDoLoginEmail = document.getElementById("btn_do_login_email");
  const loginEmailInput = document.getElementById("login_email");
  const loginPwdInput = document.getElementById("login_pwd");
  const btnCloseLogin = document.getElementById("btn_close_login");
  const loginError = document.getElementById("login_error");
  const btnSaveConfig = document.getElementById("btn_save_config");
  const adminToggle = document.getElementById("admin_mode_toggle");

  const mtabInputs = document.getElementById("mtab_inputs");
  const mtabResults = document.getElementById("mtab_results");
  const mainDashboard = document.getElementById("main_dashboard");

  if (mtabInputs && mtabResults) {
      mtabInputs.addEventListener("click", () => {
          mtabInputs.classList.add("active");
          mtabResults.classList.remove("active");
          if (mainDashboard) {
              mainDashboard.classList.add("mobile-tab-inputs");
              mainDashboard.classList.remove("mobile-tab-results");
          }
          const agriDashboard = document.getElementById("agri_dashboard");
          if (agriDashboard) {
              agriDashboard.classList.add("mobile-tab-inputs");
              agriDashboard.classList.remove("mobile-tab-results");
          }
      });
      mtabResults.addEventListener("click", () => {
          mtabResults.classList.add("active");
          mtabInputs.classList.remove("active");
          if (mainDashboard) {
              mainDashboard.classList.add("mobile-tab-results");
              mainDashboard.classList.remove("mobile-tab-inputs");
          }
          const agriDashboard = document.getElementById("agri_dashboard");
          if (agriDashboard) {
              agriDashboard.classList.add("mobile-tab-results");
              agriDashboard.classList.remove("mobile-tab-inputs");
          }
      });
  }

  let currentUserRole = "user";
  let currentUserData = null;
  let userSnapshotUnsub = null;
  let agriStateUnsub = null;
  let usersListUnsub = null;
  let historyListUnsub = null;
  globalUsersList = [];
  let globalUsersListUnsub = null;
  let currentIp = "Đang lấy...";
  
  // Lấy IP của người dùng
  fetch('https://api.ipify.org?format=json')
    .then(r => r.json())
    .then(data => { currentIp = data.ip; })
    .catch(err => console.error("Lỗi lấy IP:", err));

  window.logAction = (action, metadata = {}) => {
    if (!auth.currentUser) return;
    addDoc(collection(db, "history"), {
      email: auth.currentUser.email,
      uid: auth.currentUser.uid,
      action: action,
      metadata: metadata,
      ip: currentIp,
      createdAt: serverTimestamp()
    }).catch(err => console.error("Error logging action:", err));
  };

  let historyData = [];

  const renderHistoryList = () => {
    const historyTableBody = document.getElementById("history_table_body");
    if (!historyTableBody) return;
    
    const searchInput = document.getElementById("history_search_input");
    const filterText = searchInput ? searchInput.value.toLowerCase() : "";
    
    const filtered = historyData.filter(data => {
        const email = (data.email || "").toLowerCase();
        const action = (data.action || "").toLowerCase();
        return email.includes(filterText) || action.includes(filterText);
    });

    if (filtered.length === 0) {
      historyTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #666;">Chưa có dữ liệu</td></tr>';
      return;
    }
    
    historyTableBody.innerHTML = "";
    filtered.forEach((data) => {
      const tr = document.createElement("tr");
      
      let metaHtml = "";
      if (data.metadata && Object.keys(data.metadata).length > 0) {
          metaHtml = `<br><small style="color: #666;">${JSON.stringify(data.metadata)}</small>`;
      }
      
      tr.innerHTML = `
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.createdAtStr || "-"}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
           <div style="font-weight: 500;">${data.email || "Unknown"}</div>
           <div style="color: #64748b; font-size: 0.8rem;">IP: ${data.ip || "Unknown"}</div>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
           ${data.action || "-"}${metaHtml}
        </td>
      `;
      historyTableBody.appendChild(tr);
    });
  };

  const loadHistoryList = () => {
    if (!auth.currentUser || currentUserRole !== "admin") return;
    if (historyListUnsub) historyListUnsub();

    const searchInput = document.getElementById("history_search_input");
    if (searchInput) {
        searchInput.removeEventListener("input", renderHistoryList);
        searchInput.addEventListener("input", renderHistoryList);
    }
    
    const btnExportHistory = document.getElementById("btn_export_history");
    if (btnExportHistory) {
      btnExportHistory.onclick = () => {
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF" + "Ngày Giờ,Email,IP,Hành Động,Chi Tiết\n";
        historyData.forEach(data => {
            const timeStr = data.createdAtStr ? data.createdAtStr.replace(/,/g, "") : "";
            const email = data.email || "";
            const ip = data.ip || "";
            const action = data.action || "";
            const meta = data.metadata ? JSON.stringify(data.metadata).replace(/"/g, '""') : "";
            csvContent += `"${timeStr}","${email}","${ip}","${action}","${meta}"\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `lich_su_he_thong_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
    }

    const q = query(collection(db, "history"), orderBy("createdAt", "desc"), limit(100));
    historyListUnsub = onSnapshot(q, (snapshot) => {
      historyData = [];
      snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          let timeStr = "-";
          if (data.createdAt) {
              const date = data.createdAt.toDate();
              timeStr = date.toLocaleString('vi-VN');
          }
          data.createdAtStr = timeStr;
          historyData.push(data);
      });
      renderHistoryList();
    }, (error) => {
      console.error("Lỗi lấy lịch sử:", error);
    });
  };

  if (btnLogin)
    btnLogin.addEventListener(
      "click",
      () => (loginModal.style.display = "flex"),
    );
  if (btnCloseLogin)
    btnCloseLogin.addEventListener("click", () => {
      loginModal.style.display = "none";
      loginError.style.display = "none";
    });

  if (btnAdminPanel && adminModal) {
    btnAdminPanel.addEventListener("click", () => {
      adminModal.style.display = "flex";
      loadUsersList();
      loadHistoryList();

      // Set first tab active by default
      const adminTabs = document.querySelectorAll(".admin-tab");
      const adminContents = document.querySelectorAll(".admin-content");
      if (adminTabs.length > 0 && adminContents.length > 0) {
        adminTabs.forEach((t) => {
          t.classList.remove("active");
          t.style.borderLeftColor = "transparent";
          t.style.background = "transparent";
        });
        adminContents.forEach((c) => (c.style.display = "none"));

        adminTabs[0].classList.add("active");
        adminTabs[0].style.borderLeftColor = "#2563eb";
        adminTabs[0].style.background = "#e2e8f0";
        const targetId = adminTabs[0].getAttribute("data-target");
        document.getElementById(targetId).style.display = "block";
      }
    });
    if (btnCloseAdmin) {
      btnCloseAdmin.addEventListener("click", () => {
        adminModal.style.display = "none";
        if (usersListUnsub) usersListUnsub();
        if (historyListUnsub) historyListUnsub();
      });
    }
  }

  // Tabs logic
  const adminTabsNode = document.querySelectorAll(".admin-tab");
  const adminContentsNode = document.querySelectorAll(".admin-content");
  adminTabsNode.forEach((tab) => {
    tab.addEventListener("click", () => {
      adminTabsNode.forEach((t) => {
        t.classList.remove("active");
        t.style.borderLeftColor = "transparent";
        t.style.background = "transparent";
      });
      adminContentsNode.forEach((c) => (c.style.display = "none"));

      tab.classList.add("active");
      tab.style.borderLeftColor = "#2563eb";
      tab.style.background = "#e2e8f0";
      const targetId = tab.getAttribute("data-target");
      document.getElementById(targetId).style.display = "flex";
      if (targetId === "admin_tab_config") {
        document.getElementById(targetId).style.display = "block";
      }
    });
  });

  const btnSaveRoles = document.getElementById("btn_save_roles");
  if (btnSaveRoles) {
    btnSaveRoles.addEventListener("click", () => {
      if (!auth.currentUser || currentUserRole !== "admin") return;
      const rolesConf = {
        tgd: document.getElementById("role_name_tgd").value || "Tổng Giám đốc",
        gd: document.getElementById("role_name_gd").value || "Giám đốc",
        ql: document.getElementById("role_name_ql").value || "Quản lý",
        nv: document.getElementById("role_name_nv").value || "Nhân viên",
      };
      setDoc(doc(db, "configs", "roles"), rolesConf, { merge: true })
        .then(() => {
            showToast("Đã lưu chức danh và tỷ lệ!", "success");
            logAction("Cập nhật tên & tỷ lệ chức danh", rolesConf);
            if (btnSaveConfig) btnSaveConfig.click();
        })
        .catch((err) =>
          showToast("Lỗi lưu chức danh: " + err.message, "error"),
        );
    });
  }

  const userDefaultRankSelect = document.getElementById("user_default_rank");
  if (userDefaultRankSelect) {
    userDefaultRankSelect.addEventListener("change", (e) => {
      const selectedRank = e.target.value;
      if (auth.currentUser) {
        updateDoc(doc(db, "users", auth.currentUser.uid), {
          defaultRank: selectedRank,
        })
          .then(() => {
            showToast("Đã lưu chức danh mặc định!", "success");
            logAction("Cập nhật chức danh mặc định cá nhân", { defaultRank: selectedRank });
          })
          .catch((err) =>
            showToast("Lỗi lưu chức danh: " + err.message, "error"),
          );
      }

      // Sync Gom nhóm Rank
      const u_rank = document.getElementById("u_rank");
      if (u_rank) {
        u_rank.value = selectedRank;
        if (typeof updateSubordinateVisibility === "function")
          updateSubordinateVisibility();
        if (typeof calculate === "function") calculate();
      }

      // Sync Nông sản Rank
      if (window.agriState) {
        window.agriState.rank = selectedRank;
        const selectRank = document.getElementById("calc_agri_rank");
        if (selectRank) {
          selectRank.value = selectedRank;
        }
        if (typeof window.renderAgriDashboard === "function") {
          window.renderAgriDashboard();
        }
      }
    });
  }

  // Listen for roles config
  onSnapshot(doc(db, "configs", "roles"), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const setRoleName = (idUi, idLbl, idOpt, lblComm, idUdrOpt, val) => {
        if (!val) return;
        const ui = document.getElementById(idUi);
        if (ui) ui.value = val;
        const lbl = document.getElementById(idLbl);
        if (lbl) lbl.innerText = val;
        const opt = document.getElementById(idOpt);
        if (opt) opt.innerText = val;
        const comm = document.getElementById(lblComm);
        if (comm) comm.innerText = "HH " + val.toLowerCase();
        const optUdr = document.getElementById(idUdrOpt);
        if (optUdr) optUdr.innerText = val;
      };
      setRoleName(
        "role_name_tgd",
        null,
        "opt_tgd",
        "lbl_hh_tgd",
        "udr_opt_tgd",
        data.tgd,
      );
      setRoleName(
        "role_name_gd",
        "chk_lbl_gd",
        "opt_gd",
        "lbl_hh_gd",
        "udr_opt_gd",
        data.gd,
      );
      setRoleName(
        "role_name_ql",
        "chk_lbl_ql",
        "opt_ql",
        "lbl_hh_ql",
        "udr_opt_ql",
        data.ql,
      );
      setRoleName(
        "role_name_nv",
        "chk_lbl_nv",
        "opt_nv",
        "lbl_hh_nv",
        "udr_opt_nv",
        data.nv,
      );
    }
  }, (error) => console.error("Error reading roles config:", error));

  let usersDataList = [];
  const loadUsersList = () => {
    if (!auth.currentUser || currentUserRole !== "admin") return;
    if (usersListUnsub) usersListUnsub();

    const btnExportUsers = document.getElementById("btn_export_users");
    if (btnExportUsers) {
      btnExportUsers.onclick = () => {
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF" + "Email,Tên,Vai Trò,Trạng Thái,Tài khoản LS,Team\n";
        usersDataList.forEach(data => {
            const email = data.email || "";
            const name = data.displayName || "";
            const role = data.role || "user";
            const status = data.status || "new";
            const lsAccount = data.luckyShopAccount || "";
            const lsTeam = data.luckyShopTeam || "";
            csvContent += `"${email}","${name}","${role}","${status}","${lsAccount}","${lsTeam}"\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `danh_sach_nguoi_dung_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
    }

    usersListUnsub = onSnapshot(collection(db, "users"), (snapshot) => {
      if (!userMgmtTableBody) return;
      userMgmtTableBody.innerHTML = "";
      usersDataList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const userData = { id: doc.id, ...data };
        usersDataList.push(userData);
        const tr = document.createElement("tr");
        const isSuperAdmin =
          data.email === "vinh.ngtienmdb@gmail.com" ||
          data.email === "admin@admin.com";

        let selectHtml = "";
        let actionBtns = "";
        let nameHtml = "";
        const fmtVND = (num) => new Intl.NumberFormat("vi-VN").format(Math.round(num)) + " đ";
        let accountTeamHtml = `
          <div style="font-size: 0.82em; color: #555;">LS: ${data.luckyShopAccount || '-'}</div>
          <div style="font-size: 0.82em; color: #555;">Team: ${data.luckyShopTeam || '-'}</div>
          ${(data.currentLuckyBalance !== undefined && data.currentLuckyBalance !== 0) ? `<div style="font-size: 0.81em; color: #16a34a; font-weight: 600; margin-top: 2px;">Dư: ${fmtVND(data.currentLuckyBalance)}</div>` : ''}
          ${(data.luckyLimit !== undefined && data.luckyLimit !== 0) ? `<div style="font-size: 0.81em; color: #dc2626; font-weight: 600; margin-top: 1px;">Hạn mức: ${fmtVND(data.luckyLimit)}</div>` : ''}
        `;
        let statusHtml = "";

        if (isSuperAdmin) {
          selectHtml = `<span style="color: red; font-weight: bold;">Super Admin</span>`;
          nameHtml = data.displayName || "-";
          statusHtml = `<span style="color: #10b981; font-weight: bold;">Đã duyệt</span>`;
          actionBtns = `
            <button onclick="editUserDetail('${doc.id}')" style="background: #2563eb; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; width: 100%; font-size: 0.85em; font-weight: 600;">⚙️ Thiết lập</button>
          `;
        } else {
          const isAdmin = data.role === "admin";
          const isBlocked = data.isBlocked === true;
          selectHtml = `
                        <select onchange="updateUserRole('${doc.id}', this.value)" style="padding: 4px; border-radius: 4px; border: 1px solid #ccc; width: 100%;">
                            <option value="user" ${!isAdmin ? "selected" : ""}>Người dùng</option>
                            <option value="admin" ${isAdmin ? "selected" : ""}>Admin</option>
                        </select>
                    `;
          const blockBtnText = isBlocked ? "Mở chặn" : "Chặn";
          const blockBtnColor = isBlocked ? "#8b5cf6" : "#f59e0b";
          
          let approveBtn = "";
          if (data.status === "pending") {
              statusHtml = `<span style="color: #f59e0b; font-weight: bold;">Chờ duyệt</span>`;
              approveBtn = `<button onclick="approveUser('${doc.id}', '${data.email}')" style="background: #10b981; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-right: 5px; margin-bottom: 5px; display: block; width: 100%;">Phê Duyệt</button>`;
          } else if (data.status === "approved") {
              statusHtml = `<span style="color: #10b981; font-weight: bold;">Đã duyệt</span>`;
          } else {
              statusHtml = `<span style="color: #9ca3af;">Mới</span>`;
          }

          actionBtns = `
            ${approveBtn}
            <div style="display: flex; flex-direction: column; gap: 5px;">
                <button onclick="editUserDetail('${doc.id}')" style="background: #2563eb; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; width: 100%; font-size: 0.85em; font-weight: 600;">⚙️ Thiết lập</button>
                <div style="display: flex; gap: 5px; width: 100%;">
                    <button onclick="toggleBlockUser('${doc.id}', ${isBlocked})" style="background: ${blockBtnColor}; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; flex: 1; font-size: 0.8em;">${blockBtnText}</button>
                    <button onclick="deleteUser('${doc.id}')" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; flex: 1; font-size: 0.8em;">Xóa</button>
                </div>
            </div>
          `;
          nameHtml = `<input type="text" value="${data.displayName || ""}" onblur="updateUserName('${doc.id}', this.value)" style="padding: 4px; border: 1px solid #ccc; width: 100%; border-radius: 4px;">`;
        }

        tr.innerHTML = `
                    <td style="padding: 10px; border-bottom: 1px solid #eee; ${data.isBlocked ? 'text-decoration: line-through; color: #999;' : ''}">${data.email}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${nameHtml}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${accountTeamHtml}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${statusHtml}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${selectHtml}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${actionBtns}</td>
                `;
        userMgmtTableBody.appendChild(tr);
      });
    }, (error) => console.error("Error loading users list:", error));
  };

  window.editingUserId = null;
  window.editUserDetail = (userId) => {
    window.editingUserId = userId;
    const targetUser = usersDataList.find(u => u.id === userId);
    if (!targetUser) return;
    
    const modal = document.getElementById("edit_profile_modal");
    if (modal) {
      modal.style.display = "flex";
      
      const modalTitle = modal.querySelector("h3");
      if (modalTitle) {
        modalTitle.innerText = `⚙️ Thiết Lập Tài Khoản: ${targetUser.email}`;
      }
      
      const editTeam = document.getElementById("edit_profile_team");
      const editCurrLixi = document.getElementById("edit_profile_curr_lixi");
      const editLimit = document.getElementById("edit_profile_lucky_limit");
      
      if (editTeam) editTeam.value = targetUser.luckyShopTeam || "";
      if (editCurrLixi) editCurrLixi.value = targetUser.currentLuckyBalance !== undefined ? targetUser.currentLuckyBalance : "";
      if (editLimit) editLimit.value = targetUser.luckyLimit !== undefined ? targetUser.luckyLimit : "";
      
      const editInputEl = document.getElementById("edit_profile_lucky_account_input");
      if (editInputEl) editInputEl.value = "";
      
      if (targetUser.luckyShopAccounts) {
        editProfileAccounts = [...targetUser.luckyShopAccounts];
      } else if (targetUser.luckyShopAccount) {
        editProfileAccounts = targetUser.luckyShopAccount.split(",").map(s => s.trim()).filter(s => s !== "" && s !== "-");
      } else {
        editProfileAccounts = [];
      }
      renderEditAccountsList();
      
      const errDiv = document.getElementById("edit_profile_error");
      if (errDiv) {
          errDiv.style.display = "none";
          errDiv.innerText = "";
      }
    }
  };

  window.updateUserRole = (userId, newRole) => {
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

  window.updateUserName = (userId, newName) => {
    if (!auth.currentUser || currentUserRole !== "admin") return;
    updateDoc(doc(db, "users", userId), { displayName: newName })
      .then(() => {
        showToast("Cập nhật tên thành công!", "success");
        logAction("Cập nhật tên người dùng", { targetId: userId, name: newName });
      })
      .catch((err) =>
        showToast("Lỗi cập nhật tên: " + err.message, "error"),
      );
  };

  window.toggleBlockUser = (userId, currentStatus) => {
    if (!auth.currentUser || currentUserRole !== "admin") return;
    const actionStr = currentStatus ? "Mở chặn" : "Chặn";
    if (confirm(`Bạn có chắc chắn muốn ${actionStr} user này không?`)) {
      updateDoc(doc(db, "users", userId), { isBlocked: !currentStatus })
        .then(() => {
          showToast(`${actionStr} user thành công!`, "success");
          logAction(actionStr + " người dùng", { targetId: userId });
        })
        .catch((err) =>
          showToast(`Lỗi ${actionStr} user: ` + err.message, "error"),
        );
    }
  };

  window.deleteUser = (userId) => {
    if (!auth.currentUser || currentUserRole !== "admin") return;
    if (confirm("Bạn có chắc chắn muốn xóa user này không?")) {
      deleteDoc(doc(db, "users", userId))
        .then(() => {
          showToast("Xóa user thành công!", "success");
          logAction("Xóa người dùng", { targetId: userId });
        })
        .catch((err) =>
          showToast("Lỗi xóa user: " + err.message, "error"),
        );
    }
  };

  window.approveUser = (userId, userEmail) => {
    if (!auth.currentUser || currentUserRole !== "admin") return;
    if (confirm("Phê duyệt cho người dùng này sử dụng hệ thống?")) {
      updateDoc(doc(db, "users", userId), { status: "approved" })
        .then(() => {
           showToast("Phê duyệt thành công!", "success");
           logAction("Phê duyệt người dùng", { targetEmail: userEmail });
           addDoc(collection(db, "mail"), {
              to: userEmail,
              message: {
                 subject: `[Lucky Shop] Tài khoản của bạn đã được phê duyệt`,
                 html: `<p>Xin chào,</p><p>Tài khoản đại lý / thành viên của bạn đã được Admin phê duyệt thành công.</p><p>Bạn đã có thể đăng nhập và sử dụng hệ thống tính toán dòng tiền.</p>`
              }
           });
        })
        .catch((err) =>
          showToast("Lỗi phê duyệt: " + err.message, "error"),
        );
    }
  };

  if (btnAddUser) {
    btnAddUser.addEventListener("click", () => {
      if (!auth.currentUser || currentUserRole !== "admin") return;
      const email = newUserEmail.value.trim();
      const name = newUserName.value.trim();
      const role = newUserRole.value;
      const accountVal = document.getElementById("new_user_account") ? document.getElementById("new_user_account").value.trim() : "";
      const teamVal = document.getElementById("new_user_team") ? document.getElementById("new_user_team").value.trim() : "";
      const balanceVal = document.getElementById("new_user_balance") ? parseFloat(document.getElementById("new_user_balance").value) : 0;
      const limitVal = document.getElementById("new_user_limit") ? parseFloat(document.getElementById("new_user_limit").value) : 0;

      if (!email) {
        showToast("Vui lòng nhập Email", "error");
        return;
      }
      addDoc(collection(db, "users"), {
        email: email,
        displayName: name,
        role: role,
        luckyShopAccount: accountVal,
        luckyShopAccounts: accountVal ? [accountVal] : [],
        luckyShopTeam: teamVal,
        currentLuckyBalance: isNaN(balanceVal) ? 0 : balanceVal,
        luckyLimit: isNaN(limitVal) ? 0 : limitVal,
        createdAt: serverTimestamp(),
        status: "approved",
        isProfileComplete: true
      })
      .then(() => {
        showToast("Thêm User thành công!", "success");
        newUserEmail.value = "";
        newUserName.value = "";
        if (document.getElementById("new_user_account")) document.getElementById("new_user_account").value = "";
        if (document.getElementById("new_user_team")) document.getElementById("new_user_team").value = "";
        if (document.getElementById("new_user_balance")) document.getElementById("new_user_balance").value = "";
        if (document.getElementById("new_user_limit")) document.getElementById("new_user_limit").value = "";
      })
      .catch((err) => showToast("Lỗi thêm user: " + err.message, "error"));
    });
  }

  if (btnDoLoginEmail) {
    btnDoLoginEmail.addEventListener("click", () => {
      let email = loginEmailInput.value.trim();
      const pwd = loginPwdInput.value;
      if (!email || !pwd) {
        loginError.innerText = "Vui lòng nhập đủ email và mật khẩu";
        loginError.style.display = "block";
        return;
      }
      if (!email.includes("@")) {
        email = email + "@admin.com";
      }
      signInWithEmailAndPassword(auth, email, pwd)
        .then(() => {
          loginModal.style.display = "none";
          loginError.style.display = "none";
          loginEmailInput.value = "";
          loginPwdInput.value = "";
          logAction("Đăng nhập (Email)", { result: "success" });
        })
        .catch((error) => {
          if (
            error.code === "auth/user-not-found" ||
            error.code === "auth/invalid-credential" ||
            error.code === "auth/invalid-login-credentials"
          ) {
            // Create the user if not found/invalid credential (due to email enumeration protection)
            createUserWithEmailAndPassword(auth, email, pwd)
              .then(() => {
                loginModal.style.display = "none";
                loginError.style.display = "none";
                loginEmailInput.value = "";
                loginPwdInput.value = "";
                logAction("Đăng ký thành viên mới", { result: "success" });
              })
              .catch((createError) => {
                if (createError.code === "auth/email-already-in-use") {
                  loginError.innerText = "Mật khẩu không đúng.";
                } else if (createError.code === "auth/operation-not-allowed") {
                  loginError.innerText =
                    "Vui lòng bật 'Email/Password' trong Authentication của Firebase Console.";
                } else {
                  loginError.innerText =
                    "Đăng ký thất bại: " + createError.message;
                }
                loginError.style.display = "block";
              });
          } else if (error.code === "auth/operation-not-allowed") {
            loginError.innerText =
              "Vui lòng bật 'Email/Password' trong Authentication của Firebase Console.";
            loginError.style.display = "block";
          } else {
            loginError.innerText = "Đăng nhập thất bại: " + error.message;
            loginError.style.display = "block";
          }
        });
    });
  }

  if (btnDoLoginGoogle) {
    btnDoLoginGoogle.addEventListener("click", () => {
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider)
        .then((result) => {
          loginModal.style.display = "none";
          loginError.style.display = "none";
          logAction("Đăng nhập (Google)", { result: "success" });
        })
        .catch((error) => {
          loginError.innerText = "Đăng nhập thất bại: " + error.message;
          loginError.style.display = "block";
        });
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
        logAction("Đăng xuất", {});
        setTimeout(() => signOut(auth), 500);
    });
  }

  onAuthStateChanged(auth, (user) => {
    if (userSnapshotUnsub) {
      userSnapshotUnsub();
      userSnapshotUnsub = null;
    }
    if (agriStateUnsub) {
      agriStateUnsub();
      agriStateUnsub = null;
    }
    if (usersListUnsub) {
      usersListUnsub();
      usersListUnsub = null;
    }
    if (historyListUnsub) {
      historyListUnsub();
      historyListUnsub = null;
    }
     if (user) {
       // Register or update user in Firestore
      const userRef = doc(db, "users", user.uid);
      getDoc(userRef).then(async (docSnap) => {
        if (!docSnap.exists()) {
          try {
            const q = query(collection(db, "users"), where("email", "==", user.email));
            const querySnapshot = await getDocs(q);
            let preCreatedData = null;
            let preCreatedDocId = null;
            
            querySnapshot.forEach((d) => {
              if (d.id !== user.uid) {
                preCreatedData = d.data();
                preCreatedDocId = d.id;
              }
            });
            
            if (preCreatedData) {
              await setDoc(userRef, {
                ...preCreatedData,
                updatedAt: serverTimestamp()
              });
              await deleteDoc(doc(db, "users", preCreatedDocId));
              showToast("Đã đồng bộ tài khoản đại lý thành công!", "success");
            } else {
              const isSuperAdmin =
                user.email === "vinh.ngtienmdb@gmail.com" ||
                user.email === "admin@admin.com";
              await setDoc(userRef, {
                email: user.email,
                displayName: user.displayName || user.email,
                role: isSuperAdmin ? "admin" : "user",
                createdAt: serverTimestamp(),
                status: isSuperAdmin ? "approved" : "new",
                isProfileComplete: isSuperAdmin ? true : false,
              });
            }
          } catch (err) {
            console.error("Lỗi liên kết tài khoản pre-created:", err);
            const isSuperAdmin =
              user.email === "vinh.ngtienmdb@gmail.com" ||
              user.email === "admin@admin.com";
            await setDoc(userRef, {
              email: user.email,
              displayName: user.displayName || user.email,
              role: isSuperAdmin ? "admin" : "user",
              createdAt: serverTimestamp(),
              status: isSuperAdmin ? "approved" : "new",
              isProfileComplete: isSuperAdmin ? true : false,
            });
          }
        }
      });

      userSnapshotUnsub = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          currentUserData = data;

          // Check limits and update warning banner
          const cLixi = parseFloat(data.currentLuckyBalance) || 0;
          const lLimit = parseFloat(data.luckyLimit) || 0;
          const warningBanner = document.getElementById("limit_warning_banner");
          const warningText = document.getElementById("limit_warning_text");
          if (warningBanner && warningText) {
              if (lLimit > 0 && cLixi > lLimit) {
                  const formatVNDLocal = (num) => new Intl.NumberFormat("vi-VN").format(Math.round(num)) + " đ";
                  warningText.innerHTML = `Số dư lì xì hiện tại (<strong>${formatVNDLocal(cLixi)}</strong>) đã vượt quá hạn mức quy định (<strong>${formatVNDLocal(lLimit)}</strong>)!`;
                  warningBanner.style.display = "block";
              } else {
                  warningBanner.style.display = "none";
              }
          }

          if (data.isBlocked) {
            logAction("Bi khóa tài khoản", {});
            setTimeout(() => signOut(auth), 500);
            showToast("Tài khoản của bạn đã bị khóa.", "error");
            return;
          }
          
          const isSuperAdmin = user.email === "vinh.ngtienmdb@gmail.com" || user.email === "admin@admin.com";
          let isApproved = false;
          
          if (!isSuperAdmin) {
             if (!data.isProfileComplete) {
                document.getElementById("profile_modal").style.display = "flex";
                document.getElementById("main_dashboard").style.display = "none";
                document.getElementById("require_login_overlay").style.display = "none";
                document.getElementById("pending_modal").style.display = "none";
             } else if (data.status === "pending" || !data.status || data.status === "new") {
                document.getElementById("profile_modal").style.display = "none";
                document.getElementById("pending_modal").style.display = "flex";
                document.getElementById("main_dashboard").style.display = "none";
                document.getElementById("require_login_overlay").style.display = "none";
             } else if (data.status === "approved") {
                isApproved = true;
                document.getElementById("profile_modal").style.display = "none";
                document.getElementById("pending_modal").style.display = "none";
                if (typeof window.updateDashboardVisibility === "function") {
                  window.updateDashboardVisibility();
                } else {
                  document.getElementById("main_dashboard").style.display = "";
                }
                document.getElementById("require_login_overlay").style.display = "none";
             }
          } else {
             isApproved = true;
             document.getElementById("profile_modal").style.display = "none";
             document.getElementById("pending_modal").style.display = "none";
             if (typeof window.updateDashboardVisibility === "function") {
               window.updateDashboardVisibility();
             } else {
               document.getElementById("main_dashboard").style.display = "";
             }
             document.getElementById("require_login_overlay").style.display = "none";
          }

          currentUserRole = isSuperAdmin ? "admin" : data.role || "user";

          const userDefaultRankSelect =
            document.getElementById("user_default_rank");
          if (
            data.defaultRank &&
            userDefaultRankSelect &&
            userDefaultRankSelect.value !== data.defaultRank
          ) {
            userDefaultRankSelect.value = data.defaultRank;
            const u_rank = document.getElementById("u_rank");
            if (u_rank) {
              u_rank.value = data.defaultRank;
              if (typeof updateSubordinateVisibility === "function")
                updateSubordinateVisibility();
              if (typeof calculate === "function") calculate();
            }
            if (window.agriState) {
              window.agriState.rank = data.defaultRank;
              const selectRank = document.getElementById("calc_agri_rank");
              if (selectRank) {
                selectRank.value = data.defaultRank;
              }
              if (typeof window.renderAgriDashboard === "function") {
                window.renderAgriDashboard();
              }
            }
          }
        } else {
          currentUserRole =
            user.email === "vinh.ngtienmdb@gmail.com" ||
            user.email === "admin@admin.com"
              ? "admin"
              : "user";
        }

        if (btnLogin) btnLogin.style.display = "none";
        if (btnLogout) btnLogout.style.display = "flex";
        
        const udrContainer = document.getElementById(
          "user_default_rank_container",
        );
        if (udrContainer) udrContainer.style.display = "flex";

        const isSuperAdmin = user.email === "vinh.ngtienmdb@gmail.com" || user.email === "admin@admin.com";

        if (currentUserRole === "admin") {
          if (btnAdminPanel) btnAdminPanel.style.display = isSuperAdmin ? "flex" : "none";
          if (userInfoDisplay) {
            userInfoDisplay.style.display = "block";
            userInfoDisplay.innerText = isSuperAdmin
                ? "Trạng thái: Super Admin"
                : `Xin chào Admin: ${user.displayName || user.email}`;
          }
          if (adminToggle) {
            adminToggle.checked = true;
            if (typeof toggleAdminMode === "function") toggleAdminMode();
          }
        } else {
          if (btnAdminPanel) btnAdminPanel.style.display = "none";
          if (userInfoDisplay) {
            userInfoDisplay.style.display = "block";
            userInfoDisplay.innerText = `Xin chào: ${user.displayName || user.email}`;
          }
          if (adminToggle) {
            adminToggle.checked = false;
            if (typeof toggleAdminMode === "function") toggleAdminMode();
          }
        }
      }, (error) => console.error("Error reading user data:", error));

      const agriRef = doc(db, "agri_states", user.uid);
      agriStateUnsub = onSnapshot(agriRef, (docSnap) => {
        if (docSnap.exists() && window.agriState) {
          const data = docSnap.data();
          if (data.selectedProductId !== undefined) window.agriState.selectedProductId = data.selectedProductId;
          if (data.customProduct !== undefined) window.agriState.customProduct = { ...window.agriState.customProduct, ...data.customProduct };
          if (data.qty !== undefined) window.agriState.qty = data.qty;
          if (data.option !== undefined) window.agriState.option = data.option;
          if (data.resaleUnitPrice !== undefined) window.agriState.resaleUnitPrice = data.resaleUnitPrice;
          if (data.resaleFeePercent !== undefined) window.agriState.resaleFeePercent = data.resaleFeePercent;
          if (data.resaleSellGift !== undefined) window.agriState.resaleSellGift = data.resaleSellGift;
          if (data.rank !== undefined) {
            window.agriState.rank = data.rank;
            const udr = document.getElementById("user_default_rank");
            if (udr && udr.value !== data.rank) {
              udr.value = data.rank;
              const u_rank = document.getElementById("u_rank");
              if (u_rank) {
                u_rank.value = data.rank;
                if (typeof updateSubordinateVisibility === "function")
                  updateSubordinateVisibility();
                if (typeof calculate === "function") calculate();
              }
            }
          }
          if (data.personalSales !== undefined) window.agriState.personalSales = data.personalSales;
          if (data.f1Sales !== undefined) window.agriState.f1Sales = data.f1Sales;
          if (data.otherGroupSales !== undefined) window.agriState.otherGroupSales = data.otherGroupSales;
          if (data.f1Network !== undefined) window.agriState.f1Network = data.f1Network;
          
          if (typeof window.renderAgriDashboard === "function") {
            window.renderAgriDashboard();
          }
        }
      }, (error) => {
        console.error("Lỗi đồng bộ dữ liệu Nông Sản:", error);
      });
    } else {
      currentUserRole = "user";
      const requireLoginOverlay = document.getElementById("require_login_overlay");
      if (requireLoginOverlay) requireLoginOverlay.style.display = "flex";
      const profileModal = document.getElementById("profile_modal");
      if (profileModal) profileModal.style.display = "none";
      const pendingModal = document.getElementById("pending_modal");
      if (pendingModal) pendingModal.style.display = "none";
      if(mainDashboard) mainDashboard.style.display = "none";
      if(document.getElementById("agri_dashboard")) document.getElementById("agri_dashboard").style.display = "none";
      if(document.getElementById("main_module_switcher")) document.getElementById("main_module_switcher").style.display = "none";

      if (btnLogin) btnLogin.style.display = "flex";
      if (btnLogout) btnLogout.style.display = "none";
      

      const warningBanner = document.getElementById("limit_warning_banner");
      if (warningBanner) warningBanner.style.display = "none";

      if (btnAdminPanel) btnAdminPanel.style.display = "none";

      if (userInfoDisplay) userInfoDisplay.style.display = "none";

      const udrContainer = document.getElementById(
        "user_default_rank_container",
      );
      if (udrContainer) udrContainer.style.display = "none";

      if (adminToggle) {
        adminToggle.checked = false;
        if (typeof toggleAdminMode === "function") toggleAdminMode();
      }
    }
  });

  let registrationAccounts = [];
  const renderRegAccountsList = () => {
    const listEl = document.getElementById("reg_accounts_list");
    if (!listEl) return;
    if (registrationAccounts.length === 0) {
      listEl.innerHTML = `<div style="font-size: 0.85rem; color: #94a3b8; text-align: center; font-style: italic; padding: 4px 0;">Chưa thêm tài khoản nào. Vui lòng nhập ở dưới và bấm Thêm.</div>`;
      return;
    }
    listEl.innerHTML = "";
    registrationAccounts.forEach((acc, idx) => {
      const row = document.createElement("div");
      row.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: white; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem; font-weight: 500;";
      row.innerHTML = `
        <span style="color: #334155; word-break: break-all;">${acc}</span>
        <button type="button" class="btn-remove-reg-acc" data-index="${idx}" style="background: none; border: none; color: #ef4444; font-size: 1.1rem; cursor: pointer; padding: 2px 6px; line-height: 1;">&times;</button>
      `;
      listEl.appendChild(row);
    });

    listEl.querySelectorAll(".btn-remove-reg-acc").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.getAttribute("data-index"));
        registrationAccounts.splice(idx, 1);
        renderRegAccountsList();
      });
    });
  };

  let editProfileAccounts = [];
  const renderEditAccountsList = () => {
    const listEl = document.getElementById("edit_reg_accounts_list");
    if (!listEl) return;
    if (editProfileAccounts.length === 0) {
      listEl.innerHTML = `<div style="font-size: 0.85rem; color: #94a3b8; text-align: center; font-style: italic; padding: 4px 0;">Chưa thêm tài khoản nào. Vui lòng nhập ở dưới và bấm Thêm.</div>`;
      return;
    }
    listEl.innerHTML = "";
    editProfileAccounts.forEach((acc, idx) => {
      const row = document.createElement("div");
      row.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: white; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem; font-weight: 500;";
      row.innerHTML = `
        <span style="color: #334155; word-break: break-all;">${acc}</span>
        <button type="button" class="btn-remove-edit-acc" data-index="${idx}" style="background: none; border: none; color: #ef4444; font-size: 1.1rem; cursor: pointer; padding: 2px 6px; line-height: 1;">&times;</button>
      `;
      listEl.appendChild(row);
    });

    listEl.querySelectorAll(".btn-remove-edit-acc").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.getAttribute("data-index"));
        editProfileAccounts.splice(idx, 1);
        renderEditAccountsList();
      });
    });
  };

  const btnAddRegAccount = document.getElementById("btn_add_reg_account");
  if (btnAddRegAccount) {
    btnAddRegAccount.addEventListener("click", () => {
      const inputEl = document.getElementById("profile_lucky_account_input");
      if (!inputEl) return;
      const val = inputEl.value.trim();
      if (!val) {
        showToast("Vui lòng nhập tên tài khoản", "error");
        return;
      }
      if (registrationAccounts.includes(val)) {
        showToast("Tài khoản này đã được thêm", "error");
        return;
      }
      registrationAccounts.push(val);
      inputEl.value = "";
      renderRegAccountsList();
    });
  }

  const btnAddEditAccount = document.getElementById("btn_add_edit_account");
  if (btnAddEditAccount) {
    btnAddEditAccount.addEventListener("click", () => {
      const inputEl = document.getElementById("edit_profile_lucky_account_input");
      if (!inputEl) return;
      const val = inputEl.value.trim();
      if (!val) {
        showToast("Vui lòng nhập tên tài khoản", "error");
        return;
      }
      if (editProfileAccounts.includes(val)) {
        showToast("Tài khoản này đã được thêm", "error");
        return;
      }
      editProfileAccounts.push(val);
      inputEl.value = "";
      renderEditAccountsList();
    });
  }

  const setupEnterToAddAccount = (inputId, btnId) => {
    const inputEl = document.getElementById(inputId);
    const btnEl = document.getElementById(btnId);
    if (inputEl && btnEl) {
      inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          btnEl.click();
        }
      });
    }
  };

  setupEnterToAddAccount("profile_lucky_account_input", "btn_add_reg_account");
  setupEnterToAddAccount("edit_profile_lucky_account_input", "btn_add_edit_account");

  const btnSubmitProfile = document.getElementById("btn_submit_profile");
  if (btnSubmitProfile) {
    btnSubmitProfile.addEventListener("click", () => {
      if(!auth.currentUser) return;
      const team = document.getElementById("profile_team").value.trim();
      const errEl = document.getElementById("profile_error");
      
      // Auto-add any current typed input
      const inputEl = document.getElementById("profile_lucky_account_input");
      if (inputEl && inputEl.value.trim()) {
        const val = inputEl.value.trim();
        if (!registrationAccounts.includes(val)) {
          registrationAccounts.push(val);
          inputEl.value = "";
        }
      }
      renderRegAccountsList();
      
      if(registrationAccounts.length === 0 || !team) {
         errEl.innerText = "Vui lòng thêm ít nhất một tài khoản và nhập tên Team.";
         errEl.style.display = "block";
         return;
      }
      errEl.style.display = "none";
      btnSubmitProfile.innerText = "Đang gửi...";
      btnSubmitProfile.disabled = true;
      
      const accountStr = registrationAccounts.join(", ");
      const userRef = doc(db, "users", auth.currentUser.uid);
      updateDoc(userRef, {
         luckyShopAccount: accountStr,
         luckyShopAccounts: registrationAccounts,
         luckyShopTeam: team,
         isProfileComplete: true,
         status: "pending"
      }).then(() => {
         // Yêu cầu tự động gửi mail
         addDoc(collection(db, "mail"), {
            to: "vinh.ngtienmdb@gmail.com",
            message: {
               subject: `[Lucky Shop] Yêu cầu phê duyệt mới từ: ${auth.currentUser.email}`,
               html: `<p>Có người dùng mới yêu cầu phê duyệt sử dụng hệ thống.</p>
                      <ul>
                        <li>Email: ${auth.currentUser.email}</li>
                        <li>Tên: ${auth.currentUser.displayName || ''}</li>
                        <li>Tài khoản Lucky Shop: ${accountStr}</li>
                        <li>Team: ${team}</li>
                      </ul>
                      <p>Vui lòng đăng nhập hệ thống để phê duyệt cho User này.</p>`
            }
         });
         logAction("Gửi yêu cầu phê duyệt", { luckyShopAccount: accountStr, luckyShopAccounts: registrationAccounts, luckyShopTeam: team });
         btnSubmitProfile.innerText = "Gửi yêu cầu phê duyệt";
         btnSubmitProfile.disabled = false;
         showToast("Đã gửi yêu cầu thành công!", "success");
      }).catch(e => {
         errEl.innerText = "Lỗi gửi yêu cầu: " + e.message;
         errEl.style.display = "block";
         btnSubmitProfile.innerText = "Gửi yêu cầu phê duyệt";
         btnSubmitProfile.disabled = false;
      });
    });
  }

  const btnLogoutFromPending = document.getElementById("btn_logout_from_pending");
  if (btnLogoutFromPending) {
    btnLogoutFromPending.addEventListener("click", () => {
        logAction("Đăng xuất", { from: "pending state" });
        setTimeout(() => signOut(auth), 500);
    });
  }



  const btnSaveEditProfile = document.getElementById("btn_save_edit_profile");
  if (btnSaveEditProfile) {
    btnSaveEditProfile.addEventListener("click", async () => {
      const editTeam = document.getElementById("edit_profile_team");
      const editCurrLixi = document.getElementById("edit_profile_curr_lixi");
      const editLimit = document.getElementById("edit_profile_lucky_limit");
      const errDiv = document.getElementById("edit_profile_error");
      
      const team = editTeam ? editTeam.value.trim() : "";
      const currLixi = editCurrLixi ? parseFloat(editCurrLixi.value) : 0;
      const limit = editLimit ? parseFloat(editLimit.value) : 0;
      
      // Auto-add any current typed input
      const editInputEl = document.getElementById("edit_profile_lucky_account_input");
      if (editInputEl && editInputEl.value.trim()) {
        const val = editInputEl.value.trim();
        if (!editProfileAccounts.includes(val)) {
          editProfileAccounts.push(val);
          editInputEl.value = "";
        }
      }
      renderEditAccountsList();
      
      if (editProfileAccounts.length === 0) {
          if (errDiv) {
              errDiv.innerText = "Vui lòng thêm ít nhất một tài khoản Lucky Shop.";
              errDiv.style.display = "block";
          }
          return;
      }
      if (!team) {
          if (errDiv) {
              errDiv.innerText = "Vui lòng nhập tên Team.";
              errDiv.style.display = "block";
          }
          return;
      }
      
      try {
          if (auth.currentUser) {
              btnSaveEditProfile.disabled = true;
              btnSaveEditProfile.innerText = "Đang xử lý...";
              
              const targetUid = window.editingUserId || auth.currentUser.uid;
              const accountStr = editProfileAccounts.join(", ");
              await updateDoc(doc(db, "users", targetUid), {
                  luckyShopAccount: accountStr,
                  luckyShopAccounts: editProfileAccounts,
                  luckyShopTeam: team,
                  currentLuckyBalance: isNaN(currLixi) ? 0 : currLixi,
                  luckyLimit: isNaN(limit) ? 0 : limit,
              });
              
              logAction("Cập nhật thiết lập tài khoản", { 
                  targetUid: targetUid,
                  luckyShopAccount: accountStr,
                  luckyShopAccounts: editProfileAccounts, 
                  luckyShopTeam: team, 
                  currentLuckyBalance: isNaN(currLixi) ? 0 : currLixi, 
                  luckyLimit: isNaN(limit) ? 0 : limit 
              });
              
              showToast("Cập nhật tài khoản thành công!", "success");
              document.getElementById("edit_profile_modal").style.display = "none";
              window.editingUserId = null;
          }
      } catch (err) {
          console.error(err);
          if (errDiv) {
              errDiv.innerText = "Lỗi khi lưu dữ liệu: " + err.message;
              errDiv.style.display = "block";
          }
      } finally {
          if (btnSaveEditProfile) {
              btnSaveEditProfile.disabled = false;
              btnSaveEditProfile.innerText = "Áp dụng";
          }
      }
    });
  }

  // --- PRODUCT MANAGEMENT FEATURE ---
  let productsListUnsub = null;
  let globalProductsList = [];

  const updateProductsUI = () => {
    const productSelect = document.getElementById("p_product_select");
    if (!productSelect) return;

    const currentValue = productSelect.value;
    
    // Clear options but preserve manual and create new options
    productSelect.innerHTML = "";
    
    const manualOpt = document.createElement("option");
    manualOpt.value = "";
    manualOpt.textContent = "-- Nhập thủ công --";
    productSelect.appendChild(manualOpt);
    
    globalProductsList.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      const formattedPrice = new Intl.NumberFormat("vi-VN").format(p.price);
      opt.textContent = `${p.name} (${formattedPrice} đ)`;
      productSelect.appendChild(opt);
    });
    
    const createNewOpt = document.createElement("option");
    createNewOpt.value = "create_new";
    createNewOpt.textContent = "➕ Tạo sản phẩm mới...";
    productSelect.appendChild(createNewOpt);
    
    if (window.pendingSelectProductId && globalProductsList.some(p => p.id === window.pendingSelectProductId)) {
      productSelect.value = window.pendingSelectProductId;
      window.pendingSelectProductId = null;
      const prod = globalProductsList.find(p => p.id === productSelect.value);
      if (prod) {
        inputs.p_price.value = new Intl.NumberFormat("vi-VN").format(prod.price);
        calculate();
      }
    } else if (currentValue && [...productSelect.options].some(opt => opt.value === currentValue)) {
      productSelect.value = currentValue;
    } else {
      productSelect.value = "";
    }

    updateProductManagerList();
  };

  const updateProductManagerList = () => {
    const listEl = document.getElementById("pm_products_list");
    if (!listEl) return;
    
    if (globalProductsList.length === 0) {
      listEl.innerHTML = `<div style="font-style: italic; color: #94a3b8; text-align: center; padding: 15px 0;">Chưa có sản phẩm nào. Hãy thêm ở trên!</div>`;
      return;
    }
    
    listEl.innerHTML = "";
    globalProductsList.forEach(p => {
      const item = document.createElement("div");
      item.style.display = "flex";
      item.style.justifyContent = "space-between";
      item.style.alignItems = "center";
      item.style.padding = "8px 12px";
      item.style.background = "white";
      item.style.border = "1px solid #e2e8f0";
      item.style.borderRadius = "6px";
      item.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)";
      item.style.marginBottom = "6px";
      
      const formattedPrice = new Intl.NumberFormat("vi-VN").format(p.price);
      
      item.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span style="font-weight: 600; color: #1e293b; font-size: 0.9rem;">${p.name}</span>
          <span style="font-weight: 500; color: #2563eb; font-size: 0.85rem;">${formattedPrice} VNĐ</span>
        </div>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="btn-edit-prod" data-id="${p.id}" style="padding: 4px 8px; background: #eff6ff; color: #2563eb; border: none; border-radius: 4px; font-size: 0.78rem; cursor: pointer; font-weight: 600; transition: all 0.2s;">Sửa</button>
          <button type="button" class="btn-delete-prod" data-id="${p.id}" style="padding: 4px 8px; background: #fef2f2; color: #ef4444; border: none; border-radius: 4px; font-size: 0.78rem; cursor: pointer; font-weight: 600; transition: all 0.2s;">Xóa</button>
        </div>
      `;
      listEl.appendChild(item);
    });
    
    listEl.querySelectorAll(".btn-edit-prod").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        const prod = globalProductsList.find(p => p.id === id);
        if (prod) {
          const pmIdEl = document.getElementById("pm_product_id");
          const pmNameEl = document.getElementById("pm_p_name");
          const pmPriceEl = document.getElementById("pm_p_price");
          const pmFormTitleEl = document.getElementById("pm_form_title");
          const pmCancelEl = document.getElementById("btn_pm_cancel");
          
          if (pmIdEl) pmIdEl.value = prod.id;
          if (pmNameEl) pmNameEl.value = prod.name;
          if (pmPriceEl) pmPriceEl.value = new Intl.NumberFormat("vi-VN").format(prod.price);
          if (pmFormTitleEl) pmFormTitleEl.textContent = "✏️ Sửa sản phẩm";
          if (pmCancelEl) pmCancelEl.style.display = "inline-block";
          if (pmNameEl) pmNameEl.focus();
        }
      });
    });
    
    listEl.querySelectorAll(".btn-delete-prod").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        const prod = globalProductsList.find(p => p.id === id);
        if (prod && confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${prod.name}" không?`)) {
          try {
            await deleteDoc(doc(db, "products", id));
            showToast("Đã xóa sản phẩm thành công", "success");
            logAction("Xóa sản phẩm", { productId: id, name: prod.name });
            const productSelect = document.getElementById("p_product_select");
            if (productSelect && productSelect.value === id) {
              productSelect.value = "";
              calculate();
            }
          } catch (err) {
            showToast("Lỗi khi xóa sản phẩm: " + err.message, "error");
          }
        }
      });
    });
  };

  const productSelect = document.getElementById("p_product_select");
  const quickProductContainer = document.getElementById("quick_product_container");
  const quickPName = document.getElementById("quick_p_name");
  const quickPPrice = document.getElementById("quick_p_price");
  const btnQuickCancelProduct = document.getElementById("btn_quick_cancel_product");
  const btnQuickSaveProduct = document.getElementById("btn_quick_save_product");
  const btnManageProducts = document.getElementById("btn_manage_products");
  
  const pmProductId = document.getElementById("pm_product_id");
  const pmPName = document.getElementById("pm_p_name");
  const pmPPrice = document.getElementById("pm_p_price");
  const btnPmCancel = document.getElementById("btn_pm_cancel");
  const btnPmSave = document.getElementById("btn_pm_save");

  if (productSelect) {
    productSelect.addEventListener("change", () => {
      const val = productSelect.value;
      if (val === "create_new") {
        if (quickProductContainer) quickProductContainer.style.display = "block";
        if (quickPName) {
          quickPName.value = "";
          quickPName.focus();
        }
        if (quickPPrice) quickPPrice.value = "";
      } else if (val !== "") {
        if (quickProductContainer) quickProductContainer.style.display = "none";
        const prod = globalProductsList.find(p => p.id === val);
        if (prod && inputs.p_price) {
          inputs.p_price.value = new Intl.NumberFormat("vi-VN").format(prod.price);
          calculate();
        }
      } else {
        if (quickProductContainer) quickProductContainer.style.display = "none";
      }
    });
  }

  if (btnQuickCancelProduct) {
    btnQuickCancelProduct.addEventListener("click", () => {
      if (productSelect) productSelect.value = "";
      if (quickProductContainer) quickProductContainer.style.display = "none";
    });
  }

  if (btnQuickSaveProduct) {
    btnQuickSaveProduct.addEventListener("click", async () => {
      const name = quickPName ? quickPName.value.trim() : "";
      const priceStr = quickPPrice ? quickPPrice.value.replace(/\D/g, "") : "";
      const price = parseFloat(priceStr) || 0;
      
      if (!name) {
        showToast("Vui lòng nhập tên sản phẩm", "error");
        return;
      }
      if (price <= 0) {
        showToast("Giá sản phẩm phải lớn hơn 0 VNĐ", "error");
        return;
      }
      
      try {
        btnQuickSaveProduct.disabled = true;
        const docRef = await addDoc(collection(db, "products"), {
          name,
          price,
          createdBy: auth.currentUser ? auth.currentUser.email : "guest",
          createdAt: new Date().toISOString()
        });
        
        window.pendingSelectProductId = docRef.id;
        showToast("Thêm sản phẩm thành công!", "success");
        logAction("Tạo sản phẩm nhanh", { name, price });
        
        if (quickPName) quickPName.value = "";
        if (quickPPrice) quickPPrice.value = "";
        if (quickProductContainer) quickProductContainer.style.display = "none";
      } catch (err) {
        showToast("Lỗi khi tạo sản phẩm: " + err.message, "error");
      } finally {
        btnQuickSaveProduct.disabled = false;
      }
    });
  }



  if (btnPmCancel) {
    btnPmCancel.addEventListener("click", () => {
      if (pmProductId) pmProductId.value = "";
      if (pmPName) pmPName.value = "";
      if (pmPPrice) pmPPrice.value = "";
      btnPmCancel.style.display = "none";
      const title = document.getElementById("pm_form_title");
      if (title) title.textContent = "➕ Thêm sản phẩm mới";
    });
  }

  if (btnPmSave) {
    btnPmSave.addEventListener("click", async () => {
      const id = pmProductId ? pmProductId.value : "";
      const name = pmPName ? pmPName.value.trim() : "";
      const priceStr = pmPPrice ? pmPPrice.value.replace(/\D/g, "") : "";
      const price = parseFloat(priceStr) || 0;
      
      if (!name) {
        showToast("Vui lòng nhập tên sản phẩm", "error");
        return;
      }
      if (price <= 0) {
        showToast("Giá sản phẩm phải lớn hơn 0 VNĐ", "error");
        return;
      }
      
      try {
        btnPmSave.disabled = true;
        if (id) {
          await updateDoc(doc(db, "products", id), {
            name,
            price
          });
          showToast("Cập nhật sản phẩm thành công", "success");
          logAction("Sửa sản phẩm", { productId: id, name, price });
          if (productSelect && productSelect.value === id && inputs.p_price) {
            inputs.p_price.value = new Intl.NumberFormat("vi-VN").format(price);
            calculate();
          }
        } else {
          await addDoc(collection(db, "products"), {
            name,
            price,
            createdBy: auth.currentUser ? auth.currentUser.email : "guest",
            createdAt: new Date().toISOString()
          });
          showToast("Thêm sản phẩm thành công", "success");
          logAction("Tạo sản phẩm", { name, price });
        }
        
        if (pmProductId) pmProductId.value = "";
        if (pmPName) pmPName.value = "";
        if (pmPPrice) pmPPrice.value = "";
        if (btnPmCancel) btnPmCancel.style.display = "none";
        const title = document.getElementById("pm_form_title");
        if (title) title.textContent = "➕ Thêm sản phẩm mới";
      } catch (err) {
        showToast("Lỗi khi lưu sản phẩm: " + err.message, "error");
      } finally {
        btnPmSave.disabled = false;
      }
    });
  }

  const formatAsCurrencyInput = (e) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val !== "") {
      e.target.value = new Intl.NumberFormat("vi-VN").format(parseInt(val, 10));
    } else {
      e.target.value = "";
    }
  };

  if (quickPPrice) {
    quickPPrice.addEventListener("input", formatAsCurrencyInput);
  }
  if (pmPPrice) {
    pmPPrice.addEventListener("input", formatAsCurrencyInput);
  }

  // Connect real-time stream for products (accessible to guests and logged-in users)
  onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), (snapshot) => {
    const list = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    globalProductsList = list;
    updateProductsUI();
  }, (error) => {
    console.error("Lỗi lấy danh sách sản phẩm:", error);
  });

  // --- AGRICULTURAL PRODUCT MANAGEMENT FEATURE ---
  const updateAgriProductsSelect = () => {
    const selectProduct = document.getElementById("calc_agri_product");
    if (!selectProduct) return;
    
    const currentValue = selectProduct.value;
    selectProduct.innerHTML = '<option value="custom">-- Nhập sản phẩm tự chọn --</option>';
    
    const agriProducts = window.agriProducts || [];
    agriProducts.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.name} (${new Intl.NumberFormat("vi-VN").format(p.promoPrice)} đ)`;
      selectProduct.appendChild(opt);
    });

    // Auto-pin/select "Đường mạch nha" on initial load if it exists in list
    if (window.agriState && !window.hasAgriFirstLoadPinned) {
      const machNha = agriProducts.find(p => p.name && (p.name.toLowerCase().includes("mạch nha") || p.name.toLowerCase().includes("mach nha")));
      if (machNha) {
        window.agriState.selectedProductId = machNha.id;
        window.agriState.resaleUnitPrice = machNha.marketPrice;
        window.hasAgriFirstLoadPinned = true;
      }
    }
    
    if (agriState.selectedProductId && [...selectProduct.options].some(o => o.value === agriState.selectedProductId)) {
      selectProduct.value = agriState.selectedProductId;
    } else if (currentValue && [...selectProduct.options].some(o => o.value === currentValue)) {
      selectProduct.value = currentValue;
    } else {
      selectProduct.value = "custom";
      agriState.selectedProductId = "custom";
    }
  };

  const updateAgriProductsManagerList = () => {
    const listEl = document.getElementById("pm_agri_products_list");
    if (!listEl) return;
    
    const agriProducts = window.agriProducts || [];
    if (agriProducts.length === 0) {
      listEl.innerHTML = `<div style="font-style: italic; color: #94a3b8; text-align: center; padding: 15px 0;">Chưa có sản phẩm nông sản nào. Hãy thêm ở trên!</div>`;
      return;
    }
    
    listEl.innerHTML = "";
    agriProducts.forEach(p => {
      const item = document.createElement("div");
      item.style.display = "flex";
      item.style.justifyContent = "space-between";
      item.style.alignItems = "center";
      item.style.padding = "8px 12px";
      item.style.background = "white";
      item.style.border = "1px solid #cbd5e1";
      item.style.borderRadius = "6px";
      item.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)";
      item.style.marginBottom = "6px";
      
      const formattedPromoPrice = new Intl.NumberFormat("vi-VN").format(p.promoPrice);
      const formattedMarketPrice = new Intl.NumberFormat("vi-VN").format(p.marketPrice);
      
      item.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <span style="font-weight: 600; color: #1e293b; font-size: 0.9rem;">${p.name}</span>
          <span style="font-weight: 500; color: #16a34a; font-size: 0.85rem;">KM: ${formattedPromoPrice} đ (Gốc: ${formattedMarketPrice} đ)</span>
          <span style="font-size: 0.75rem; color: #64748b;">Sỉ: Mua ${p.bulkPromo.buy} tặng ${p.bulkPromo.gift}</span>
        </div>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="btn-edit-agri-prod" data-id="${p.id}" style="padding: 4px 8px; background: #f0fdf4; color: #16a34a; border: none; border-radius: 4px; font-size: 0.78rem; cursor: pointer; font-weight: 600; transition: all 0.2s;">Sửa</button>
          <button type="button" class="btn-delete-agri-prod" data-id="${p.id}" style="padding: 4px 8px; background: #fef2f2; color: #ef4444; border: none; border-radius: 4px; font-size: 0.78rem; cursor: pointer; font-weight: 600; transition: all 0.2s;">Xóa</button>
        </div>
      `;
      listEl.appendChild(item);
    });
    
    listEl.querySelectorAll(".btn-edit-agri-prod").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        const prod = agriProducts.find(p => p.id === id);
        if (prod) {
          document.getElementById("pm_agri_product_id").value = prod.id;
          document.getElementById("pm_agri_p_name").value = prod.name;
          document.getElementById("pm_agri_p_market_price").value = new Intl.NumberFormat("vi-VN").format(prod.marketPrice);
          document.getElementById("pm_agri_p_promo_price").value = new Intl.NumberFormat("vi-VN").format(prod.promoPrice);
          document.getElementById("pm_agri_p_bulk_buy").value = prod.bulkPromo.buy;
          document.getElementById("pm_agri_p_bulk_gift").value = prod.bulkPromo.gift;
          document.getElementById("pm_agri_form_title").textContent = "✏️ Sửa sản phẩm nông sản";
          document.getElementById("btn_pm_agri_cancel").style.display = "inline-block";
          document.getElementById("pm_agri_p_name").focus();
        }
      });
    });
    
    listEl.querySelectorAll(".btn-delete-agri-prod").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        const prod = agriProducts.find(p => p.id === id);
        if (prod && confirm(`Bạn có chắc chắn muốn xóa sản phẩm nông sản "${prod.name}" không?`)) {
          try {
            await deleteDoc(doc(db, "agri_products", id));
            showToast("Đã xóa sản phẩm nông sản thành công", "success");
            logAction("Xóa sản phẩm nông sản", { productId: id, name: prod.name });
            const agriProductSelect = document.getElementById("calc_agri_product");
            if (agriProductSelect && agriProductSelect.value === id) {
              agriProductSelect.value = "custom";
              agriState.selectedProductId = "custom";
              window.renderAgriDashboard();
            }
          } catch (err) {
            showToast("Lỗi khi xóa sản phẩm: " + err.message, "error");
          }
        }
      });
    });
  };

  const pmAgriProductId = document.getElementById("pm_agri_product_id");
  const pmAgriPName = document.getElementById("pm_agri_p_name");
  const pmAgriPMarketPrice = document.getElementById("pm_agri_p_market_price");
  const pmAgriPPromoPrice = document.getElementById("pm_agri_p_promo_price");
  const pmAgriPBulkBuy = document.getElementById("pm_agri_p_bulk_buy");
  const pmAgriPBulkGift = document.getElementById("pm_agri_p_bulk_gift");
  const btnPmAgriCancel = document.getElementById("btn_pm_agri_cancel");
  const btnPmAgriSave = document.getElementById("btn_pm_agri_save");

  if (pmAgriPMarketPrice) {
    pmAgriPMarketPrice.addEventListener("input", formatAsCurrencyInput);
  }
  if (pmAgriPPromoPrice) {
    pmAgriPPromoPrice.addEventListener("input", formatAsCurrencyInput);
  }

  if (btnPmAgriCancel) {
    btnPmAgriCancel.addEventListener("click", () => {
      if (pmAgriProductId) pmAgriProductId.value = "";
      if (pmAgriPName) pmAgriPName.value = "";
      if (pmAgriPMarketPrice) pmAgriPMarketPrice.value = "";
      if (pmAgriPPromoPrice) pmAgriPPromoPrice.value = "";
      if (pmAgriPBulkBuy) pmAgriPBulkBuy.value = "10";
      if (pmAgriPBulkGift) pmAgriPBulkGift.value = "1";
      btnPmAgriCancel.style.display = "none";
      const title = document.getElementById("pm_agri_form_title");
      if (title) title.textContent = "➕ Thêm sản phẩm nông sản mới";
    });
  }

  if (btnPmAgriSave) {
    btnPmAgriSave.addEventListener("click", async () => {
      const id = pmAgriProductId ? pmAgriProductId.value : "";
      const name = pmAgriPName ? pmAgriPName.value.trim() : "";
      const marketPriceStr = pmAgriPMarketPrice ? pmAgriPMarketPrice.value.replace(/\D/g, "") : "";
      const marketPrice = parseFloat(marketPriceStr) || 0;
      const promoPriceStr = pmAgriPPromoPrice ? pmAgriPPromoPrice.value.replace(/\D/g, "") : "";
      const promoPrice = parseFloat(promoPriceStr) || 0;
      const bulkBuy = pmAgriPBulkBuy ? parseInt(pmAgriPBulkBuy.value, 10) || 10 : 10;
      const bulkGift = pmAgriPBulkGift ? parseInt(pmAgriPBulkGift.value, 10) || 1 : 1;
      
      if (!name) {
        showToast("Vui lòng nhập tên sản phẩm nông sản", "error");
        return;
      }
      if (marketPrice <= 0) {
        showToast("Giá thị trường phải lớn hơn 0 VNĐ", "error");
        return;
      }
      if (promoPrice <= 0) {
        showToast("Giá khuyến mại phải lớn hơn 0 VNĐ", "error");
        return;
      }
      
      try {
        btnPmAgriSave.disabled = true;
        if (id) {
          await updateDoc(doc(db, "agri_products", id), {
            name,
            marketPrice,
            promoPrice,
            bulkBuy,
            bulkGift
          });
          showToast("Cập nhật sản phẩm nông sản thành công", "success");
          logAction("Sửa sản phẩm nông sản", { productId: id, name, marketPrice, promoPrice, bulkBuy, bulkGift });
        } else {
          await addDoc(collection(db, "agri_products"), {
            name,
            marketPrice,
            promoPrice,
            bulkBuy,
            bulkGift,
            createdBy: auth.currentUser ? auth.currentUser.email : "guest",
            createdAt: new Date().toISOString()
          });
          showToast("Thêm sản phẩm nông sản thành công", "success");
          logAction("Tạo sản phẩm nông sản", { name, marketPrice, promoPrice, bulkBuy, bulkGift });
        }
        
        if (pmAgriProductId) pmAgriProductId.value = "";
        if (pmAgriPName) pmAgriPName.value = "";
        if (pmAgriPMarketPrice) pmAgriPMarketPrice.value = "";
        if (pmAgriPPromoPrice) pmAgriPPromoPrice.value = "";
        if (pmAgriPBulkBuy) pmAgriPBulkBuy.value = "10";
        if (pmAgriPBulkGift) pmAgriPBulkGift.value = "1";
        if (btnPmAgriCancel) btnPmAgriCancel.style.display = "none";
        const title = document.getElementById("pm_agri_form_title");
        if (title) title.textContent = "➕ Thêm sản phẩm nông sản mới";
      } catch (err) {
        showToast("Lỗi khi lưu sản phẩm nông sản: " + err.message, "error");
      } finally {
        btnPmAgriSave.disabled = false;
      }
    });
  }

  // Connect real-time stream for agricultural products
  onSnapshot(query(collection(db, "agri_products"), orderBy("createdAt", "desc")), (snapshot) => {
    const list = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        name: data.name,
        marketPrice: data.marketPrice,
        promoPrice: data.promoPrice,
        bulkPromo: {
          buy: data.bulkBuy || 10,
          gift: data.bulkGift || 1
        }
      });
    });
    window.agriProducts.length = 0;
    window.agriProducts.push(...list);
    updateAgriProductsSelect();
    updateAgriProductsManagerList();
    if (typeof window.renderAgriDashboard === "function") {
      window.renderAgriDashboard();
    }
  }, (error) => {
    console.error("Lỗi lấy danh sách sản phẩm nông sản:", error);
  });

  onSnapshot(doc(db, "configs", "main"), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const setVal = (id, val) => {
        if (val !== undefined && document.getElementById(id))
          document.getElementById(id).value = val;
      };
      setVal("a_max_tgd", data.a_max_tgd);
      setVal("a_max_gd", data.a_max_gd);
      setVal("a_max_ql", data.a_max_ql);
      setVal("a_max_nv", data.a_max_nv);
      setVal("a_agri_max_tgd", data.a_agri_max_tgd !== undefined ? data.a_agri_max_tgd : data.a_max_tgd);
      setVal("a_agri_max_gd", data.a_agri_max_gd !== undefined ? data.a_agri_max_gd : data.a_max_gd);
      setVal("a_agri_max_ql", data.a_agri_max_ql !== undefined ? data.a_agri_max_ql : data.a_max_ql);
      setVal("a_agri_max_nv", data.a_agri_max_nv !== undefined ? data.a_agri_max_nv : data.a_max_nv);
      setVal("a_max_direct", data.a_max_direct);
      setVal("a_max_indirect", data.a_max_indirect);
      setVal("a_agri_max_direct", data.a_agri_max_direct !== undefined ? data.a_agri_max_direct : data.a_max_direct);
      setVal("a_agri_max_indirect", data.a_agri_max_indirect !== undefined ? data.a_agri_max_indirect : data.a_max_indirect);
      setVal("p_b_rate1", data.p_b_rate1);
      setVal("p_b_rate2", data.p_b_rate2);
      setVal("p_b_rate3", data.p_b_rate3);
      setVal("p_b_rate4", data.p_b_rate4);
      setVal("p_b_rate5", data.p_b_rate5);
      setVal("p_b_rate6", data.p_b_rate6);
      setVal("p_b_rate7", data.p_b_rate7);
      setVal("p_dailyLuckyRate", data.p_dailyLuckyRate);
      setVal("p_luckyMul", data.p_luckyMul);
      if (data.p_moneyToTicketRate !== undefined) setVal("p_moneyToTicketRate", data.p_moneyToTicketRate);
      if (data.p_moneyToTicketRatePromo !== undefined) setVal("p_moneyToTicketRatePromo", data.p_moneyToTicketRatePromo);
      if (data.p_platformFeeRate !== undefined) setVal("p_platformFeeRate", data.p_platformFeeRate);
      if (data.p_platformFeeOldRate !== undefined) setVal("p_platformFeeOldRate", data.p_platformFeeOldRate);
      if (data.p_platformFeeStartDate !== undefined) setVal("p_platformFeeStartDate", data.p_platformFeeStartDate);
      if (data.p_promoStartDate !== undefined) setVal("p_promoStartDate", data.p_promoStartDate);
      if (data.p_promoEndDate !== undefined) setVal("p_promoEndDate", data.p_promoEndDate);
      
      // Apply UI defaults
      if (data.ui_p_price !== undefined) setVal("p_price", data.ui_p_price);
      if (data.ui_p_turns !== undefined) {
         if (document.getElementById("p_turns")) {
            if (document.getElementById("p_turns").tagName === "INPUT") {
                document.getElementById("p_turns").value = data.ui_p_turns;
            } else {
                document.getElementById("p_turns").innerText = data.ui_p_turns;
            }
         }
      }
      if (data.ui_p_calcMonths !== undefined) setVal("p_calcMonths", data.ui_p_calcMonths);
      if (data.ui_p_calcDays !== undefined) setVal("p_calcDays", data.ui_p_calcDays);
      if (data.ui_p_self_resell_amount !== undefined) setVal("p_self_resell_amount", data.ui_p_self_resell_amount);
      if (data.ui_p_choice) {
          if (document.getElementById("p_choice_take")) document.getElementById("p_choice_take").checked = data.ui_p_choice === "take";
          if (document.getElementById("p_choice_resell_platform")) document.getElementById("p_choice_resell_platform").checked = data.ui_p_choice === "resell_platform";
          if (document.getElementById("p_choice_resell_self")) document.getElementById("p_choice_resell_self").checked = data.ui_p_choice === "resell_self";
      }

      if (typeof calculate === "function") calculate();
    }
  }, (error) => console.error("Error reading main config:", error));

  const btnPreviewPromo = document.getElementById("btn_preview_promo");
  if (btnPreviewPromo) {
      btnPreviewPromo.addEventListener("click", () => {
          window.isPromoPreviewActive = true;
          calculate(); // Triggers config application and shows UI
          const adminModalEl = document.getElementById('admin_modal');
          if (adminModalEl) adminModalEl.style.display = 'none'; // Close admin config temporarily
      });
  }



  if (btnSaveConfig) {
    btnSaveConfig.addEventListener("click", () => {
      if (!auth.currentUser) {
        showToast("Bạn cần đăng nhập để lưu cấu hình!", "error");
        return;
      }
      if (currentUserRole !== "admin") {
        showToast("Bạn không có quyền quản trị viên để lưu cấu hình!", "error");
        return;
      }
      const getVal = (id) => parseFloat(document.getElementById(id).value) || 0;
      const newConfig = {
        a_max_tgd: getVal("a_max_tgd"),
        a_max_gd: getVal("a_max_gd"),
        a_max_ql: getVal("a_max_ql"),
        a_max_nv: getVal("a_max_nv"),
        a_agri_max_tgd: getVal("a_agri_max_tgd"),
        a_agri_max_gd: getVal("a_agri_max_gd"),
        a_agri_max_ql: getVal("a_agri_max_ql"),
        a_agri_max_nv: getVal("a_agri_max_nv"),
        a_max_direct: getVal("a_max_direct"),
        a_max_indirect: getVal("a_max_indirect"),
        a_agri_max_direct: getVal("a_agri_max_direct"),
        a_agri_max_indirect: getVal("a_agri_max_indirect"),
        p_b_rate1: getVal("p_b_rate1"),
        p_b_rate2: getVal("p_b_rate2"),
        p_b_rate3: getVal("p_b_rate3"),
        p_b_rate4: getVal("p_b_rate4"),
        p_b_rate5: getVal("p_b_rate5"),
        p_b_rate6: getVal("p_b_rate6"),
        p_b_rate7: getVal("p_b_rate7"),
        p_dailyLuckyRate: getVal("p_dailyLuckyRate"),
        p_luckyMul: getVal("p_luckyMul"),
        p_moneyToTicketRate: getVal("p_moneyToTicketRate"),
        p_moneyToTicketRatePromo: getVal("p_moneyToTicketRatePromo"),
        p_platformFeeRate: getVal("p_platformFeeRate"),
        p_platformFeeOldRate: getVal("p_platformFeeOldRate"),
        p_platformFeeStartDate: document.getElementById("p_platformFeeStartDate").value,
        p_promoStartDate: document.getElementById("p_promoStartDate").value,
        p_promoEndDate: document.getElementById("p_promoEndDate").value,
      };

      setDoc(doc(db, "configs", "main"), newConfig, { merge: true })
        .then(() => {
          showToast(
            "Lưu cấu hình thành công! Mọi người dùng trên hệ thống sẽ tự động thấy hệ số mới.",
            "success",
          );
          logAction("Cập nhật cấu hình hệ thống", newConfig);
        })
        .catch((err) => showToast("Lỗi khi lưu: " + err.message, "error"));
    });
  }
}
// --- END FIREBASE SETUP ---

// Main DOM Elements
const inputs = {
  p_price: document.getElementById("p_price"),
  p_calcMonths: document.getElementById("p_calcMonths"),
  p_calcDays: document.getElementById("p_calcDays"),
  p_turns: document.getElementById("p_turns"),
  p_choice_take: document.getElementById("p_choice_take"),
  p_choice_resell_platform: document.getElementById("p_choice_resell_platform"),
  p_choice_resell_self: document.getElementById("p_choice_resell_self"),
  p_self_resell_amount: document.getElementById("p_self_resell_amount"),
  self_resell_input_container: document.getElementById("self_resell_input_container"),
  p_dailyLuckyRate: document.getElementById("p_dailyLuckyRate"),
  p_luckyMul: document.getElementById("p_luckyMul"),
  p_moneyToTicketRate: document.getElementById("p_moneyToTicketRate"),
  p_moneyToTicketRatePromo: document.getElementById("p_moneyToTicketRatePromo"),
  p_promoStartDate: document.getElementById("p_promoStartDate"),
  p_promoEndDate: document.getElementById("p_promoEndDate"),
  p_platformFeeRate: document.getElementById("p_platformFeeRate"),
  p_platformFeeOldRate: document.getElementById("p_platformFeeOldRate"),
  p_platformFeeStartDate: document.getElementById("p_platformFeeStartDate"),
  p_b_rate1: document.getElementById("p_b_rate1"),
  p_b_rate2: document.getElementById("p_b_rate2"),
  p_b_rate3: document.getElementById("p_b_rate3"),
  p_b_rate4: document.getElementById("p_b_rate4"),
  p_b_rate5: document.getElementById("p_b_rate5"),
  p_b_rate6: document.getElementById("p_b_rate6"),
  p_b_rate7: document.getElementById("p_b_rate7"),

  admin_mode_toggle: document.getElementById("admin_mode_toggle"),
  u_rank: document.getElementById("u_rank"),
  u_sub_gd: document.getElementById("u_sub_gd"),
  u_sub_ql: document.getElementById("u_sub_ql"),
  u_sub_nv: document.getElementById("u_sub_nv"),
  a_max_nv: document.getElementById("a_max_nv"),
  a_max_ql: document.getElementById("a_max_ql"),
  a_max_gd: document.getElementById("a_max_gd"),
  a_max_tgd: document.getElementById("a_max_tgd"),
  a_max_direct: document.getElementById("a_max_direct"),
  a_max_indirect: document.getElementById("a_max_indirect"),
  a_agri_max_direct: document.getElementById("a_agri_max_direct"),
  a_agri_max_indirect: document.getElementById("a_agri_max_indirect"),
};

// Calculated DOM Elements
const calc = {
  c_groupPrice: document.getElementById("c_groupPrice"),
  c_unitPrice: document.getElementById("c_unitPrice"),
  c_deduction: document.getElementById("c_deduction"),
  c_totalInvest: document.getElementById("c_totalInvest"),
  c_luckyBalance: document.getElementById("c_luckyBalance"),

  // c_dist removed

  b_amt1: document.getElementById("b_amt1"),
  b_amt2: document.getElementById("b_amt2"),
  b_amt3: document.getElementById("b_amt3"),
  b_amt4: document.getElementById("b_amt4"),
  b_amt5: document.getElementById("b_amt5"),
  b_amt6: document.getElementById("b_amt6"),
  b_amt7: document.getElementById("b_amt7"),

  b_totalHH: document.getElementById("b_totalHH"),
  b_resellAmt: document.getElementById("b_resellAmt"),
  b_capitalReturned: document.getElementById("b_capitalReturned"),
  b_instantTotal: document.getElementById("b_instantTotal"),
  b_needToCover: document.getElementById("b_needToCover"),

  d_totalInvest: document.getElementById("d_totalInvest"),
  d_resellReturn: document.getElementById("d_resellReturn"),
  d_totalHH: document.getElementById("d_totalHH"),
  d_needToCover: document.getElementById("d_needToCover"),

  s_dailyLixi1: document.getElementById("s_dailyLixi1"),
  s_linearDays: document.getElementById("s_linearDays"),
  s_accLixi: document.getElementById("s_accLixi"),
  s_initialBal: document.getElementById("s_initialBal"),
  s_netProfit: document.getElementById("s_netProfit"),
  s_roi: document.getElementById("s_roi"),

  timelineBody: document.getElementById("timelineBody"),
};

const formatNumberTable = (num) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(num));

let lastCalculatedBreakEvenDay = null;

const calculate = () => {
  // Read Table A Inputs
  const priceStr = inputs.p_price.value.replace(/\./g, "");
  const price = parseFloat(priceStr) || 0;
  const turns =
    parseFloat(inputs.p_turns.value || inputs.p_turns.innerText) || 20;
    
  const isTake = inputs.p_choice_take && inputs.p_choice_take.checked;
  const isResellPlatform = inputs.p_choice_resell_platform && inputs.p_choice_resell_platform.checked;
  const isResellSelf = inputs.p_choice_resell_self && inputs.p_choice_resell_self.checked;
  
  if (inputs.self_resell_input_container) {
    if (isResellSelf) {
      inputs.self_resell_input_container.style.display = "block";
    } else {
      inputs.self_resell_input_container.style.display = "none";
    }
  }

  const dailyLuckyRate = (parseFloat(inputs.p_dailyLuckyRate.value) || 0) / 100;
  const luckyMul = parseFloat(inputs.p_luckyMul.value) || 0;
  const newTickets = 0;

  const isAdmin = false;

  if (inputs.u_rank) {
    // User Mode logic
    const rank = inputs.u_rank.value;

    let r1 = 0,
      r2 = 0,
      r3 = 0,
      r4 = 0,
      r5 = 0,
      r6 = 0,
      r7 = 0;

    // Distribution commissions are always given in User Mode
    r2 = parseFloat(inputs.a_max_direct.value) || 0;
    r3 = parseFloat(inputs.a_max_indirect.value) || 0;

    // Rank commissions
    const max_nv = parseFloat(inputs.a_max_nv.value) || 0;
    const max_ql = parseFloat(inputs.a_max_ql.value) || 0;
    const max_gd = parseFloat(inputs.a_max_gd.value) || 0;
    const max_tgd = parseFloat(inputs.a_max_tgd.value) || 0;

    let rankTarget = 0; // 4=nv, 5=ql, 6=gd, 7=tgd
    if (rank === "nv") rankTarget = 4;
    else if (rank === "ql") rankTarget = 5;
    else if (rank === "gd") rankTarget = 6;
    else if (rank === "tgd") rankTarget = 7;

    // Build the chain of participating ranks
    let participatingRanks = [];
    if (rankTarget >= 4)
      participatingRanks.push({
        id: 4,
        max: max_nv,
        active: rankTarget === 4 || inputs.u_sub_nv.checked,
      });
    if (rankTarget >= 5)
      participatingRanks.push({
        id: 5,
        max: max_ql,
        active: rankTarget === 5 || inputs.u_sub_ql.checked,
      });
    if (rankTarget >= 6)
      participatingRanks.push({
        id: 6,
        max: max_gd,
        active: rankTarget === 6 || inputs.u_sub_gd.checked,
      });
    if (rankTarget >= 7)
      participatingRanks.push({
        id: 7,
        max: max_tgd,
        active: rankTarget === 7,
      });

    // Calculate differential commissions from bottom to top
    let currentDeduction = 0;
    for (let i = 0; i < participatingRanks.length; i++) {
      let p = participatingRanks[i];
      if (p.active) {
        let commission = Math.max(0, p.max - currentDeduction);
        if (p.id === 4) r4 = commission;
        if (p.id === 5) r5 = commission;
        if (p.id === 6) r6 = commission;
        if (p.id === 7) r7 = commission;
        currentDeduction = p.max; // The next active rank above will deduct this
      }
    }

    // Update the inputs and display spans so UI reflects them
    inputs.p_b_rate1.value = r1;
    const d1 = document.getElementById("d_b_rate1");
    if (d1) d1.innerText = r1 + "%";
    inputs.p_b_rate2.value = r2;
    const d2 = document.getElementById("d_b_rate2");
    if (d2) d2.innerText = r2 + "%";
    inputs.p_b_rate3.value = r3;
    const d3 = document.getElementById("d_b_rate3");
    if (d3) d3.innerText = r3 + "%";
    inputs.p_b_rate4.value = r4;
    const d4 = document.getElementById("d_b_rate4");
    if (d4) d4.innerText = r4 + "%";
    inputs.p_b_rate5.value = r5;
    const d5 = document.getElementById("d_b_rate5");
    if (d5) d5.innerText = r5 + "%";
    inputs.p_b_rate6.value = r6;
    const d6 = document.getElementById("d_b_rate6");
    if (d6) d6.innerText = r6 + "%";
    inputs.p_b_rate7.value = r7;
    const d7 = document.getElementById("d_b_rate7");
    if (d7) d7.innerText = r7 + "%";
  }

  // Calculate Table A
  const unitPrice = price / 5;
  const groupPrice = turns * unitPrice;
  const deduction = groupPrice / 2;
  
  let moneyToTicketRate = parseFloat(inputs.p_moneyToTicketRate?.value) || 1;
  const moneyToTicketRatePromo = parseFloat(inputs.p_moneyToTicketRatePromo?.value) || 1.095;
  const promoStartStr = inputs.p_promoStartDate?.value;
  const promoEndStr = inputs.p_promoEndDate?.value;

  if (promoStartStr && promoEndStr) {
      const nowMs = Date.now();
      const startMs = new Date(promoStartStr + ":00+07:00").getTime();
      const endMs = new Date(promoEndStr + ":59+07:00").getTime();
      const notifyMs = startMs - (4 * 60 * 60 * 1000); // 4 hours before
      
      const banner = document.getElementById("promo_banner");
      const imagePromoModal = document.getElementById("image_promo_modal");
      
      let isPromoActive = nowMs >= startMs && nowMs <= endMs;
      let isNotifyActive = nowMs >= notifyMs && nowMs <= endMs;
      let isPreview = window.isPromoPreviewActive === true;

      if (isPromoActive || isPreview) {
          moneyToTicketRate = moneyToTicketRatePromo;
      }

      if (isNotifyActive || isPreview) {
          if (banner) {
              const rateDisplay = document.getElementById("promo_rate_display");
              const timeDisplay = document.getElementById("promo_time_display");
              if (rateDisplay) rateDisplay.innerText = moneyToTicketRatePromo;
              if (timeDisplay) {
                  const sd = new Date(startMs);
                  const ed = new Date(endMs);
                  timeDisplay.innerText = `${sd.getDate().toString().padStart(2, '0')}/${(sd.getMonth()+1).toString().padStart(2, '0')}/${sd.getFullYear()} - ${ed.getDate().toString().padStart(2, '0')}/${(ed.getMonth()+1).toString().padStart(2, '0')}/${ed.getFullYear()}`;
              }
          }
          
          if (imagePromoModal) {
              const popupShown = sessionStorage.getItem("promo_popup_shown_v3");
              if (!popupShown || isPreview) {
                  if (banner) banner.style.display = "none"; // Hide banner during loading

                  // remove classes first to re-trigger animations if already opened once
                  imagePromoModal.classList.remove("active");
                  const content = document.getElementById("image_promo_content");
                  const loading = document.getElementById("promo_loading");

                  if (content) {
                      content.classList.remove("active");
                      content.style.display = "none";
                  }
                  if (loading) loading.style.display = "flex";
                  
                  // Force reflow
                  void imagePromoModal.offsetWidth;

                  imagePromoModal.classList.add("active");

                  setTimeout(() => {
                      if (loading) loading.style.display = "none";
                      if (content) {
                          content.style.display = "block";
                          void content.offsetWidth;
                          content.classList.add("active");
                      }
                      if (banner) banner.style.display = "block";
                  }, 1500);

                  sessionStorage.setItem("promo_popup_shown_v3", "1");
                  if (isPreview) window.isPromoPreviewActive = false; // Reset preview state after showing
              } else {
                  if (banner) banner.style.display = "block";
              }
          } else {
              if (banner) banner.style.display = "block";
          }
      } else {
          if (banner) banner.style.display = "none";
          if (imagePromoModal) {
              imagePromoModal.classList.remove("active");
              const content = document.getElementById("image_promo_content");
              if (content) content.classList.remove("active");
          }
      }
  }

  const deductionCost = deduction / moneyToTicketRate;
  const totalInvest = groupPrice + deductionCost;
  const luckyBalance = deduction * luckyMul;

  calc.c_groupPrice.innerText = formatNumberTable(groupPrice);
  calc.c_unitPrice.innerText = formatNumberTable(unitPrice);
  calc.c_deduction.innerText = formatNumberTable(deduction);
  calc.c_totalInvest.innerText = formatNumberTable(totalInvest);
  calc.c_luckyBalance.innerText = formatNumberTable(luckyBalance);

  // Calculate Table B using its own inputs
  const r1 = (parseFloat(inputs.p_b_rate1.value) || 0) / 100;
  const r2 = (parseFloat(inputs.p_b_rate2.value) || 0) / 100;
  const r3 = (parseFloat(inputs.p_b_rate3.value) || 0) / 100;
  const r4 = (parseFloat(inputs.p_b_rate4.value) || 0) / 100;
  const r5 = (parseFloat(inputs.p_b_rate5.value) || 0) / 100;
  const r6 = (parseFloat(inputs.p_b_rate6.value) || 0) / 100;
  const r7 = (parseFloat(inputs.p_b_rate7.value) || 0) / 100;

  const a1 = deduction * r1;
  const a2 = deduction * r2;
  const a3 = deduction * r3;
  const a4 = deduction * r4;
  const a5 = deduction * r5;
  const a6 = deduction * r6;
  const a7 = deduction * r7;

  calc.b_amt1.innerText = formatNumberTable(a1);
  calc.b_amt2.innerText = formatNumberTable(a2);
  calc.b_amt3.innerText = formatNumberTable(a3);
  calc.b_amt4.innerText = formatNumberTable(a4);
  calc.b_amt5.innerText = formatNumberTable(a5);
  calc.b_amt6.innerText = formatNumberTable(a6);
  calc.b_amt7.innerText = formatNumberTable(a7);

  const totalHH = a1 + a2 + a3 + a4 + a5 + a6 + a7;
  calc.b_totalHH.innerText = formatNumberTable(totalHH);

  let resellRate = 0;
  let resellAmt = 0; // Gross amount
  let platformFee = 0;
  let resellActual = 0; // Net amount
  
  const platformFeeContainer = document.getElementById("b_platformFeeContainer");
  const platformFeeLabel = document.getElementById("b_platformFeeLabel");
  const platformFeeAmt = document.getElementById("b_platformFeeAmt");
  const resellActualContainer = document.getElementById("b_resellActualContainer");
  const resellActualAmt = document.getElementById("b_resellActualAmt");
  
  if (isTake) {
      resellRate = 0;
      resellAmt = 0;
      platformFee = 0;
      resellActual = 0;
      if (platformFeeLabel) platformFeeLabel.innerText = "Phí sàn (0%)";
  } else if (isResellPlatform) {
      const now = new Date();
      let activeFeeRate = 5;
      if (inputs.p_platformFeeStartDate && inputs.p_platformFeeStartDate.value) {
          const startDate = new Date(inputs.p_platformFeeStartDate.value);
          const oldRate = inputs.p_platformFeeOldRate ? parseFloat(inputs.p_platformFeeOldRate.value) : 0.5;
          const newRate = inputs.p_platformFeeRate ? parseFloat(inputs.p_platformFeeRate.value) : 5;
          if (now >= startDate) {
              activeFeeRate = newRate;
          } else {
              activeFeeRate = oldRate;
          }
      } else {
          activeFeeRate = inputs.p_platformFeeRate ? parseFloat(inputs.p_platformFeeRate.value) : 5;
      }
      if (isNaN(activeFeeRate)) activeFeeRate = 5;

      resellRate = 0.8;
      resellAmt = price * resellRate;
      platformFee = resellAmt * (activeFeeRate / 100);
      resellActual = resellAmt - platformFee;
      if (platformFeeLabel) platformFeeLabel.innerText = `Phí sàn (${activeFeeRate}%)`;
      const platformFeeDisplay = document.getElementById("p_platformFeeDisplay");
      if (platformFeeDisplay) platformFeeDisplay.innerText = `(Phí: ${activeFeeRate}%)`;
  } else if (isResellSelf) {
      const selfValStr = inputs.p_self_resell_amount ? inputs.p_self_resell_amount.value.replace(/\./g, "") : "0";
      resellAmt = parseFloat(selfValStr) || 0;
      resellRate = price > 0 ? resellAmt / price : 0;
      platformFee = 0;
      resellActual = resellAmt;
      if (platformFeeLabel) platformFeeLabel.innerText = "Phí sàn (0%)";
  }

  if (platformFeeAmt) platformFeeAmt.innerText = "-" + formatNumberTable(platformFee);
  if (resellActualAmt) resellActualAmt.innerText = formatNumberTable(resellActual);

  calc.b_resellAmt.innerText = formatNumberTable(resellAmt);

  const capitalReturned = groupPrice - unitPrice;
  calc.b_capitalReturned.innerText = formatNumberTable(capitalReturned);

  const instantTotal = totalHH + resellActual;
  calc.b_instantTotal.innerText = formatNumberTable(instantTotal);

  const needToCover = totalInvest - totalHH - resellAmt - capitalReturned;
  calc.b_needToCover.innerText = formatNumberTable(needToCover);

  // Update Dashboard Cards
  calc.d_totalInvest.innerText = formatVND(totalInvest);
  calc.d_resellReturn.innerText = formatVND(resellActual);
  calc.d_totalHH.innerText = formatVND(totalHH);
  calc.d_needToCover.innerText = formatVND(needToCover);

  // Update UI Stats
  calc.s_initialBal.innerText = formatVND(luckyBalance);

  const dailyLixi1 = luckyBalance * dailyLuckyRate;
  calc.s_dailyLixi1.innerText = formatVND(dailyLixi1);

  const netDaily1 = dailyLixi1 - newTickets;

  if (netDaily1 > 0) {
    const daysToCover = Math.ceil(needToCover / netDaily1);
    calc.s_linearDays.innerText = `Khoảng ${daysToCover} ngày`;
    calc.s_linearDays.className = "breakeven-value";
  } else {
    calc.s_linearDays.innerText = "Không thể đạt";
    calc.s_linearDays.className = "breakeven-value";
  }

  const p_calcDaysInput = parseInt(inputs.p_calcDays.value) || 365;
  const calcDays = Math.max(365, Math.min(3650, p_calcDaysInput));

  // Update texts
  const projectionTitle = document.getElementById("projection_table_title");
  if (projectionTitle)
    projectionTitle.innerText = `📅 Lịch Trình Tích Lũy Dòng Tiền (${calcDays} Ngày)`;

  const s_accLixiSub = document.getElementById("s_accLixiSub");
  if (s_accLixiSub) s_accLixiSub.innerText = `Cộng dồn ${calcDays} ngày`;

  const s_netProfitSub = document.getElementById("s_netProfitSub");
  if (s_netProfitSub) s_netProfitSub.innerText = `Sau ${calcDays} ngày`;

  const s_roiSub = document.getElementById("s_roiSub");
  if (s_roiSub) s_roiSub.innerText = `Sau ${calcDays} ngày`;

  let currBalance = luckyBalance;
  let totalCash = 0;
  let htmlContent = "";
  const total_commission_rate = r1 + r2 + r3 + r4 + r5 + r6 + r7;

  let chartLabels = [];
  let chartAccCash = [];
  let chartCapital = [];

  let isBreakEvenAdded = false;
  let currentCalculationBreakEvenDay = null;

  for (let day = 1; day <= calcDays; day++) {
    const genLixi = currBalance * dailyLuckyRate;
    const commGenerated = newTickets * total_commission_rate;
    const cashToday = genLixi - newTickets - commGenerated;

    totalCash += cashToday;
    const endBalance = currBalance - genLixi;

    let status = "";
    let rowClass = "";
    let dataStatus = "";
    const isFirstBreakEven = false;

    if (totalCash >= needToCover) {
      const profit = totalCash - needToCover;
      status = `✅ Đã hòa vốn (Lãi: ${formatNumberTable(profit)})`;
      rowClass = "row-success";
      dataStatus = "hoavon";
    } else {
      status = `⏳ Còn thiếu ${formatNumberTable(needToCover - totalCash)}`;
      dataStatus = "thieu";
    }

    if (!isBreakEvenAdded && totalCash >= needToCover && needToCover > 0) {
      rowClass = "row-breakeven font-bold";
      dataStatus = "diemhoavon";
    }

    const tooltipNgay = `Ngày thứ ${day} của quá trình đầu tư`;
    const tooltipSoDuDau = `Số dư gốc đang dùng để tính lì xì hôm nay`;
    const tooltipLiXiPhatSinh = `Tính từ ${(dailyLuckyRate * 100).toFixed(1)}% của Số dư đầu ngày`;
    const tooltipTienMatTichLuy = `Tiền mặt hôm nay: ${formatNumberTable(cashToday)} VNĐ (Lì xì - Mua vé - Hoa hồng)`;
    const tooltipSoDuCuoi = `${formatNumberTable(currBalance)} - ${formatNumberTable(genLixi)} = ${formatNumberTable(endBalance)} VNĐ`;

    htmlContent += `
            <tr class="${rowClass} projection-row" data-status="${dataStatus}">
                <td title="${tooltipNgay}">${day}</td>
                <td title="${tooltipSoDuDau}">${formatNumberTable(currBalance)}</td>
                <td title="${tooltipLiXiPhatSinh}">${formatNumberTable(genLixi)}</td>
                <td title="${tooltipTienMatTichLuy}">${formatNumberTable(totalCash)}</td>
                <td title="${tooltipSoDuCuoi}">${formatNumberTable(endBalance)}</td>
                <td style="text-align: left;" title="Lãi ròng: ${totalCash >= needToCover ? formatNumberTable(totalCash - needToCover) : 0}">${status}</td>
            </tr>
        `;
    currBalance = endBalance;

    // collect chart data per month (every 30 days) or last day
    if (day % 30 === 0 || day === calcDays) {
      chartLabels.push(`Tháng ${Math.ceil(day / 30)}`);
      chartAccCash.push(totalCash);
      chartCapital.push(needToCover);
    }

    if (!isBreakEvenAdded && totalCash >= needToCover && needToCover > 0) {
      currentCalculationBreakEvenDay = day;
      if (day % 30 !== 0 && day !== calcDays) {
        // Insert break-even into chart data if not already falling exactly on a month's boundary
        chartLabels.push(`Hòa Vốn (T${Math.ceil(day / 30)}, Ngày ${day})`);
        chartAccCash.push(totalCash);
        chartCapital.push(needToCover);
      } else {
        // If it falls exactly on a month boundary, we modify the existing label
        chartLabels[chartLabels.length - 1] =
          `Hòa Vốn (${chartLabels[chartLabels.length - 1]}, Ngày ${day})`;
      }
      isBreakEvenAdded = true;
    }
  }

  calc.timelineBody.innerHTML = htmlContent;

  if (lastCalculatedBreakEvenDay !== null) {
      if (currentCalculationBreakEvenDay !== null && lastCalculatedBreakEvenDay !== currentCalculationBreakEvenDay && lastCalculatedBreakEvenDay !== -1) {
          showToast(`🎉 Cập nhật thay đổi! Lộ trình hòa vốn chuyển sang Ngày ${currentCalculationBreakEvenDay}`, "success");
          const beBanner = document.getElementById("s_linearDays");
          if (beBanner) {
              beBanner.classList.add("flash-effect");
              setTimeout(() => {
                  beBanner.classList.remove("flash-effect");
              }, 1500);
          }
      } else if (currentCalculationBreakEvenDay === null && lastCalculatedBreakEvenDay !== -1) {
          showToast(`⚠️ Với thay đổi hiện tại, hệ thống dự kiến Không Thể Hòa Vốn!`, "error");
      }
  }
  
  if (currentCalculationBreakEvenDay !== null) {
      lastCalculatedBreakEvenDay = currentCalculationBreakEvenDay;
  } else {
      lastCalculatedBreakEvenDay = -1;
  }

  // Reapply filter
  const statusFilterEl = document.getElementById("status_filter");
  if (statusFilterEl) {
    statusFilterEl.dispatchEvent(new Event("change"));
  }

  // Draw Chart
  try {
    if (window.profitChartInstance) {
      window.profitChartInstance.destroy();
    }
    const ctx = document.getElementById("profitChart");
    if (ctx) {
      window.profitChartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels: chartLabels,
          datasets: [
            {
              label: "Tiền mặt tích lũy",
              data: chartAccCash,
              borderColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              fill: true,
              tension: 0.4,
              pointRadius: chartLabels.map((l) =>
                l.includes("Hòa Vốn") ? 6 : 3,
              ),
              pointBackgroundColor: chartLabels.map((l) =>
                l.includes("Hòa Vốn") ? "#8b5cf6" : "#10b981",
              ),
            },
            {
              label: "Vốn ban đầu (Cần bù lì xì)",
              data: chartCapital,
              borderColor: "#ef4444",
              borderDash: [5, 5],
              fill: false,
              pointRadius: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  let label = context.dataset.label || "";
                  if (label) {
                    label += ": ";
                  }
                  if (context.parsed.y !== null) {
                    label +=
                      new Intl.NumberFormat("vi-VN").format(
                        Math.round(context.parsed.y),
                      ) + " VNĐ";
                  }
                  return label;
                },
              },
            },
          },
          scales: {
            y: {
              ticks: {
                callback: function (value, index, ticks) {
                  return new Intl.NumberFormat("vi-VN", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(value);
                },
              },
            },
          },
        },
      });
    }

    if (window.commissionPieChartInstance) {
      window.commissionPieChartInstance.destroy();
    }
    const ctxPie = document.getElementById("commissionPieChart");
    if (ctxPie) {
      const pieData = [a2, a3, a4, a5, a6, a7].map(v => Math.round(v));
      const pieLabels = [
        "HH Trực tiếp",
        "HH Gián tiếp",
        "HH Nhân viên",
        "HH Quản lý",
        "HH Giám đốc",
        "HH Tổng GĐ"
      ];
      // Filter out zero values for cleaner chart
      const filteredData = [];
      const filteredLabels = [];
      const backgroundColors = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#06b6d4"];
      const filteredColors = [];
      
      pieData.forEach((val, idx) => {
        if (val > 0) {
          filteredData.push(val);
          filteredLabels.push(pieLabels[idx]);
          filteredColors.push(backgroundColors[idx]);
        }
      });

      window.commissionPieChartInstance = new Chart(ctxPie, {
        type: "pie",
        data: {
          labels: filteredLabels,
          datasets: [{
            data: filteredData,
            backgroundColor: filteredColors,
            borderWidth: 1,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "right",
              labels: { font: { size: 10 }, boxWidth: 12 }
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  let label = context.label || "";
                  if (label) label += ": ";
                  label += new Intl.NumberFormat("vi-VN").format(context.parsed) + " VNĐ";
                  return label;
                }
              }
            }
          }
        }
      });
    }

  } catch (e) {
    console.error("Lỗi vẽ biểu đồ:", e.message);
  }

  // Post-loop stats
  calc.s_accLixi.innerText = formatVND(totalCash);
  const netProfitCash = totalCash - needToCover;
  
  if (calc.s_netProfit) {
      calc.s_netProfit.innerText = formatVND(netProfitCash);
      if (netProfitCash >= 0) {
          calc.s_netProfit.className = "val text-purple";
      } else {
          calc.s_netProfit.className = "val text-danger";
      }
  }

  const roi = needToCover > 0 ? netProfitCash / needToCover : 0;
  calc.s_roi.innerText = formatPercent(roi);
  if (roi >= 0) {
    calc.s_roi.className = "val text-purple";
  } else {
    calc.s_roi.className = "val text-danger";
  }

  runUcheckCalculations(a2, a3, a4, a5, a6, a7);
};

// UI Logic for User Mode
const updateSubordinateVisibility = () => {
  if (!inputs.u_rank) return;
  const rank = inputs.u_rank.value;
  const gdChk = document.getElementById("u_chk_gd");
  const qlChk = document.getElementById("u_chk_ql");
  const nvChk = document.getElementById("u_chk_nv");

  if (rank === "tgd") {
    if (gdChk) gdChk.style.display = "block";
    if (qlChk) qlChk.style.display = "block";
    if (nvChk) nvChk.style.display = "block";
  } else if (rank === "gd") {
    if (gdChk) gdChk.style.display = "none";
    if (inputs.u_sub_gd) inputs.u_sub_gd.checked = false;
    if (qlChk) qlChk.style.display = "block";
    if (nvChk) nvChk.style.display = "block";
  } else if (rank === "ql") {
    if (gdChk) gdChk.style.display = "none";
    if (inputs.u_sub_gd) inputs.u_sub_gd.checked = false;
    if (qlChk) qlChk.style.display = "none";
    if (inputs.u_sub_ql) inputs.u_sub_ql.checked = false;
    if (nvChk) nvChk.style.display = "block";
  } else {
    if (gdChk) gdChk.style.display = "none";
    if (inputs.u_sub_gd) inputs.u_sub_gd.checked = false;
    if (qlChk) qlChk.style.display = "none";
    if (inputs.u_sub_ql) inputs.u_sub_ql.checked = false;
    if (nvChk) nvChk.style.display = "none";
    if (inputs.u_sub_nv) inputs.u_sub_nv.checked = false;
  }
  calculate();
};

const toggleAdminMode = () => {
  const adminCards = document.querySelectorAll(".admin-only-card");
  const userCards = document.querySelectorAll(".user-only-card");

  adminCards.forEach((c) => (c.style.display = "none"));
  userCards.forEach((c) => (c.style.display = "block"));

  // Toggle Card B inputs vs display spans
  const adminInputs = document.querySelectorAll(".admin-input-only");
  const userDisplays = document.querySelectorAll(".user-display-only");

  adminInputs.forEach((el) => (el.style.display = "none"));
  userDisplays.forEach((el) => (el.style.display = "block"));

  calculate();
};

// Add event listeners to all inputs to trigger recalculation
Object.values(inputs).forEach((input) => {
  if (input && input.tagName) {
    input.addEventListener("input", calculate);
    if (input.type === "checkbox" || input.type === "radio") {
      input.addEventListener("change", calculate);
    }
  }
});

// Specific event listeners
if (inputs.admin_mode_toggle)
  inputs.admin_mode_toggle.addEventListener("change", toggleAdminMode);
if (inputs.u_rank)
  inputs.u_rank.addEventListener("change", updateSubordinateVisibility);

const ucheckKeys = ["tgd", "gd", "ql", "nv", "direct", "indirect"];
ucheckKeys.forEach(key => {
  const selectEl = document.getElementById(`ucheck_select_${key}`);
  if (selectEl) {
    selectEl.addEventListener("change", () => {
      calculate();
    });
  }
});

if (inputs.p_price) {
  inputs.p_price.addEventListener("input", function (e) {
    let val = e.target.value.replace(/\D/g, "");
    if (val !== "") {
      e.target.value = new Intl.NumberFormat("vi-VN").format(parseInt(val, 10));
    } else {
      e.target.value = "";
    }
    calculate();
  });
}

if (inputs.p_calcMonths) {
  inputs.p_calcMonths.addEventListener("input", () => {
    let months = parseInt(inputs.p_calcMonths.value) || 12;
    months = Math.max(12, Math.min(120, months));

    let days = 0;
    if (months % 12 === 0) {
      days = (months / 12) * 365;
    } else {
      days = months * 30;
    }

    if (inputs.p_calcDays) {
      inputs.p_calcDays.value = days;
    }
    calculate();
  });
}

if (inputs.p_calcDays) {
  inputs.p_calcDays.addEventListener("input", () => {
    let days = parseInt(inputs.p_calcDays.value) || 365;
    days = Math.max(365, Math.min(3650, days));
    if (inputs.p_calcMonths) {
      if (days % 365 === 0) {
        inputs.p_calcMonths.value = (days / 365) * 12;
      } else {
        inputs.p_calcMonths.value = Math.round(days / 30);
      }
    }
    calculate();
  });
}

if (inputs.p_self_resell_amount) {
  inputs.p_self_resell_amount.addEventListener("input", function (e) {
    let val = e.target.value.replace(/\D/g, "");
    if (val !== "") {
      e.target.value = new Intl.NumberFormat("vi-VN").format(parseInt(val, 10));
    } else {
      e.target.value = "0";
    }
    calculate();
  });
}

const toggleProjectionTable = document.getElementById(
  "toggle_projection_table",
);
const projectionContent = document.getElementById("projection_content");
const projectionIcon = document.getElementById("projection_table_icon");

if (toggleProjectionTable && projectionContent && projectionIcon) {
  toggleProjectionTable.addEventListener("click", () => {
    if (
      projectionContent.style.display === "none" ||
      projectionContent.style.display === ""
    ) {
      projectionContent.style.display = "block";
      projectionIcon.innerText = "▲";
    } else {
      projectionContent.style.display = "none";
      projectionIcon.innerText = "▼";
    }
  });
}

const toggleChart = document.getElementById("toggle_chart");
const chartContent = document.getElementById("chart_content");
const chartIcon = document.getElementById("chart_icon");

if (toggleChart && chartContent && chartIcon) {
  toggleChart.addEventListener("click", () => {
    if (
      chartContent.style.display === "none" ||
      chartContent.style.display === ""
    ) {
      chartContent.style.display = "block";
      chartIcon.innerText = "▲";
      if (window.profitChartInstance) {
        window.profitChartInstance.resize();
      }
    } else {
      chartContent.style.display = "none";
      chartIcon.innerText = "▼";
    }
  });
}

const statusFilter = document.getElementById("status_filter");
if (statusFilter) {
  statusFilter.addEventListener("change", (e) => {
    const filterVal = e.target.value;
    const rows = document.querySelectorAll(".projection-row");
    rows.forEach((row) => {
      const rowStatus = row.getAttribute("data-status");
      if (filterVal === "all") {
        row.style.display = "";
      } else if (
        filterVal === "hoavon" &&
        (rowStatus === "hoavon" || rowStatus === "diemhoavon")
      ) {
        row.style.display = "";
      } else if (filterVal === rowStatus) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  });
}

const btnExportCsv = document.getElementById("btn_export_csv");
if (btnExportCsv) {
  btnExportCsv.addEventListener("click", () => {
    const rows = document.querySelectorAll(".projection-row");
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent +=
      "Ngày,Số Dư Đầu Ngày,Lì Xì Phát Sinh,Tiền Mặt Tích Lũy,Số Dư Cuối Ngày,Trạng Thái\n";

    rows.forEach((row) => {
      if (row.style.display !== "none") {
        const cols = row.querySelectorAll("td");
        const rowData = Array.from(cols)
          .map((col) => `"${col.innerText}"`)
          .join(",");
        csvContent += rowData + "\n";
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `lich_trinh_dong_tien_${new Date().getTime()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}




// Initial setup
window.addEventListener("load", () => {
  if (inputs.u_rank) updateSubordinateVisibility();
  if (inputs.admin_mode_toggle) toggleAdminMode();
  calculate();
});

// Module switching and dashboard visibility manager
let activeModule = localStorage.getItem("active_module") || "pool";

const updateDashboardVisibility = () => {
  const mainSwitcher = document.getElementById("main_module_switcher");
  const mainDash = document.getElementById("main_dashboard");
  const agriDash = document.getElementById("agri_dashboard");
  const btnPool = document.getElementById("btn_module_pool");
  const btnAgri = document.getElementById("btn_module_agri");
  const pendingModal = document.getElementById("pending_modal");
  const profileModal = document.getElementById("profile_modal");
  const mobileTabs = document.querySelector(".mobile-tabs-container");

  const isUserApproved = auth && auth.currentUser && 
    (!pendingModal || pendingModal.style.display !== "flex") &&
    (!profileModal || profileModal.style.display !== "flex");

  if (isUserApproved) {
    if (mainSwitcher) mainSwitcher.style.display = "flex";

    if (activeModule === "pool") {
      if (mainDash) mainDash.style.display = "";
      if (agriDash) agriDash.style.display = "none";
      if (mobileTabs) mobileTabs.style.display = "";
      const mtabInputs = document.getElementById("mtab_inputs");
      if (mtabInputs && !mtabInputs.classList.contains("active")) {
          mtabInputs.click();
      }
      
      if (btnPool) {
        btnPool.style.background = "#2563eb";
        btnPool.style.color = "white";
        btnPool.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.25)";
      }
      if (btnAgri) {
        btnAgri.style.background = "#f8fafc";
        btnAgri.style.color = "#475569";
        btnAgri.style.boxShadow = "none";
      }
    } else {
      if (mainDash) mainDash.style.display = "none";
      if (agriDash) agriDash.style.display = "flex";
      if (mobileTabs) mobileTabs.style.display = "";
      const mtabInputs = document.getElementById("mtab_inputs");
      if (mtabInputs && !mtabInputs.classList.contains("active")) {
          mtabInputs.click();
      }
      
      if (btnPool) {
        btnPool.style.background = "#f8fafc";
        btnPool.style.color = "#475569";
        btnPool.style.boxShadow = "none";
      }
      if (btnAgri) {
        btnAgri.style.background = "#2563eb";
        btnAgri.style.color = "white";
        btnAgri.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.25)";
      }
      if (typeof window.renderAgriDashboard === "function") {
        window.renderAgriDashboard();
      }
    }
  } else {
    if (mainSwitcher) mainSwitcher.style.display = "none";
    if (mainDash) mainDash.style.display = "none";
    if (agriDash) agriDash.style.display = "none";
    if (mobileTabs) mobileTabs.style.display = "none";
  }
};

window.updateDashboardVisibility = updateDashboardVisibility;

const initModuleSwitcher = () => {
  const btnPool = document.getElementById("btn_module_pool");
  const btnAgri = document.getElementById("btn_module_agri");

  if (btnPool) {
    btnPool.addEventListener("click", () => {
      activeModule = "pool";
      localStorage.setItem("active_module", "pool");
      updateDashboardVisibility();
    });
  }

  if (btnAgri) {
    btnAgri.addEventListener("click", () => {
      activeModule = "agri";
      localStorage.setItem("active_module", "agri");
      updateDashboardVisibility();
    });
  }

  updateDashboardVisibility();
};

// =========================================================================
// MODULE 2: NÔNG SẢN VIỆT NAM (AGRICULTURAL PRODUCT PROGRAM)
// =========================================================================

// Initialize global state for Nông Sản module
window.agriState = {
  selectedProductId: "custom",
  customProduct: {
    name: "Đường mạch nha",
    marketPrice: 100000,
    promoPrice: 90000,
    bulkBuy: 10,
    bulkGift: 1
  },
  qty: 10,
  option: "2",
  resaleUnitPrice: 250000,
  resaleFeePercent: 5,
  resaleSellGift: true,
  rank: "nv",
  personalSales: 0,
  f1Sales: 0,
  otherGroupSales: 0,
  f1Network: [] // array of { name: string, sales: number } (kept for schema compatibility)
};

const agriState = window.agriState;

window.hasAgriFirstLoadPinned = false;
window.agriProducts = [];
// Alias to maintain code compatibility
const agriProducts = window.agriProducts;

// Synchronize state with Firebase Firestore
window.saveAgriStateToFirebase = async () => {
  if (typeof auth !== 'undefined' && auth.currentUser) {
    const agriRef = doc(db, "agri_states", auth.currentUser.uid);
    try {
      await setDoc(agriRef, {
        selectedProductId: agriState.selectedProductId,
        customProduct: agriState.customProduct,
        qty: agriState.qty,
        option: agriState.option,
        resaleUnitPrice: agriState.resaleUnitPrice,
        resaleFeePercent: agriState.resaleFeePercent,
        resaleSellGift: agriState.resaleSellGift,
        rank: agriState.rank,
        personalSales: agriState.personalSales,
        f1Sales: agriState.f1Sales || 0,
        otherGroupSales: agriState.otherGroupSales || 0,
        f1Network: agriState.f1Network || []
      }, { merge: true });
    } catch (err) {
      console.error("Error saving Nông Sản state:", err);
    }
  }
};

const updateAgriSubordinateVisibility = () => {
  const selectRank = document.getElementById("calc_agri_rank");
  if (!selectRank) return;
  const rank = selectRank.value;
  const gdChk = document.getElementById("calc_agri_chk_gd");
  const qlChk = document.getElementById("calc_agri_chk_ql");
  const nvChk = document.getElementById("calc_agri_chk_nv");

  const subGd = document.getElementById("calc_agri_sub_gd");
  const subQl = document.getElementById("calc_agri_sub_ql");
  const subNv = document.getElementById("calc_agri_sub_nv");

  if (rank === "tgd") {
    if (gdChk) gdChk.style.display = "flex";
    if (qlChk) qlChk.style.display = "flex";
    if (nvChk) nvChk.style.display = "flex";
  } else if (rank === "gd") {
    if (gdChk) gdChk.style.display = "none";
    if (subGd) subGd.checked = false;
    if (qlChk) qlChk.style.display = "flex";
    if (nvChk) nvChk.style.display = "flex";
  } else if (rank === "ql") {
    if (gdChk) gdChk.style.display = "none";
    if (subGd) subGd.checked = false;
    if (qlChk) qlChk.style.display = "none";
    if (subQl) subQl.checked = false;
    if (nvChk) nvChk.style.display = "flex";
  } else {
    if (gdChk) gdChk.style.display = "none";
    if (subGd) subGd.checked = false;
    if (qlChk) qlChk.style.display = "none";
    if (subQl) subQl.checked = false;
    if (nvChk) nvChk.style.display = "none";
    if (subNv) subNv.checked = false;
  }
};

window.renderAgriDashboard = () => {
  const selectProduct = document.getElementById("calc_agri_product");
  const inputMarketPrice = document.getElementById("calc_agri_market_price");
  const inputPromoPrice = document.getElementById("calc_agri_promo_price");
  const inputBulkBuy = document.getElementById("calc_agri_bulk_buy");
  const inputBulkGift = document.getElementById("calc_agri_bulk_gift");
  const inputQty = document.getElementById("calc_agri_qty");
  const selectOption = document.getElementById("calc_agri_option");
  const inputResaleUnitPrice = document.getElementById("calc_resale_unit_price");
  const inputResaleFeePercent = document.getElementById("calc_resale_fee_percent");
  const checkResaleSellGift = document.getElementById("calc_resale_sell_gift");
  
  const selectRank = document.getElementById("calc_agri_rank");
  
  // Elements for product outputs
  const outMarketTotal = document.getElementById("out_market_total");
  const outPromoTotal = document.getElementById("out_promo_total");
  const outPayLixi = document.getElementById("out_pay_lixi");
  const outPayCash = document.getElementById("out_pay_cash");
  const outQtyReal = document.getElementById("out_qty_real");
  const outQtyBonus = document.getElementById("out_qty_bonus");
  const outQtyTotal = document.getElementById("out_qty_total");
  const outEffectiveUnitCost = document.getElementById("out_effective_unit_cost");
  const outPointsEarned = document.getElementById("out_points_earned");

  // Elements for resale outputs
  const outResaleRevenue = document.getElementById("out_resale_revenue");
  const outResaleFee = document.getElementById("out_resale_fee");
  const outResaleNetReceived = document.getElementById("out_resale_net_received");
  const outResaleNetProfitCash = document.getElementById("out_resale_net_profit_cash");
  const outResaleNetProfitTotal = document.getElementById("out_resale_net_profit_total");
  const outResaleRoi = document.getElementById("out_resale_roi");

  // Elements for Overview cards
  const overviewCashSpent = document.getElementById("agri_overview_cash_spent");
  const overviewMarketValue = document.getElementById("agri_overview_market_value");
  const overviewCommission = document.getElementById("agri_overview_commission");
  const overviewNetProfit = document.getElementById("agri_overview_net_profit");

  if (!selectProduct) return;

  const prodId = agriState.selectedProductId;
  if (selectProduct.value !== prodId) {
    selectProduct.value = prodId;
  }

  const p = agriProducts.find(x => x.id === prodId);
  const isCustom = prodId === "custom";

  // Tự động gán giá bán lại kỳ vọng bằng giá thị trường
  const marketVal = (!isCustom && p) ? p.marketPrice : agriState.customProduct.marketPrice;
  agriState.resaleUnitPrice = marketVal;

  // Enable/disable inputs based on isCustom
  if (isCustom) {
    if (inputMarketPrice) {
      inputMarketPrice.removeAttribute("readonly");
      inputMarketPrice.style.background = "white";
    }
    if (inputPromoPrice) {
      inputPromoPrice.removeAttribute("readonly");
      inputPromoPrice.style.background = "white";
    }
  } else {
    if (inputMarketPrice) {
      inputMarketPrice.setAttribute("readonly", "true");
      inputMarketPrice.style.background = "#f8fafc";
    }
    if (inputPromoPrice) {
      inputPromoPrice.setAttribute("readonly", "true");
      inputPromoPrice.style.background = "#f8fafc";
    }
  }

  // Populate inputs based on current product (or custom)
  if (!isCustom && p) {
    const formattedMarketPrice = new Intl.NumberFormat("vi-VN").format(p.marketPrice);
    if (inputMarketPrice && inputMarketPrice.value.replace(/\D/g, "") !== String(p.marketPrice)) {
      inputMarketPrice.value = formattedMarketPrice;
    }
    const formattedPromoPrice = new Intl.NumberFormat("vi-VN").format(p.promoPrice);
    if (inputPromoPrice && inputPromoPrice.value.replace(/\D/g, "") !== String(p.promoPrice)) {
      inputPromoPrice.value = formattedPromoPrice;
    }
    if (inputBulkBuy && Number(inputBulkBuy.value) !== p.bulkPromo.buy) inputBulkBuy.value = p.bulkPromo.buy;
    if (inputBulkGift && Number(inputBulkGift.value) !== p.bulkPromo.gift) inputBulkGift.value = p.bulkPromo.gift;
  } else if (isCustom) {
    const formattedMarketPrice = new Intl.NumberFormat("vi-VN").format(agriState.customProduct.marketPrice);
    if (inputMarketPrice && inputMarketPrice.value.replace(/\D/g, "") !== String(agriState.customProduct.marketPrice)) {
      inputMarketPrice.value = formattedMarketPrice;
    }
    const formattedPromoPrice = new Intl.NumberFormat("vi-VN").format(agriState.customProduct.promoPrice);
    if (inputPromoPrice && inputPromoPrice.value.replace(/\D/g, "") !== String(agriState.customProduct.promoPrice)) {
      inputPromoPrice.value = formattedPromoPrice;
    }
    if (inputBulkBuy && Number(inputBulkBuy.value) !== agriState.customProduct.bulkBuy) inputBulkBuy.value = agriState.customProduct.bulkBuy;
    if (inputBulkGift && Number(inputBulkGift.value) !== agriState.customProduct.bulkGift) inputBulkGift.value = agriState.customProduct.bulkGift;
  }

  // Sync general state properties to input fields
  if (inputQty && Number(inputQty.value) !== agriState.qty) inputQty.value = agriState.qty;
  if (selectOption && selectOption.value !== agriState.option) selectOption.value = agriState.option;
  if (selectRank && selectRank.value !== agriState.rank) selectRank.value = agriState.rank;

  const resaleInputsGroup = document.getElementById("calc_resale_inputs_group");
  const resaleResultsGroup = document.getElementById("out_resale_results_group");
  const isOption2 = agriState.option === "2";

  if (isOption2) {
    if (resaleInputsGroup) resaleInputsGroup.style.display = "flex";
    if (resaleResultsGroup) resaleResultsGroup.style.display = "flex";
    
    const formattedResalePrice = new Intl.NumberFormat("vi-VN").format(agriState.resaleUnitPrice);
    if (inputResaleUnitPrice && inputResaleUnitPrice.value.replace(/\D/g, "") !== String(agriState.resaleUnitPrice)) {
      inputResaleUnitPrice.value = formattedResalePrice;
    }
    if (inputResaleUnitPrice) {
      inputResaleUnitPrice.setAttribute("readonly", "true");
      inputResaleUnitPrice.style.background = "#f8fafc";
    }
    if (inputResaleFeePercent && Number(inputResaleFeePercent.value) !== agriState.resaleFeePercent) {
      inputResaleFeePercent.value = agriState.resaleFeePercent;
    }
    if (checkResaleSellGift && checkResaleSellGift.checked !== agriState.resaleSellGift) {
      checkResaleSellGift.checked = agriState.resaleSellGift;
    }
  } else {
    if (resaleInputsGroup) resaleInputsGroup.style.display = "none";
    if (resaleResultsGroup) resaleResultsGroup.style.display = "none";
  }

  const marketPrice = isCustom ? agriState.customProduct.marketPrice : (p ? p.marketPrice : 0);
  const promoPrice = isCustom ? agriState.customProduct.promoPrice : (p ? p.promoPrice : 0);
  const bulkBuy = isCustom ? agriState.customProduct.bulkBuy : (p ? p.bulkPromo.buy : 10);
  const bulkGift = isCustom ? agriState.customProduct.bulkGift : (p ? p.bulkPromo.gift : 1);
  const qty = agriState.qty;

  const totalMarketVal = marketPrice * qty;
  const totalPromoVal = promoPrice * qty;
  
  const payLixiVal = totalPromoVal * 0.03;
  const payCashVal = totalPromoVal * 0.97;
  const pointsEarned = totalPromoVal * 0.01;

  const bonusGifts = 0; // Hủy bỏ chức năng thưởng tặng thêm/mua sỉ đối với nông sản
  const totalQtyReceived = qty + bonusGifts;
  const effectiveUnitCost = totalQtyReceived > 0 ? (payCashVal / totalQtyReceived) : 0;

  if (outMarketTotal) outMarketTotal.innerText = formatVND(totalMarketVal);
  if (outPromoTotal) outPromoTotal.innerText = formatVND(totalPromoVal);
  if (outPayLixi) outPayLixi.innerText = `${new Intl.NumberFormat("vi-VN").format(payLixiVal)} Lì xì (3%)`;
  if (outPayCash) outPayCash.innerText = `${formatVND(payCashVal)} (97%)`;
  if (outQtyReal) outQtyReal.innerText = `${qty}`;
  if (outQtyBonus) outQtyBonus.innerText = `+${bonusGifts} (thưởng sỉ)`;
  if (outQtyTotal) outQtyTotal.innerText = `${totalQtyReceived}`;
  if (outEffectiveUnitCost) outEffectiveUnitCost.innerText = `${formatVND(effectiveUnitCost)} / sản phẩm`;
  if (outPointsEarned) outPointsEarned.innerText = `+${new Intl.NumberFormat("vi-VN").format(pointsEarned)} điểm`;

  let goodsVal = totalMarketVal;
  let netGoodsProfit = totalMarketVal - payCashVal;

  if (isOption2) {
    const resalePrice = agriState.resaleUnitPrice;
    const feePercent = 0; // Nông sản không có phí giao dịch
    const sellGift = false; // Huỷ bỏ chức năng bán cả số lượng sỉ thưởng tặng thêm

    const unitsToSell = qty; // Chỉ bán số lượng gốc, không bao gồm số lượng sỉ thưởng tặng thêm
    const grossRevenue = resalePrice * unitsToSell;
    const feeVal = 0;
    const netCashReceived = grossRevenue;

    const cashProfit = netCashReceived - payCashVal;
    const totalProfit = cashProfit + pointsEarned - payLixiVal;
    const roiPercent = payCashVal > 0 ? (cashProfit / payCashVal) * 100 : 0;

    goodsVal = netCashReceived;
    netGoodsProfit = cashProfit;

    if (outResaleRevenue) outResaleRevenue.innerText = formatVND(grossRevenue);
    if (outResaleFee) outResaleFee.innerText = `0 đ (0%)`;
    if (outResaleNetReceived) outResaleNetReceived.innerText = formatVND(netCashReceived);
    
    if (outResaleNetProfitCash) {
      outResaleNetProfitCash.innerText = formatVND(cashProfit);
      outResaleNetProfitCash.style.color = cashProfit >= 0 ? "#047857" : "#b91c1c";
    }
    if (outResaleNetProfitTotal) {
      outResaleNetProfitTotal.innerText = `${formatVND(totalProfit)} (Điểm: +${new Intl.NumberFormat("vi-VN").format(pointsEarned)}đ, Lì xì: -${new Intl.NumberFormat("vi-VN").format(payLixiVal)}đ)`;
      outResaleNetProfitTotal.style.color = totalProfit >= 0 ? "#059669" : "#b91c1c";
    }
    if (outResaleRoi) {
      outResaleRoi.innerText = `${roiPercent.toFixed(2)}%`;
      outResaleRoi.style.color = roiPercent >= 0 ? "#10b981" : "#ef4444";
    }
  }

  // Reworked commission calculation for Nông sản
  const rank = agriState.rank;
  const agri_max_nv = parseFloat(document.getElementById("a_agri_max_nv")?.value) || 0;
  const agri_max_ql = parseFloat(document.getElementById("a_agri_max_ql")?.value) || 0;
  const agri_max_gd = parseFloat(document.getElementById("a_agri_max_gd")?.value) || 0;
  const agri_max_tgd = parseFloat(document.getElementById("a_agri_max_tgd")?.value) || 0;
  const max_direct = parseFloat(document.getElementById("a_agri_max_direct")?.value) || 0;
  const max_indirect = parseFloat(document.getElementById("a_agri_max_indirect")?.value) || 0;

  const role_name_nv = document.getElementById("role_name_nv")?.value || "Nhân viên";
  const role_name_ql = document.getElementById("role_name_ql")?.value || "Quản lý";
  const role_name_gd = document.getElementById("role_name_gd")?.value || "Giám đốc";
  const role_name_tgd = document.getElementById("role_name_tgd")?.value || "Tổng Giám đốc";

  // Base calculation amount (Calculated directly on promotional price)
  const baseAmount = totalPromoVal;

  // Determine active rank index to know which levels to include:
  // nv: NV
  // ql: NV, QL
  // gd: NV, QL, GD
  // tgd: NV, QL, GD, TGD
  let rankTarget = 0; // 0 = none, 4 = nv, 5 = ql, 6 = gd, 7 = tgd
  if (rank === "nv") rankTarget = 4;
  else if (rank === "ql") rankTarget = 5;
  else if (rank === "gd") rankTarget = 6;
  else if (rank === "tgd") rankTarget = 7;

  let commissionLines = [];
  let itemIndex = 1;

  // 1. Direct commission
  const directCommissionVal = baseAmount * (max_direct / 100);
  if (max_direct > 0) {
    commissionLines.push({
      label: `${itemIndex++}. Hoa hồng trực tiếp (F0) (${max_direct}%):`,
      val: directCommissionVal
    });
  }

  // 2. Indirect commission
  const indirectCommissionVal = baseAmount * (max_indirect / 100);
  if (max_indirect > 0) {
    commissionLines.push({
      label: `${itemIndex++}. Hoa hồng gián tiếp (F1) (${max_indirect}%):`,
      val: indirectCommissionVal
    });
  }

  // 3. NV rank-based commission
  if (rankTarget >= 4) {
    const nv_rate = agri_max_nv;
    if (nv_rate > 0) {
      commissionLines.push({
        label: `${itemIndex++}. HH ${role_name_nv} (${nv_rate}%):`,
        val: baseAmount * (nv_rate / 100)
      });
    }
  }

  // 4. QL rank-based commission
  if (rankTarget >= 5) {
    const ql_rate = Math.max(0, agri_max_ql - agri_max_nv);
    if (ql_rate > 0) {
      commissionLines.push({
        label: `${itemIndex++}. HH ${role_name_ql} (${ql_rate}%):`,
        val: baseAmount * (ql_rate / 100)
      });
    }
  }

  // 5. GD rank-based commission
  if (rankTarget >= 6) {
    const gd_rate = Math.max(0, agri_max_gd - agri_max_ql);
    if (gd_rate > 0) {
      commissionLines.push({
        label: `${itemIndex++}. HH ${role_name_gd} (${gd_rate}%):`,
        val: baseAmount * (gd_rate / 100)
      });
    }
  }

  // 6. TGD rank-based commission
  if (rankTarget >= 7) {
    const tgd_rate = Math.max(0, agri_max_tgd - agri_max_gd);
    if (tgd_rate > 0) {
      commissionLines.push({
        label: `${itemIndex++}. HH ${role_name_tgd} (${tgd_rate}%):`,
        val: baseAmount * (tgd_rate / 100)
      });
    }
  }

  // Sum up all active commissions
  const totalAllCommissions = commissionLines.reduce((sum, item) => sum + item.val, 0);

  // Render the list dynamically
  const commissionsListContainer = document.getElementById("out_agri_commissions_list");
  if (commissionsListContainer) {
    if (commissionLines.length === 0) {
      commissionsListContainer.innerHTML = `
        <div style="text-align: center; color: #6b7280; font-style: italic; padding: 10px 0;">
          Không có hoa hồng phát sinh
        </div>
      `;
    } else {
      commissionsListContainer.innerHTML = commissionLines.map((line, idx) => {
        const isLast = idx === commissionLines.length - 1;
        const borderStyle = isLast ? "border-bottom: 1px dashed #ddd6fe; padding-bottom: 8px;" : "";
        return `
          <div style="display: flex; justify-content: space-between; align-items: center; ${borderStyle}">
              <span style="color: #4c1d95; font-weight: 500;">${line.label}</span>
              <span style="font-weight: 700; color: black;">${formatVND(line.val)}</span>
          </div>
        `;
      }).join("");
    }
  }

  const dDirect = document.getElementById("out_agri_direct_commission");
  const dIndirect = document.getElementById("out_agri_indirect_commission");
  const dRankLabel = document.getElementById("out_agri_rank_commission_label");
  const dRankComm = document.getElementById("out_agri_rank_commission");
  const dTotalComm = document.getElementById("out_agri_total_commission");

  if (dDirect) dDirect.innerText = formatVND(directCommissionVal);
  if (dIndirect) dIndirect.innerText = formatVND(indirectCommissionVal);
  if (dRankLabel) dRankLabel.innerText = "Chức danh";
  if (dRankComm) dRankComm.innerText = formatVND(0);
  if (dTotalComm) dTotalComm.innerText = formatVND(totalAllCommissions);

  // Render the Overview cards
  const finalNetProfitVal = netGoodsProfit + totalAllCommissions + pointsEarned - payLixiVal;

  if (overviewCashSpent) overviewCashSpent.innerText = formatVND(payCashVal);
  if (overviewMarketValue) overviewMarketValue.innerText = formatVND(goodsVal);
  if (overviewCommission) overviewCommission.innerText = formatVND(totalAllCommissions);
  if (overviewNetProfit) {
    overviewNetProfit.innerText = formatVND(finalNetProfitVal);
    overviewNetProfit.style.color = finalNetProfitVal >= 0 ? "#16a34a" : "#dc2626";
  }
};

// Initialize event listeners for Agricultural Calculator inputs
const initAgriCalculator = () => {
  const selectProduct = document.getElementById("calc_agri_product");
  const inputMarketPrice = document.getElementById("calc_agri_market_price");
  const inputPromoPrice = document.getElementById("calc_agri_promo_price");
  const inputBulkBuy = document.getElementById("calc_agri_bulk_buy");
  const inputBulkGift = document.getElementById("calc_agri_bulk_gift");
  const inputQty = document.getElementById("calc_agri_qty");
  const selectOption = document.getElementById("calc_agri_option");
  const inputResaleUnitPrice = document.getElementById("calc_resale_unit_price");
  const inputResaleFeePercent = document.getElementById("calc_resale_fee_percent");
  const checkResaleSellGift = document.getElementById("calc_resale_sell_gift");
  const selectRank = document.getElementById("calc_agri_rank");

  const subGd = document.getElementById("calc_agri_sub_gd");
  const subQl = document.getElementById("calc_agri_sub_ql");
  const subNv = document.getElementById("calc_agri_sub_nv");

  if (!selectProduct) return;

  // Handle product selection change
  selectProduct.addEventListener("change", (e) => {
    agriState.selectedProductId = e.target.value;
    const p = agriProducts.find(x => x.id === e.target.value);
    if (p) {
      agriState.resaleUnitPrice = p.marketPrice; // default resale price
    } else if (e.target.value === "custom") {
      agriState.resaleUnitPrice = agriState.customProduct.marketPrice;
    }
    window.renderAgriDashboard();
  });

  // Helper to attach input parsing
  const bindNumericField = (element, callback) => {
    element.addEventListener("input", (e) => {
      let rawVal = e.target.value.replace(/\D/g, "");
      if (rawVal === "") rawVal = "0";
      const numVal = parseInt(rawVal, 10);
      callback(numVal);
      // Format with thousands separator
      e.target.value = new Intl.NumberFormat("vi-VN").format(numVal);
      window.renderAgriDashboard();
    });
  };

  if (inputMarketPrice) {
    bindNumericField(inputMarketPrice, (val) => {
      if (agriState.selectedProductId === "custom") {
        agriState.customProduct.marketPrice = val;
      }
    });
  }

  if (inputPromoPrice) {
    bindNumericField(inputPromoPrice, (val) => {
      if (agriState.selectedProductId === "custom") {
        agriState.customProduct.promoPrice = val;
      }
    });
  }

  if (inputResaleUnitPrice) {
    bindNumericField(inputResaleUnitPrice, (val) => {
      agriState.resaleUnitPrice = val;
    });
  }

  if (subGd) subGd.addEventListener("change", () => window.renderAgriDashboard());
  if (subQl) subQl.addEventListener("change", () => window.renderAgriDashboard());
  if (subNv) subNv.addEventListener("change", () => window.renderAgriDashboard());

  if (inputBulkBuy) {
    inputBulkBuy.addEventListener("input", (e) => {
      const val = Math.max(1, parseInt(e.target.value, 10) || 1);
      if (agriState.selectedProductId === "custom") {
        agriState.customProduct.bulkBuy = val;
      }
      window.renderAgriDashboard();
    });
  }

  if (inputBulkGift) {
    inputBulkGift.addEventListener("input", (e) => {
      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
      if (agriState.selectedProductId === "custom") {
        agriState.customProduct.bulkGift = val;
      }
      window.renderAgriDashboard();
    });
  }

  if (inputQty) {
    inputQty.addEventListener("input", (e) => {
      agriState.qty = Math.max(1, parseInt(e.target.value, 10) || 1);
      window.renderAgriDashboard();
    });
  }

  if (selectOption) {
    selectOption.addEventListener("change", (e) => {
      agriState.option = e.target.value;
      window.renderAgriDashboard();
    });
  }

  if (inputResaleFeePercent) {
    inputResaleFeePercent.addEventListener("input", (e) => {
      agriState.resaleFeePercent = Math.max(0, parseInt(e.target.value, 10) || 0);
      window.renderAgriDashboard();
    });
  }

  if (checkResaleSellGift) {
    checkResaleSellGift.addEventListener("change", (e) => {
      agriState.resaleSellGift = e.target.checked;
      window.renderAgriDashboard();
    });
  }

  if (selectRank) {
    selectRank.addEventListener("change", (e) => {
      agriState.rank = e.target.value;
      window.renderAgriDashboard();
    });
  }
};

// Mount agricultural module calculator
window.addEventListener("load", () => {
  initModuleSwitcher();
  initAgriCalculator();
  
  setTimeout(() => {
    if (typeof window.updateDashboardVisibility === "function") {
      window.updateDashboardVisibility();
    }
  }, 1000);
});
