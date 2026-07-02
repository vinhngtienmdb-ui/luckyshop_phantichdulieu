import re
with open('index.html', 'r') as f:
    content = f.read()

# Replace the input-list with a nicer structure using grids and cards
old_config = """                       <div class="input-list" style="max-width: 500px;">
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
                               <label>Tỷ lệ lì xì / ngày</label>
                               <div class="input-wrapper">
                                   <input type="number" id="p_dailyLuckyRate" value="0.12" step="0.01">
                                   <span class="unit">%</span>
                               </div>
                           </div>
                           <div class="input-group">
                               <label>Hệ số số dư lì xì</label>
                               <div class="input-wrapper">
                                   <input type="number" id="p_luckyMul" value="5.5" step="0.1">
                                   <span class="unit">lần</span>
                               </div>
                           </div>
                           <h3 style="margin-top: 15px; margin-bottom: 10px; font-size: 1rem; color: #d97706;">Cấu Hình Khấu Trừ & Khuyến Mại</h3>
                           <div class="input-group">
                               <label>Tỷ lệ Phiếu / VNĐ (Bình thường)</label>
                               <div class="input-wrapper">
                                   <input type="number" id="p_moneyToTicketRate" value="1" step="0.001" title="Tỷ lệ 1 VNĐ bằng bao nhiêu Phiếu Khấu Trừ">
                                   <span class="unit"></span>
                               </div>
                           </div>
                           <div class="input-group">
                               <label>Tỷ lệ Khuyến Mại</label>
                               <div class="input-wrapper">
                                   <input type="number" id="p_moneyToTicketRatePromo" value="1.095" step="0.001" title="Tỷ lệ khuyến mại">
                                   <span class="unit"></span>
                               </div>
                           </div>
                           <div class="input-group">
                               <label>Thời gian bắt đầu (GMT+7)</label>
                               <div class="input-wrapper">
                                   <input type="datetime-local" id="p_promoStartDate" value="2026-05-16T00:00">
                               </div>
                           </div>
                           <div class="input-group">
                               <label>Thời gian kết thúc (GMT+7)</label>
                               <div class="input-wrapper">
                                   <input type="datetime-local" id="p_promoEndDate" value="2026-05-25T23:59">
                               </div>
                           </div>
                           <button id="btn_preview_promo" style="width: 100%; padding: 8px; background: #f59e0b; color: white; border: none; border-radius: 5px; font-weight: 600; margin-top: 10px; cursor: pointer;">
                               👀 Xem thử Banner & Popup
                           </button>
                           <h3 style="margin-top: 15px; margin-bottom: 10px; font-size: 1rem; color: #2563eb;">Mức Max Hoa Hồng Gom Nhóm (%)</h3>
                           <div class="input-group">
                               <label>Trực tiếp Gom nhóm</label>
                               <div class="input-wrapper">
                                   <input type="number" id="a_max_direct" value="10">
                                   <span class="unit">%</span>
                               </div>
                           </div>
                           <div class="input-group">
                               <label>Gián tiếp Gom nhóm</label>
                               <div class="input-wrapper">
                                   <input type="number" id="a_max_indirect" value="5">
                                   <span class="unit">%</span>
                               </div>
                           </div>
                           
                           <h3 style="margin-top: 15px; margin-bottom: 10px; font-size: 1rem; color: #10b981;">Mức Max Hoa Hồng Nông Sản (%)</h3>
                            <div class="input-group">
                                <label>Trực tiếp Nông sản</label>
                                <div class="input-wrapper">
                                    <input type="number" id="a_agri_max_direct" value="10">
                                    <span class="unit">%</span>
                                </div>
                            </div>
                            <div class="input-group">
                                <label>Gián tiếp Nông sản</label>
                                <div class="input-wrapper">
                                    <input type="number" id="a_agri_max_indirect" value="5">
                                    <span class="unit">%</span>
                                </div>
                            </div>
                           <h3 style="margin-top: 15px; margin-bottom: 10px; font-size: 1rem; color: #d97706;">Phí Giao Dịch</h3>
                           <div class="input-group">
                               <label>Phí sàn (Cũ)</label>
                               <div class="input-wrapper">
                                   <input type="number" id="p_platformFeeOldRate" value="0.5" step="0.1">
                                   <span class="unit">%</span>
                               </div>
                           </div>
                           <div class="input-group">
                               <label>Phí sàn (Mới)</label>
                               <div class="input-wrapper">
                                   <input type="number" id="p_platformFeeNewRate" value="0.2" step="0.1">
                                   <span class="unit">%</span>
                               </div>
                           </div>
                       </div>
                       <button id="btn_save_system_params" style="margin-top: 20px; width: 100%; max-width: 500px; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 1rem; cursor: pointer; box-shadow: 0 4px 6px rgba(37,99,235,0.2);">
                           💾 Lưu Cấu Hình Hệ Thống
                       </button>"""

