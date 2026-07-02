with open('app.js', 'r') as f:
    content = f.read()

old_logic = """  if (btnAdminPanel && adminModal) {
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
  }"""

new_logic = """  if (btnAdminPanel && adminModal) {
    btnAdminPanel.addEventListener("click", () => {
      adminModal.style.display = "flex";
      
      // Hide dashboards
      const mainDashboard = document.getElementById("main_dashboard");
      const agriDashboard = document.getElementById("agri_dashboard");
      const moduleSwitcher = document.getElementById("main_module_switcher");
      const topRow = document.querySelector(".top-row");
      const promoBanner = document.getElementById("promo_banner");
      if (mainDashboard) mainDashboard.style.display = "none";
      if (agriDashboard) agriDashboard.style.display = "none";
      if (moduleSwitcher) moduleSwitcher.style.display = "none";
      if (topRow) topRow.style.display = "none";
      if (promoBanner) promoBanner.style.display = "none";

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
        
        // Show dashboards again
        const moduleSwitcher = document.getElementById("main_module_switcher");
        if (moduleSwitcher) moduleSwitcher.style.display = "flex";
        
        const topRow = document.querySelector(".top-row");
        if (topRow) topRow.style.display = ""; // default grid
        
        const btnAgri = document.getElementById("btn_module_agri");
        const btnPool = document.getElementById("btn_module_pool");
        
        if (btnAgri && (btnAgri.style.background === "rgb(37, 99, 235)" || btnAgri.style.background === "#2563eb")) {
            btnAgri.click();
        } else if (btnPool) {
            btnPool.click();
        }
      });
    }
  }"""

content = content.replace(old_logic, new_logic)
with open('app.js', 'w') as f:
    f.write(content)
