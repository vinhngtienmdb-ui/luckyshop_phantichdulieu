// Utility to format numbers as VND
const formatVND = (num) => {
  return new Intl.NumberFormat("vi-VN").format(Math.round(num)) + " đ";
};

const formatPercent = (num) => {
  return (num * 100).toFixed(1) + "%";
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  getDoc,
  serverTimestamp,
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
  const db = getFirestore(
    app,
    "ai-studio-855a4b8a-5ffb-4334-8296-6a2455e93c44",
  );
  const auth = getAuth(app);

  const btnLogin = document.getElementById("btn_login");
  const btnLogout = document.getElementById("btn_logout");
  const btnAdminPanel = document.getElementById("btn_admin_panel");
  const btnSaveScreenDefaults = document.getElementById("btn_save_screen_defaults");
  const adminModal = document.getElementById("admin_modal");
  const btnCloseAdmin = document.getElementById("btn_close_admin");
  const userMgmtTableBody = document.getElementById("user_mgmt_table_body");
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

  if (mtabInputs && mtabResults && mainDashboard) {
      mtabInputs.addEventListener("click", () => {
          mtabInputs.classList.add("active");
          mtabResults.classList.remove("active");
          mainDashboard.classList.add("mobile-tab-inputs");
          mainDashboard.classList.remove("mobile-tab-results");
      });
      mtabResults.addEventListener("click", () => {
          mtabResults.classList.add("active");
          mtabInputs.classList.remove("active");
          mainDashboard.classList.add("mobile-tab-results");
          mainDashboard.classList.remove("mobile-tab-inputs");
      });
  }

  let currentUserRole = "user";
  let userSnapshotUnsub = null;
  let usersListUnsub = null;

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
        .then(() => showToast("Đã lưu tên chức danh mới!", "success"))
        .catch((err) =>
          showToast("Lỗi lưu chức danh: " + err.message, "error"),
        );
    });
  }

  const userDefaultRankSelect = document.getElementById("user_default_rank");
  if (userDefaultRankSelect) {
    userDefaultRankSelect.addEventListener("change", (e) => {
      if (auth.currentUser) {
        updateDoc(doc(db, "users", auth.currentUser.uid), {
          defaultRank: e.target.value,
        })
          .then(() => showToast("Đã lưu chức danh mặc định!", "success"))
          .catch((err) =>
            showToast("Lỗi lưu chức danh: " + err.message, "error"),
          );
      }

      const u_rank = document.getElementById("u_rank");
      if (u_rank) {
        u_rank.value = e.target.value;
        if (typeof updateSubordinateVisibility === "function")
          updateSubordinateVisibility();
        if (typeof calculate === "function") calculate();
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
  });

  const loadUsersList = () => {
    if (!auth.currentUser || currentUserRole !== "admin") return;
    if (usersListUnsub) usersListUnsub();

    usersListUnsub = onSnapshot(collection(db, "users"), (snapshot) => {
      if (!userMgmtTableBody) return;
      userMgmtTableBody.innerHTML = "";
      snapshot.forEach((doc) => {
        const data = doc.data();
        const tr = document.createElement("tr");
        const isSuperAdmin =
          data.email === "vinh.ngtienmdb@gmail.com" ||
          data.email === "admin@admin.com";

        let selectHtml = "";
        if (isSuperAdmin) {
          selectHtml = `<span style="color: red; font-weight: bold;">Super Admin</span>`;
        } else {
          const isAdmin = data.role === "admin";
          selectHtml = `
                        <select onchange="updateUserRole('${doc.id}', this.value)" style="padding: 4px; border-radius: 4px; border: 1px solid #ccc;">
                            <option value="user" ${!isAdmin ? "selected" : ""}>Người dùng</option>
                            <option value="admin" ${isAdmin ? "selected" : ""}>Admin</option>
                        </select>
                    `;
        }

        tr.innerHTML = `
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.email}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.displayName || "-"}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${selectHtml}</td>
                `;
        userMgmtTableBody.appendChild(tr);
      });
    });
  };

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

  window.updateUserRole = (userId, newRole) => {
    if (!auth.currentUser || currentUserRole !== "admin") return;
    updateDoc(doc(db, "users", userId), { role: newRole }).catch((err) =>
      showToast("Lỗi cập nhật quyền: " + err.message, "error"),
    );
  };

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
        })
        .catch((error) => {
          loginError.innerText = "Đăng nhập thất bại: " + error.message;
          loginError.style.display = "block";
        });
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", () => signOut(auth));
  }

  onAuthStateChanged(auth, (user) => {
    if (userSnapshotUnsub) {
      userSnapshotUnsub();
      userSnapshotUnsub = null;
    }

    if (user) {
      // Register or update user in Firestore
      const userRef = doc(db, "users", user.uid);
      getDoc(userRef).then((docSnap) => {
        if (!docSnap.exists()) {
          const isSuperAdmin =
            user.email === "vinh.ngtienmdb@gmail.com" ||
            user.email === "admin@admin.com";
          setDoc(userRef, {
            email: user.email,
            displayName: user.displayName || user.email,
            role: isSuperAdmin ? "admin" : "user",
            createdAt: serverTimestamp(),
          });
        }
      });

      userSnapshotUnsub = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          currentUserRole =
            user.email === "vinh.ngtienmdb@gmail.com" ||
            user.email === "admin@admin.com"
              ? "admin"
              : data.role || "user";

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
        
        const btnOpenTracker = document.getElementById("btn_open_tracker");
        const btnQuickCreateProfile = document.getElementById("btn_quick_create_profile");
        if (btnOpenTracker) btnOpenTracker.style.display = "flex";
        if (btnQuickCreateProfile) btnQuickCreateProfile.style.display = "flex";

        const udrContainer = document.getElementById(
          "user_default_rank_container",
        );
        if (udrContainer) udrContainer.style.display = "flex";

        const isSuperAdmin = user.email === "vinh.ngtienmdb@gmail.com" || user.email === "admin@admin.com";

        if (currentUserRole === "admin") {
          if (btnAdminPanel) btnAdminPanel.style.display = isSuperAdmin ? "flex" : "none";
          if (btnSaveScreenDefaults) btnSaveScreenDefaults.style.display = "flex";
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
          if (btnSaveScreenDefaults) btnSaveScreenDefaults.style.display = "none";
          if (userInfoDisplay) {
            userInfoDisplay.style.display = "block";
            userInfoDisplay.innerText = `Xin chào: ${user.displayName || user.email}`;
          }
          if (adminToggle) {
            adminToggle.checked = false;
            if (typeof toggleAdminMode === "function") toggleAdminMode();
          }
        }
      });
    } else {
      currentUserRole = "user";
      if (btnLogin) btnLogin.style.display = "flex";
      if (btnLogout) btnLogout.style.display = "none";
      
      const btnOpenTracker = document.getElementById("btn_open_tracker");
      const btnQuickCreateProfile = document.getElementById("btn_quick_create_profile");
      if (btnOpenTracker) btnOpenTracker.style.display = "none";
      if (btnQuickCreateProfile) btnQuickCreateProfile.style.display = "none";

      if (btnAdminPanel) btnAdminPanel.style.display = "none";
      if (btnSaveScreenDefaults) btnSaveScreenDefaults.style.display = "none";
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
      setVal("a_max_direct", data.a_max_direct);
      setVal("a_max_indirect", data.a_max_indirect);
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
  });

  const btnPreviewPromo = document.getElementById("btn_preview_promo");
  if (btnPreviewPromo) {
      btnPreviewPromo.addEventListener("click", () => {
          window.isPromoPreviewActive = true;
          calculate(); // Triggers config application and shows UI
          document.getElementById('admin_modal').style.display = 'none'; // Close admin config temporarily
      });
  }

  if (btnSaveScreenDefaults) {
    btnSaveScreenDefaults.addEventListener("click", () => {
      if (!auth.currentUser || currentUserRole !== "admin") return;
      
      let pChoice = "take";
      if (document.getElementById("p_choice_resell_platform") && document.getElementById("p_choice_resell_platform").checked) pChoice = "resell_platform";
      if (document.getElementById("p_choice_resell_self") && document.getElementById("p_choice_resell_self").checked) pChoice = "resell_self";
      
      const newConfig = {
        ui_p_price: document.getElementById("p_price") ? document.getElementById("p_price").value : "",
        ui_p_turns: document.getElementById("p_turns") ? (document.getElementById("p_turns").value || document.getElementById("p_turns").innerText) : "",
        ui_p_calcMonths: document.getElementById("p_calcMonths") ? document.getElementById("p_calcMonths").value : "",
        ui_p_calcDays: document.getElementById("p_calcDays") ? document.getElementById("p_calcDays").value : "",
        ui_p_choice: pChoice,
        ui_p_self_resell_amount: document.getElementById("p_self_resell_amount") ? document.getElementById("p_self_resell_amount").value : ""
      };

      setDoc(doc(db, "configs", "main"), newConfig, { merge: true })
        .then(() => showToast("Đã lưu các số liệu trên màn hình thành mặc định hệ thống thành công!", "success"))
        .catch((err) => showToast("Lỗi khi lưu: " + err.message, "error"));
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
        a_max_direct: getVal("a_max_direct"),
        a_max_indirect: getVal("a_max_indirect"),
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
        p_promoStartDate: document.getElementById("p_promoStartDate").value,
        p_promoEndDate: document.getElementById("p_promoEndDate").value,
      };

      setDoc(doc(db, "configs", "main"), newConfig, { merge: true })
        .then(() =>
          showToast(
            "Lưu cấu hình thành công! Mọi người dùng trên hệ thống sẽ tự động thấy hệ số mới.",
            "success",
          ),
        )
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
  s_roi: document.getElementById("s_roi"),

  timelineBody: document.getElementById("timelineBody"),
};

const formatNumberTable = (num) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(num));

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
      resellRate = 0.8;
      resellAmt = price * resellRate;
      platformFee = resellAmt * 0.005;
      resellActual = resellAmt - platformFee;
      if (platformFeeLabel) platformFeeLabel.innerText = "Phí sàn (0.5%)";
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
  } catch (e) {
    console.error("Lỗi vẽ biểu đồ:", e.message);
  }

  // Post-loop stats
  calc.s_accLixi.innerText = formatVND(totalCash);
  const roi = needToCover > 0 ? (totalCash - needToCover) / needToCover : 0;
  calc.s_roi.innerText = formatPercent(roi);
  if (roi >= 0) {
    calc.s_roi.className = "val text-purple";
  } else {
    calc.s_roi.className = "val text-danger";
  }
};

