const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

const pattern = /<main id="admin_dashboard".*?<!-- Content Area -->\s*<div style="flex: 1; overflow-y: auto; padding: 20px; background: #fff;">/s;

const replacement = `<main id="admin_dashboard" style="display:none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #f8fafc; z-index: 9999; flex-direction: column; margin: 0; border-radius: 0; border: none; overflow: hidden; box-sizing: border-box; font-family: 'Inter', sans-serif;">
       <!-- Premium Header -->
       <div style="padding: 16px 28px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.02); z-index: 10;">
           <div style="display: flex; align-items: center; gap: 14px;">
               <div style="width: 38px; height: 38px; background: linear-gradient(135deg, #1e3a8a, #3b82f6); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 6px rgba(59,130,246,0.2);">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
               </div>
               <div>
                   <h3 style="margin: 0; font-size: 1.2rem; color: #0f172a; font-weight: 700; letter-spacing: -0.02em;">Workspace Control</h3>
                   <div style="font-size: 0.85rem; color: #64748b; margin-top: 2px; font-weight: 500;">Hệ Thống Quản Trị Lucky Shop</div>
               </div>
           </div>
           <button id="btn_close_admin" style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 8px 18px; border-radius: 8px; font-size: 0.95rem; cursor: pointer; color: #475569; font-weight: 600; display: flex; align-items: center; gap: 8px; transition: all 0.2s;">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
               Trở về App
           </button>
       </div>
       
       <div style="display: flex; flex: 1; flex-direction: row; height: calc(100% - 73px);">
           <!-- Premium Sidebar Tabs -->
           <div class="admin-sidebar" style="width: 260px; background: #ffffff; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; padding: 24px 16px; gap: 4px; box-shadow: 1px 0 2px rgba(0,0,0,0.01); z-index: 5;">
               <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: #94a3b8; letter-spacing: 0.05em; margin: 0 0 10px 12px;">Hệ Thống</div>
               <button class="admin-tab active" data-target="admin_tab_config" style="border-radius: 8px; margin-bottom: 4px; padding: 12px 16px; font-size: 0.95rem; display: flex; align-items: center; gap: 10px;">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                   Cấu Hình Cốt Lõi
               </button>
               <button class="admin-tab" data-target="admin_tab_users" style="border-radius: 8px; margin-bottom: 4px; padding: 12px 16px; font-size: 0.95rem; display: flex; align-items: center; gap: 10px;">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                   Người Dùng & Quyền
               </button>
               <button class="admin-tab" data-target="admin_tab_roles" style="border-radius: 8px; margin-bottom: 24px; padding: 12px 16px; font-size: 0.95rem; display: flex; align-items: center; gap: 10px;">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                   Quản Lý Chức Danh
               </button>
               
               <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: #94a3b8; letter-spacing: 0.05em; margin: 0 0 10px 12px;">Sản Phẩm & Kho</div>
               <button class="admin-tab" data-target="admin_tab_products" style="border-radius: 8px; margin-bottom: 4px; padding: 12px 16px; font-size: 0.95rem; display: flex; align-items: center; gap: 10px;">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                   SP Gom Nhóm
               </button>
               <button class="admin-tab" data-target="admin_tab_agri_products" style="border-radius: 8px; margin-bottom: 24px; padding: 12px 16px; font-size: 0.95rem; display: flex; align-items: center; gap: 10px;">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>
                   SP Nông Sản
               </button>

               <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: #94a3b8; letter-spacing: 0.05em; margin: 0 0 10px 12px;">Báo Cáo & Logs</div>
               <button class="admin-tab" data-target="admin_tab_history" style="border-radius: 8px; margin-bottom: 4px; padding: 12px 16px; font-size: 0.95rem; display: flex; align-items: center; gap: 10px;">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
                   Lịch Sử Hệ Thống
               </button>
           </div>
           
           <!-- Content Area -->
           <div style="flex: 1; overflow-y: auto; padding: 30px 40px; background: #f8fafc; position: relative;">`;

if(pattern.test(content)) {
    content = content.replace(pattern, replacement);
    fs.writeFileSync('index.html', content);
    console.log('Successfully replaced admin dashboard layout.');
} else {
    console.log('Pattern not found.');
}
