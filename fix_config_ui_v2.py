import re
with open('index.html', 'r') as f:
    content = f.read()

pattern = r'<div class="input-list" style="max-width: 500px;">(.*?)<button id="btn_save_config" .*?Lưu Cấu Hình Lên Hệ Thống\s*</button>'

replacement = """<div class="admin-config-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; max-width: 1000px;">
                           <!-- Card 1: User & Rights -->
                           <div class="admin-config-card" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
                               <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 1.1rem; color: #1e293b; border-bottom: 2px solid #2563eb; padding-bottom: 5px; display: inline-block;">👤 Phân Quyền</h3>
                               <div class="input-group" style="padding: 10px 0; border-bottom: none;">
                                   <label style="margin-bottom: 5px; display: block;">Chức danh user mới</label>
                                   <div class="input-wrapper" style="padding-right: 10px; background: #fff; border: 1px solid #cbd5e1; border-radius: 6px;">
                                       <select id="p_defaultUserRank" style="width: 100%; padding: 8px; border: none; background: transparent; outline: none; font-size: 0.95rem; font-weight: 500; color: #334155;">
                                           <option value="tgd">Tổng Giám đốc</option>
                                           <option value="gd" selected>Giám đốc</option>
                                           <option value="ql">Quản lý</option>
                                           <option value="nv">Nhân viên</option>
                                           <option value="kh">Khách hàng (0%)</option>
                                       </select>
                                   </div>
                               </div>
                           </div>

                           <!-- Card 2: Lucky Money -->
                           <div class="admin-config-card" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
                               <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 1.1rem; color: #1e293b; border-bottom: 2px solid #10b981; padding-bottom: 5px; display: inline-block;">🧧 Lì Xì</h3>
                               <div class="input-group" style="padding: 10px 0; border-bottom: none;">
                                   <label style="margin-bottom: 5px; display: block;">Tỷ lệ lì xì / ngày</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px;">
                                       <input type="number" id="p_dailyLuckyRate" value="0.12" step="0.01" style="padding: 8px; font-size: 0.95rem;">
                                       <span class="unit" style="padding-right: 8px;">%</span>
                                   </div>
                               </div>
                               <div class="input-group" style="padding: 10px 0; border-bottom: none;">
                                   <label style="margin-bottom: 5px; display: block;">Hệ số số dư lì xì</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px;">
                                       <input type="number" id="p_luckyMul" value="5.5" step="0.1" style="padding: 8px; font-size: 0.95rem;">
                                       <span class="unit" style="padding-right: 8px;">lần</span>
                                   </div>
                               </div>
                           </div>

                           <!-- Card 3: Promo & Discount -->
                           <div class="admin-config-card" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
                               <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 1.1rem; color: #1e293b; border-bottom: 2px solid #d97706; padding-bottom: 5px; display: inline-block;">🎁 Khuyến Mại</h3>
                               <div class="input-group" style="padding: 10px 0; border-bottom: none;">
                                   <label style="margin-bottom: 5px; display: block;">Phiếu / VNĐ (Bình thường)</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px;">
                                       <input type="number" id="p_moneyToTicketRate" value="1" step="0.001" style="padding: 8px; font-size: 0.95rem;">
                                   </div>
                               </div>
                               <div class="input-group" style="padding: 10px 0; border-bottom: none;">
                                   <label style="margin-bottom: 5px; display: block;">Phiếu / VNĐ (Khuyến Mại)</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px;">
                                       <input type="number" id="p_moneyToTicketRatePromo" value="1.095" step="0.001" style="padding: 8px; font-size: 0.95rem;">
                                   </div>
                               </div>
                               <div class="input-group" style="padding: 10px 0; border-bottom: none;">
                                   <label style="margin-bottom: 5px; display: block;">Thời gian bắt đầu</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px;">
                                       <input type="datetime-local" id="p_promoStartDate" value="2026-05-16T00:00" style="padding: 4px; font-size: 0.9rem; border: none; outline: none; background: transparent; color: #334155;">
                                   </div>
                               </div>
                               <div class="input-group" style="padding: 10px 0; border-bottom: none;">
                                   <label style="margin-bottom: 5px; display: block;">Thời gian kết thúc</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px;">
                                       <input type="datetime-local" id="p_promoEndDate" value="2026-05-25T23:59" style="padding: 4px; font-size: 0.9rem; border: none; outline: none; background: transparent; color: #334155;">
                                   </div>
                               </div>
                               <button id="btn_preview_promo" style="width: 100%; padding: 10px; background: #f59e0b; color: white; border: none; border-radius: 6px; font-weight: 600; margin-top: 15px; cursor: pointer; transition: background 0.2s;">
                                   👀 Xem thử Banner & Popup
                               </button>
                           </div>

                           <!-- Card 4: Commissions -->
                           <div class="admin-config-card" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
                               <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 1.1rem; color: #1e293b; border-bottom: 2px solid #8b5cf6; padding-bottom: 5px; display: inline-block;">💸 Hoa Hồng</h3>
                               
                               <div style="font-weight: 600; color: #475569; margin: 10px 0 5px 0; font-size: 0.9rem;">Sản Phẩm Gom Nhóm</div>
                               <div class="input-group" style="padding: 5px 0; border-bottom: none;">
                                   <label style="margin-bottom: 5px; display: block;">Trực tiếp</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px;">
                                       <input type="number" id="a_max_direct" value="10" style="padding: 8px; font-size: 0.95rem;">
                                       <span class="unit" style="padding-right: 8px;">%</span>
                                   </div>
                               </div>
                               <div class="input-group" style="padding: 5px 0 15px 0; border-bottom: none;">
                                   <label style="margin-bottom: 5px; display: block;">Gián tiếp</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px;">
                                       <input type="number" id="a_max_indirect" value="5" style="padding: 8px; font-size: 0.95rem;">
                                       <span class="unit" style="padding-right: 8px;">%</span>
                                   </div>
                               </div>

                               <div style="font-weight: 600; color: #475569; margin: 10px 0 5px 0; font-size: 0.9rem; border-top: 1px dashed #cbd5e1; padding-top: 15px;">Sản Phẩm Nông Sản</div>
                               <div class="input-group" style="padding: 5px 0; border-bottom: none;">
                                   <label style="margin-bottom: 5px; display: block;">Trực tiếp</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px;">
                                       <input type="number" id="a_agri_max_direct" value="10" style="padding: 8px; font-size: 0.95rem;">
                                       <span class="unit" style="padding-right: 8px;">%</span>
                                   </div>
                               </div>
                               <div class="input-group" style="padding: 5px 0; border-bottom: none;">
                                   <label style="margin-bottom: 5px; display: block;">Gián tiếp</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px;">
                                       <input type="number" id="a_agri_max_indirect" value="5" style="padding: 8px; font-size: 0.95rem;">
                                       <span class="unit" style="padding-right: 8px;">%</span>
                                   </div>
                               </div>
                           </div>

                           <!-- Card 5: Fees -->
                           <div class="admin-config-card" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
                               <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 1.1rem; color: #1e293b; border-bottom: 2px solid #ef4444; padding-bottom: 5px; display: inline-block;">💳 Phí Giao Dịch</h3>
                               <div class="input-group" style="padding: 10px 0; border-bottom: none;">
                                   <label style="margin-bottom: 5px; display: block;">Phí sàn (Cũ)</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px;">
                                       <input type="number" id="p_platformFeeOldRate" value="0.5" step="0.1" style="padding: 8px; font-size: 0.95rem;">
                                       <span class="unit" style="padding-right: 8px;">%</span>
                                   </div>
                               </div>
                               <div class="input-group" style="padding: 10px 0; border-bottom: none;">
                                   <label style="margin-bottom: 5px; display: block;">Phí sàn (Mới)</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px;">
                                       <input type="number" id="p_platformFeeRate" value="5" step="0.1" title="Phí bán lại cho sàn" style="padding: 8px; font-size: 0.95rem;">
                                       <span class="unit" style="padding-right: 8px;">%</span>
                                   </div>
                               </div>
                               <div class="input-group" style="padding: 10px 0; border-bottom: none;">
                                   <label style="margin-bottom: 5px; display: block;">Thời gian áp dụng</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px;">
                                       <input type="datetime-local" id="p_platformFeeStartDate" value="2026-05-25T00:00" style="padding: 4px; font-size: 0.9rem; border: none; outline: none; background: transparent; color: #334155;">
                                   </div>
                               </div>
                           </div>
                       </div>
                       
                       <div style="max-width: 1000px; display: flex; justify-content: flex-end; margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                           <button id="btn_save_config" style="padding: 14px 30px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 1.05rem; cursor: pointer; box-shadow: 0 4px 6px rgba(16,185,129,0.2); transition: all 0.2s;">
                               💾 Lưu Cấu Hình Lên Hệ Thống
                           </button>"""

content, n = re.subn(pattern, replacement, content, flags=re.DOTALL)
print(f"Replaced {n} occurrences")

with open('index.html', 'w') as f:
    f.write(content)