// UI Logic for User Mode
const updateSubordinateVisibility = () => {
  if (!inputs.u_rank) return;
  const rank = inputs.u_rank.value;
  const gdChk = document.getElementById("u_chk_gd");
  const qlChk = document.getElementById("u_chk_ql");
  const nvChk = document.getElementById("u_chk_nv");

  if (rank === "tgd") {
    gdChk.style.display = "block";
    qlChk.style.display = "block";
    nvChk.style.display = "block";
  } else if (rank === "gd") {
    gdChk.style.display = "none";
    inputs.u_sub_gd.checked = false;
    qlChk.style.display = "block";
    nvChk.style.display = "block";
  } else if (rank === "ql") {
    gdChk.style.display = "none";
    inputs.u_sub_gd.checked = false;
    qlChk.style.display = "none";
    inputs.u_sub_ql.checked = false;
    nvChk.style.display = "block";
  } else {
    gdChk.style.display = "none";
    inputs.u_sub_gd.checked = false;
    qlChk.style.display = "none";
    inputs.u_sub_ql.checked = false;
    nvChk.style.display = "none";
    inputs.u_sub_nv.checked = false;
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

const btnRefreshData = document.getElementById("btn_refresh_data");
if (btnRefreshData) {
  btnRefreshData.addEventListener("click", async () => {
    const refreshIcon = document.getElementById("refresh_icon");
    // Start animation
    if (refreshIcon) {
      refreshIcon.style.display = "inline-block";
      refreshIcon.style.animation = "spin 1s linear infinite";
    }

    try {
      // Re-fetch configs
      const rolesSnap = await getDoc(doc(db, "configs", "roles"));
      if (rolesSnap.exists()) {
        const data = rolesSnap.data();
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

      const mainSnap = await getDoc(doc(db, "configs", "main"));
      if (mainSnap.exists()) {
        const data = mainSnap.data();
        const setVal = (id, val) => {
          if (val !== undefined && document.getElementById(id))
            document.getElementById(id).value = val;
        };
        setVal("a_max_tgd", data.a_max_tgd);
        setVal("a_max_gd", data.a_max_gd);
        setVal("a_max_ql", data.a_max_ql);
        setVal("a_max_nv", data.a_max_nv);
        setVal("a_max_direct", data.a_max_direct);
      }

      // Trigger calculate
      calculate();
      showToast("Đã làm mới dữ liệu từ máy chủ", "success");
    } catch (error) {
      console.error(error);
      showToast("Lỗi làm mới dữ liệu", "error");
    } finally {
      // Stop animation
      if (refreshIcon) {
        refreshIcon.style.animation = "none";
      }
    }
  });
}

const showPrompt = (message, defaultValue = "") => {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        Object.assign(overlay.style, {
            position: "fixed", top: "0", left: "0", width: "100%", height: "100%",
            background: "rgba(0,0,0,0.5)", zIndex: "9999", display: "flex", 
            alignItems: "center", justifyContent: "center"
        });
        const box = document.createElement("div");
        Object.assign(box.style, {
            background: "white", padding: "20px", borderRadius: "8px", 
            width: "300px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        });
        const title = document.createElement("div");
        title.innerText = message;
        title.style.marginBottom = "10px";
        title.style.fontWeight = "bold";
        const input = document.createElement("input");
        input.type = "text";
        input.value = defaultValue;
        Object.assign(input.style, {
            width: "100%", padding: "8px", border: "1px solid #ccc", 
            borderRadius: "4px", marginBottom: "15px"
        });
        const btnGroup = document.createElement("div");
        btnGroup.style.display = "flex";
        btnGroup.style.justifyContent = "flex-end";
        btnGroup.style.gap = "10px";
        const btnOk = document.createElement("button");
        btnOk.innerText = "OK";
        Object.assign(btnOk.style, {
            background: "#3b82f6", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer"
        });
        const btnCancel = document.createElement("button");
        btnCancel.innerText = "Hủy";
        Object.assign(btnCancel.style, {
            background: "#e2e8f0", color: "#333", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer"
        });
        
        const close = (val) => { document.body.removeChild(overlay); resolve(val); };
        btnOk.onclick = () => close(input.value);
        btnCancel.onclick = () => close(null);
        
        btnGroup.appendChild(btnCancel);
        btnGroup.appendChild(btnOk);
        box.appendChild(title);
        box.appendChild(input);
        box.appendChild(btnGroup);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        input.focus();
    });
};

const showConfirm = (message) => {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        Object.assign(overlay.style, {
            position: "fixed", top: "0", left: "0", width: "100%", height: "100%",
            background: "rgba(0,0,0,0.5)", zIndex: "9999", display: "flex", 
            alignItems: "center", justifyContent: "center"
        });
        const box = document.createElement("div");
        Object.assign(box.style, {
            background: "white", padding: "20px", borderRadius: "8px", 
            width: "300px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", textAlign: "center"
        });
        const title = document.createElement("div");
        title.innerText = message;
        title.style.marginBottom = "15px";
        const btnGroup = document.createElement("div");
        btnGroup.style.display = "flex";
        btnGroup.style.justifyContent = "center";
        btnGroup.style.gap = "10px";
        const btnOk = document.createElement("button");
        btnOk.innerText = "Đồng ý";
        Object.assign(btnOk.style, {
            background: "#ef4444", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer"
        });
        const btnCancel = document.createElement("button");
        btnCancel.innerText = "Hủy";
        Object.assign(btnCancel.style, {
            background: "#e2e8f0", color: "#333", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer"
        });
        
        const close = (val) => { document.body.removeChild(overlay); resolve(val); };
        btnOk.onclick = () => close(true);
        btnCancel.onclick = () => close(false);
        
        btnGroup.appendChild(btnCancel);
        btnGroup.appendChild(btnOk);
        box.appendChild(title);
        box.appendChild(btnGroup);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    });
};

// --- TRACKER LOGIC ---
const t_formatVND = (num) => new Intl.NumberFormat("vi-VN").format(Math.round(num)) + " đ";
const t_formatNumber = (num) => new Intl.NumberFormat("vi-VN").format(Math.round(num));

const loadTrackerData = () => {
  let profiles = JSON.parse(localStorage.getItem("lucky_tracker_profiles") || "{}");
  let activeId = localStorage.getItem("lucky_tracker_active_id");
  
  // Migration from old single profile
  const oldProfile = JSON.parse(localStorage.getItem("lucky_tracker") || "null");
  if (oldProfile && Object.keys(profiles).length === 0) {
    const newId = 'profile_' + Date.now();
    oldProfile.name = 'Hồ sơ 1';
    profiles[newId] = oldProfile;
    activeId = newId;
    localStorage.removeItem("lucky_tracker");
    // We defer the save to the caller or do it safely
    try {
        const safeOld = {
           name: String(oldProfile.name || ""),
           startDate: String(oldProfile.startDate || ""),
           luckyBalance: Number(oldProfile.luckyBalance) || 0,
           turns: Number(oldProfile.turns) || 0,
           luckyMul: Number(oldProfile.luckyMul) || 0,
           dailyLuckyRate: Number(oldProfile.dailyLuckyRate) || 0,
           needToCover: Number(oldProfile.needToCover) || 0,
           actualLixi: oldProfile.actualLixi || {}
        };
        profiles[newId] = safeOld;
        localStorage.setItem("lucky_tracker_profiles", JSON.stringify(profiles));
    } catch(e) {}
    localStorage.setItem("lucky_tracker_active_id", activeId);
  }

  if (!activeId && Object.keys(profiles).length > 0) {
    activeId = Object.keys(profiles)[0];
    localStorage.setItem("lucky_tracker_active_id", activeId);
  }
  
  return { profiles, activeId };
};

const saveTrackerData = (profiles, activeId) => {
  // Completely strip out any non-primitive data to ensure no DOM elements 
  // or circular references ever make it into localStorage.
  const safeProfiles = {};
  for (const id in profiles) {
    const p = profiles[id];
    if (!p) continue;

    const safeActual = {};
    if (p.actualLixi) {
        for (const key in p.actualLixi) { 
            safeActual[key] = Number(p.actualLixi[key]) || 0; 
        }
    }
    
    // Explicitly rebuild the object with primitives only
    safeProfiles[id] = {
       name: String(p.name || ""),
       startDate: String(p.startDate || ""),
       luckyBalance: Number(p.luckyBalance) || 0,
       turns: Number(p.turns) || 0,
       luckyMul: Number(p.luckyMul) || 0,
       dailyLuckyRate: Number(p.dailyLuckyRate) || 0,
       needToCover: Number(p.needToCover) || 0,
       actualLixi: safeActual
    };
  }

  try {
    localStorage.setItem("lucky_tracker_profiles", JSON.stringify(safeProfiles));
  } catch (e) {
    console.error(e);
  }

  if (activeId) {
    localStorage.setItem("lucky_tracker_active_id", activeId);
  } else {
    localStorage.removeItem("lucky_tracker_active_id");
  }
};

const renderTracker = (defaultDate = "") => {
  const trackerContent = document.getElementById("tracker_content");
  if (!trackerContent) return;

  const { profiles, activeId } = loadTrackerData();
  const hasProfiles = Object.keys(profiles).length > 0;
  
  // Profile Management Header
  let profileHtml = `
    <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 10px; width: 100%; max-width: 400px;">
          <label style="font-weight: 600; color: #475569;">Hồ sơ:</label>
          <select id="tracker_profile_select" style="flex: 1; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; outline: none;">
            <option value="">-- Chọn hồ sơ --</option>
            ${Object.entries(profiles).map(([id, p]) => `<option value="${id}" ${id === activeId ? 'selected' : ''}>${p.name}</option>`).join('')}
          </select>
        </div>
        <div style="display: flex; gap: 10px;">
          <button id="btn_new_profile" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">+ Tạo mới</button>
          ${hasProfiles ? `
            <button id="btn_rename_profile" style="background: #f59e0b; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">Đổi tên</button>
            <button id="btn_delete_profile" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">Xóa</button>
            <button id="btn_export_profile" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">Xuất CSV</button>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  if (!hasProfiles || !activeId || !profiles[activeId]) {
    trackerContent.innerHTML = profileHtml + `
      <div style="text-align: center; padding: 40px 20px;">
        <h3 style="margin-bottom: 10px; color: #374151;">Chưa có hồ sơ nào được chọn</h3>
        <p style="color: #6b7280; margin-bottom: 20px; line-height: 1.5;">Vui lòng tạo hồ sơ mới dựa trên các thông số cấu hình đang tính toán ở bên ngoài.</p>
      </div>
    `;
    setupProfileListeners();
    return;
  }

  const trackerProfile = profiles[activeId];

  let html = profileHtml + `
        <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: space-between; align-items: center; margin-bottom: 20px; background: #fff; padding: 15px; border-radius: 6px; border: 1px dashed #cbd5e1;">
            <div>
                <strong>Ngày bắt đầu:</strong> ${(() => {
                    const d = new Date(trackerProfile.startDate);
                    return d.getDate().toString().padStart(2, '0') + '/' + 
                           (d.getMonth() + 1).toString().padStart(2, '0') + '/' + 
                           d.getFullYear();
                })()}
            </div>
            <div>
                <strong>Mục tiêu bù:</strong> <span style="color:#ef4444; font-weight:bold; font-size: 1.1rem;">${t_formatVND(trackerProfile.needToCover)}</span>
            </div>
            <div>
                <button id="btn_save_tracker" style="background:#10b981; color:white; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-weight:bold; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4);">💾 Lưu & Tính toán</button>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 5px;">Thực Nhận (Cộng dồn)</div>
                <div id="tk_summary_actual" style="font-size: 1.4rem; font-weight: bold; color: #10b981;">0 đ</div>
            </div>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 5px;">Còn Phải Bù</div>
                <div id="tk_summary_remain" style="font-size: 1.4rem; font-weight: bold; color: #ef4444;">0 đ</div>
            </div>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 5px;">Tiến Độ Hòa Vốn</div>
                <div id="tk_summary_progress" style="font-size: 1.4rem; font-weight: bold; color: #3b82f6;">0%</div>
            </div>
        </div>
        
        <div style="margin-bottom: 20px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px;">
            <canvas id="trackerChartCanvas" style="width: 100%; height: 300px; max-height: 300px;"></canvas>
        </div>
        
        <div class="table-container" style="max-height: 60vh; overflow: auto; border: 1px solid #e5e7eb; border-radius: 6px;">
            <table class="data-table" style="width: 100%; white-space: nowrap; font-size: 0.9rem;">
                <thead>
                    <tr style="position: sticky; top: 0; background: #f8fafc; z-index: 10;">
                        <th>Ngày</th>
                        <th>Số dư đầu ngày</th>
                        <th>Phát sinh (dự kiến)</th>
                        <th>Lì xì thực nhận</th>
                        <th>Lũy kế Tiền mặt</th>
                        <th>Số dư cuối ngày</th>
                        <th>Trạng thái (Lời/ Lỗ)</th>
                    </tr>
                </thead>
                <tbody id="tracker_tbody">
                </tbody>
            </table>
        </div>
    `;

  trackerContent.innerHTML = html;
  
  setupProfileListeners();

  const tbody = document.getElementById("tracker_tbody");

  let currBalance = trackerProfile.luckyBalance;
  let totalCash = 0;

  let maxDay = 365;
  const existingDays = Object.keys(trackerProfile.actualLixi).map(Number);
  const maxInputDay = existingDays.length > 0 ? Math.max(...existingDays) : 0;
  if (existingDays.length > 0) {
    maxDay = Math.max(maxDay, maxInputDay + 10);
  }

  const startObj = new Date(trackerProfile.startDate);

  let trHtml = "";
  
  // For Chart
  let tkLabels = [];
  let tkActualData = [];
  let tkExpectedData = [];
  let tkExpectedCash = 0;
  let tempExpectedBalance = trackerProfile.luckyBalance;

  for (let day = 1; day <= maxDay; day++) {
    const currentDate = new Date(startObj);
    currentDate.setDate(startObj.getDate() + day); // Day 1 = startDate + 1 (tomorrow)
    const dStr = currentDate.getDate().toString().padStart(2, '0');
    const mStr = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const yStr = currentDate.getFullYear();
    const dateStr = `${dStr}/${mStr}/${yStr}`;

    // Input logic
    const expectedLixi = currBalance * trackerProfile.dailyLuckyRate;
    const actualInput = trackerProfile.actualLixi[day];
    const isInputted = actualInput !== undefined && actualInput !== null;
    let genLixi = isInputted ? parseFloat(actualInput) : 0;

    totalCash += genLixi;
    let endBalance = currBalance - genLixi;
    
    // Accumulate Expected
    let thisExpectedLixi = tempExpectedBalance * trackerProfile.dailyLuckyRate;
    tkExpectedCash += thisExpectedLixi;
    tempExpectedBalance -= thisExpectedLixi;
    
    // Chart Data (Stop Actual line at maxInputDay + 1)
    tkLabels.push(`Ngày ${day}`);
    tkExpectedData.push(tkExpectedCash);
    if (day <= Math.max(1, maxInputDay)) { // Show actual up to the max input day
        tkActualData.push(totalCash);
    } else {
        tkActualData.push(null);
    }

    let status = "";
    let rowClass = "";

    if (totalCash >= trackerProfile.needToCover) {
      const profit = totalCash - trackerProfile.needToCover;
      status = `<span style="color:#10b981; font-weight: bold;">✅ Lãi: ${t_formatNumber(profit)}</span>`;
      rowClass = "row-success";
    } else {
      status = `<span style="color:#ef4444; font-weight: 500;">⏳ Cần bù: ${t_formatNumber(trackerProfile.needToCover - totalCash)}</span>`;
    }

    trHtml += `
            <tr class="${rowClass}">
                <td style="text-align:center;">Ngày ${day} <br><small style="color:#888;">${dateStr}</small></td>
                <td style="text-align:right;">${t_formatNumber(currBalance)}</td>
                <td style="text-align:right; color:#888;">${t_formatNumber(expectedLixi)}</td>
                <td style="text-align:center;">
                    <input type="number" class="tracker-input" data-day="${day}" value="${isInputted ? actualInput : 0}" placeholder="0" style="width: 100px; padding: 6px; text-align: right; border: 1px solid ${isInputted ? '#3b82f6' : '#d1d5db'}; border-radius: 4px; font-weight:${isInputted ? "bold" : "normal"}; color:${isInputted ? '#3b82f6' : 'inherit'};">
                </td>
                <td style="text-align:right; color:#0284c7; font-weight: bold;">${t_formatNumber(totalCash)}</td>
                <td style="text-align:right; font-weight: 500;">${t_formatNumber(endBalance)}</td>
                <td>${status}</td>
            </tr>
        `;

    currBalance = endBalance;
  }

  tbody.innerHTML = trHtml;
  
  // Update Summary Cards
  const eSummaryActual = document.getElementById("tk_summary_actual");
  const eSummaryRemain = document.getElementById("tk_summary_remain");
  const eSummaryProgress = document.getElementById("tk_summary_progress");
  if (eSummaryActual) {
      eSummaryActual.innerText = t_formatVND(totalCash);
      let remain = trackerProfile.needToCover - totalCash;
      if (remain < 0) remain = 0;
      eSummaryRemain.innerText = t_formatVND(remain);
      
      let progress = trackerProfile.needToCover > 0 ? (totalCash / trackerProfile.needToCover) * 100 : 100;
      eSummaryProgress.innerText = progress.toFixed(1) + "%";
  }
  
  // Render Chart
  setTimeout(() => {
      const ctxTk = document.getElementById("trackerChartCanvas");
      if (ctxTk) {
          if (window.trackerChartInstance) {
              window.trackerChartInstance.destroy();
          }
          window.trackerChartInstance = new Chart(ctxTk, {
            type: "line",
            data: {
              labels: tkLabels,
              datasets: [
                {
                  label: "Thực nhận (Lũy kế)",
                  data: tkActualData,
                  borderColor: "#10b981",
                  backgroundColor: "rgba(16, 185, 129, 0.2)",
                  pointRadius: 2,
                  fill: true,
                  tension: 0.2,
                  spanGaps: true
                },
                {
                  label: "Dự kiến (Lũy kế)",
                  data: tkExpectedData,
                  borderColor: "#d1d5db",
                  backgroundColor: "transparent",
                  borderDash: [5, 5],
                  pointRadius: 0,
                  fill: false,
                  tension: 0.2
                },
                {
                  label: "Mục tiêu hòa vốn",
                  data: Array(tkLabels.length).fill(trackerProfile.needToCover),
                  borderColor: "#ef4444",
                  borderWidth: 1,
                  pointRadius: 0,
                  fill: false,
                  borderDash: [2, 2]
                }
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: "index", intersect: false },
              plugins: { tooltip: { callbacks: { label: (ctx) => ctx.dataset.label + ": " + t_formatVND(ctx.raw) } } },
              scales: { y: { suggestedMin: 0, ticks: { callback: (val) => t_formatNumber(val) } } }
            }
          });
      }
  }, 50);

  const btnSave = document.getElementById("btn_save_tracker");
  if (btnSave) {
    btnSave.addEventListener("click", () => {
      const { profiles, activeId } = loadTrackerData();
      if (!profiles[activeId]) return;

      const inputsList = document.querySelectorAll(".tracker-input");
      inputsList.forEach((inp) => {
        const day = parseInt(inp.getAttribute("data-day"));
        const val = inp.value;
        if (val !== "") {
          profiles[activeId].actualLixi[day] = parseFloat(val);
        } else {
          profiles[activeId].actualLixi[day] = 0;
        }
      });
      saveTrackerData(profiles, activeId);
      renderTracker();
    });
  }
};