new_config = """                       <div class="admin-config-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; max-width: 1000px;">
                           <!-- Card 1: User & Rights -->
                           <div class="admin-config-card" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
                               <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 1.1rem; color: #1e293b; border-bottom: 2px solid #2563eb; padding-bottom: 5px; display: inline-block;">👤 Phân Quyền</h3>
                               <div class="input-group" style="padding: 10px 0;">
                                   <label>Chức danh user mới</label>
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
                               <div class="input-group" style="padding: 10px 0;">
                                   <label>Tỷ lệ lì xì / ngày</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px;">
                                       <input type="number" id="p_dailyLuckyRate" value="0.12" step="0.01" style="padding: 8px; font-size: 0.95rem;">
                                       <span class="unit" style="padding-right: 8px;">%</span>
                                   </div>
                               </div>
                               <div class="input-group" style="padding: 10px 0;">
                                   <label>Hệ số số dư lì xì</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px;">
                                       <input type="number" id="p_luckyMul" value="5.5" step="0.1" style="padding: 8px; font-size: 0.95rem;">
                                       <span class="unit" style="padding-right: 8px;">lần</span>
                                   </div>
                               </div>
                           </div>

                           <!-- Card 3: Promo & Discount -->
                           <div class="admin-config-card" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
                               <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 1.1rem; color: #1e293b; border-bottom: 2px solid #d97706; padding-bottom: 5px; display: inline-block;">🎁 Khuyến Mại</h3>
                               <div class="input-group" style="padding: 10px 0;">
                                   <label>Phiếu / VNĐ (Bình thường)</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px;">
                                       <input type="number" id="p_moneyToTicketRate" value="1" step="0.001" style="padding: 8px; font-size: 0.95rem;">
                                   </div>
                               </div>
                               <div class="input-group" style="padding: 10px 0;">
                                   <label>Phiếu / VNĐ (Khuyến Mại)</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px;">
                                       <input type="number" id="p_moneyToTicketRatePromo" value="1.095" step="0.001" style="padding: 8px; font-size: 0.95rem;">
                                   </div>
                               </div>
                               <div class="input-group" style="padding: 10px 0;">
                                   <label>Thời gian bắt đầu</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px;">
                                       <input type="datetime-local" id="p_promoStartDate" value="2026-05-16T00:00" style="padding: 4px; font-size: 0.9rem; border: none; outline: none; background: transparent; color: #334155;">
                                   </div>
                               </div>
                               <div class="input-group" style="padding: 10px 0;">
                                   <label>Thời gian kết thúc</label>
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
                               <div class="input-group" style="padding: 5px 0;">
                                   <label>Trực tiếp</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px;">
                                       <input type="number" id="a_max_direct" value="10" style="padding: 8px; font-size: 0.95rem;">
                                       <span class="unit" style="padding-right: 8px;">%</span>
                                   </div>
                               </div>
                               <div class="input-group" style="padding: 5px 0 15px 0;">
                                   <label>Gián tiếp</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px;">
                                       <input type="number" id="a_max_indirect" value="5" style="padding: 8px; font-size: 0.95rem;">
                                       <span class="unit" style="padding-right: 8px;">%</span>
                                   </div>
                               </div>

                               <div style="font-weight: 600; color: #475569; margin: 10px 0 5px 0; font-size: 0.9rem; border-top: 1px dashed #cbd5e1; padding-top: 15px;">Sản Phẩm Nông Sản</div>
                               <div class="input-group" style="padding: 5px 0;">
                                   <label>Trực tiếp</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px;">
                                       <input type="number" id="a_agri_max_direct" value="10" style="padding: 8px; font-size: 0.95rem;">
                                       <span class="unit" style="padding-right: 8px;">%</span>
                                   </div>
                               </div>
                               <div class="input-group" style="padding: 5px 0;">
                                   <label>Gián tiếp</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px;">
                                       <input type="number" id="a_agri_max_indirect" value="5" style="padding: 8px; font-size: 0.95rem;">
                                       <span class="unit" style="padding-right: 8px;">%</span>
                                   </div>
                               </div>
                           </div>

                           <!-- Card 5: Fees -->
                           <div class="admin-config-card" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
                               <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 1.1rem; color: #1e293b; border-bottom: 2px solid #ef4444; padding-bottom: 5px; display: inline-block;">💳 Phí Giao Dịch</h3>
                               <div class="input-group" style="padding: 10px 0;">
                                   <label>Phí sàn (Cũ)</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px;">
                                       <input type="number" id="p_platformFeeOldRate" value="0.5" step="0.1" style="padding: 8px; font-size: 0.95rem;">
                                       <span class="unit" style="padding-right: 8px;">%</span>
                                   </div>
                               </div>
                               <div class="input-group" style="padding: 10px 0;">
                                   <label>Phí sàn (Mới)</label>
                                   <div class="input-wrapper" style="background: #fff; border: 1px solid #cbd5e1; border-radius: 6px;">
                                       <input type="number" id="p_platformFeeNewRate" value="0.2" step="0.1" style="padding: 8px; font-size: 0.95rem;">
                                       <span class="unit" style="padding-right: 8px;">%</span>
                                   </div>
                               </div>
                           </div>
                       </div>
                       
                       <div style="max-width: 1000px; display: flex; justify-content: flex-end; margin-top: 25px;">
                           <button id="btn_save_system_params" style="padding: 14px 30px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 1.05rem; cursor: pointer; box-shadow: 0 4px 6px rgba(37,99,235,0.2); transition: all 0.2s;">
                               💾 Lưu Cấu Hình Hệ Thống
                           </button>
                       </div>"""

content = content.replace(old_config, new_config)
with open('index.html', 'w') as f:
    f.write(content)