const setupProfileListeners = () => {
    const sel = document.getElementById("tracker_profile_select");
    const btnNew = document.getElementById("btn_new_profile");
    const btnRename = document.getElementById("btn_rename_profile");
    const btnDelete = document.getElementById("btn_delete_profile");

    if (sel) {
        sel.addEventListener("change", (e) => {
            const val = e.target.value;
            if (val) {
                const { profiles } = loadTrackerData();
                saveTrackerData(profiles, val);
                renderTracker();
            } else {
                const { profiles } = loadTrackerData();
                saveTrackerData(profiles, null);
                renderTracker();
            }
        });
    }

    if (btnNew) {
        btnNew.addEventListener("click", async () => {
            try {
                const name = await showPrompt("Nhập tên hồ sơ mới:", "Hồ sơ " + (Object.keys(loadTrackerData().profiles).length + 1));
                if (!name) return;

                let inputDateStr = await showPrompt("Ngày mua (DD/MM/YYYY):", (() => {
                    const d = new Date();
                    return d.getDate().toString().padStart(2, '0') + '/' + 
                           (d.getMonth() + 1).toString().padStart(2, '0') + '/' + 
                           d.getFullYear();
                })());
                if (!inputDateStr) return;

                let startDate = inputDateStr;
                const dParts = inputDateStr.split("/");
                if (dParts.length === 3) {
                   startDate = `${dParts[2]}-${dParts[1]}-${dParts[0]}`;
                }

                // Read directly from DOM to match UI
                const eSInitialBal = document.getElementById("s_initialBal");
                const luckyBalanceStr = eSInitialBal ? eSInitialBal.innerText.replace(/[^\d]/g, "") : "0";
                const luckyBalance = parseFloat(luckyBalanceStr) || 0;
                
                const eBNeedToCover = document.getElementById("b_needToCover");
                const needToCoverStr = eBNeedToCover ? eBNeedToCover.innerText.replace(/[^\d]/g, "") : "0";
                const needToCover = parseFloat(needToCoverStr) || 0;

                const turns = parseFloat(inputs.p_turns.value || inputs.p_turns.innerText) || 20;
                const dailyLuckyRate = (parseFloat(inputs.p_dailyLuckyRate.value) || 0) / 100;
                const luckyMul = parseFloat(inputs.p_luckyMul.value) || 0;

                const newProfile = {
                    name,
                    startDate,
                    luckyBalance,
                    turns,
                    luckyMul,
                    dailyLuckyRate,
                    needToCover,
                    actualLixi: {},
                };

                const { profiles } = loadTrackerData();
                const newId = 'profile_' + Date.now();
                profiles[newId] = newProfile;
                saveTrackerData(profiles, newId);
                renderTracker();
            } catch (e) {
                alert("Lỗi tạo mới: " + e.message);
                console.error(e);
            }
        });
    }

    if (btnRename) {
        btnRename.addEventListener("click", async () => {
            const { profiles, activeId } = loadTrackerData();
            if (!activeId || !profiles[activeId]) return;

            const name = await showPrompt("Nhập tên hồ sơ mới:", profiles[activeId].name);
            if (!name || name === profiles[activeId].name) return;

            profiles[activeId].name = name;
            saveTrackerData(profiles, activeId);
            renderTracker();
        });
    }

    if (btnDelete) {
        btnDelete.addEventListener("click", async () => {
            const isConfirmed = await showConfirm("Chắc chắn xóa hồ sơ này?");
            if (isConfirmed) {
                const { profiles, activeId } = loadTrackerData();
                delete profiles[activeId];
                const keys = Object.keys(profiles);
                const nextId = keys.length > 0 ? keys[0] : null;
                saveTrackerData(profiles, nextId);
                renderTracker();
            }
        });
    }

    const btnExport = document.getElementById("btn_export_profile");
    if (btnExport) {
        btnExport.addEventListener("click", () => {
            const { profiles, activeId } = loadTrackerData();
            if (!activeId || !profiles[activeId]) return;
            const profile = profiles[activeId];
            
            let csvContent = "Ngày,Ngày tháng,Số dư đầu ngày,Lì xì dự kiến,Lì xì thực nhận,Tổng tiền rút,Số dư cuối ngày,Trạng thái\n";
            
            let currBalance = profile.luckyBalance;
            let totalCash = 0;
            let maxDay = 365;
            const existingDays = Object.keys(profile.actualLixi).map(Number);
            if (existingDays.length > 0) {
              maxDay = Math.max(maxDay, Math.max(...existingDays) + 10);
            }
            const startObj = new Date(profile.startDate);
            for (let day = 1; day <= maxDay; day++) {
                const curD = new Date(startObj);
                curD.setDate(startObj.getDate() + day);
                const dateStr = `${curD.getDate().toString().padStart(2, '0')}/${(curD.getMonth()+1).toString().padStart(2, '0')}/${curD.getFullYear()}`;
                
                const expectedLixi = currBalance * profile.dailyLuckyRate;
                const actualInput = profile.actualLixi[day];
                const isInputted = actualInput !== undefined && actualInput !== null;
                let genLixi = isInputted ? parseFloat(actualInput) : 0;
                
                totalCash += genLixi;
                let endBalance = currBalance - genLixi;
                let status = "Đang chạy";
                if (totalCash >= profile.needToCover) {
                  status = "Lãi: " + Math.round(totalCash - profile.needToCover);
                } else {
                  status = "Cần bù: " + Math.round(profile.needToCover - totalCash);
                }
                
                csvContent += `${day},${dateStr},${Math.round(currBalance)},${Math.round(expectedLixi)},${isInputted ? actualInput : 0},${Math.round(totalCash)},${Math.round(endBalance)},${status}\n`;
                currBalance = endBalance;
            }
            
            // Add BOM for Excel UTF-8 support
            const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `${profile.name.replace(/\s+/g, '_')}_data.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
};

const btnOpenTracker = document.getElementById("btn_open_tracker");
const btnQuickCreateProfile = document.getElementById("btn_quick_create_profile");
const trackerModal = document.getElementById("tracker_modal");
const btnCloseTracker = document.getElementById("btn_close_tracker");

if (btnQuickCreateProfile) {
    btnQuickCreateProfile.addEventListener("click", async () => {
      try {
        const name = await showPrompt("Nhập tên hồ sơ mới:", "Hồ sơ " + (Object.keys(loadTrackerData().profiles).length + 1));
        if (!name) return;

        let inputDateStr = await showPrompt("Ngày mua (DD/MM/YYYY):", (() => {
            const d = new Date();
            return d.getDate().toString().padStart(2, '0') + '/' + 
                   (d.getMonth() + 1).toString().padStart(2, '0') + '/' + 
                   d.getFullYear();
        })());
        if (!inputDateStr) return;

        let startDate = inputDateStr;
        const dParts = inputDateStr.split("/");
        if (dParts.length === 3) {
           startDate = `${dParts[2]}-${dParts[1]}-${dParts[0]}`;
        }

        // Read directly from DOM to match UI
        const eSInitialBal = document.getElementById("s_initialBal");
        const luckyBalanceStr = eSInitialBal ? eSInitialBal.innerText.replace(/[^\d]/g, "") : "0";
        const luckyBalance = parseFloat(luckyBalanceStr) || 0;
        
        const eBNeedToCover = document.getElementById("b_needToCover");
        const needToCoverStr = eBNeedToCover ? eBNeedToCover.innerText.replace(/[^\d]/g, "") : "0";
        const needToCover = parseFloat(needToCoverStr) || 0;

        const turns = parseFloat(inputs.p_turns.value || inputs.p_turns.innerText) || 20;
        const dailyLuckyRate = (parseFloat(inputs.p_dailyLuckyRate.value) || 0) / 100;
        const luckyMul = parseFloat(inputs.p_luckyMul.value) || 0;

        const newProfile = {
            name,
            startDate,
            luckyBalance,
            turns,
            luckyMul,
            dailyLuckyRate,
            needToCover,
            actualLixi: {},
        };

        const { profiles } = loadTrackerData();
        const newId = 'profile_' + Date.now();
        profiles[newId] = newProfile;
        saveTrackerData(profiles, newId);
        
        if (trackerModal) trackerModal.style.display = "flex";
        renderTracker();
      } catch (e) {
        alert("Lỗi: " + e.message);
        console.error(e);
      }
    });
}

if (btnOpenTracker) {
  btnOpenTracker.addEventListener("click", () => {
    if (trackerModal) trackerModal.style.display = "flex";
    const now = new Date();
    const localDate = now.toLocaleDateString("en-CA"); // YYYY-MM-DD
    renderTracker(localDate);
  });
}
if (btnCloseTracker) {
  btnCloseTracker.addEventListener("click", () => {
    if (trackerModal) trackerModal.style.display = "none";
  });
}

// Initial setup
window.addEventListener("load", () => {
  if (inputs.u_rank) updateSubordinateVisibility();
  if (inputs.admin_mode_toggle) toggleAdminMode();
  calculate();
});
