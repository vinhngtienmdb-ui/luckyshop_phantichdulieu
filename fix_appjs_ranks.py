with open('app.js', 'r') as f:
    content = f.read()

# 1. Update onSnapshot sync
old_sync = """          const userDefaultRankSelect =
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
            }
          }
          if (data.defaultRank) {
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
          }"""

new_sync = """          if (data.defaultRank) {
            const u_rank = document.getElementById("u_rank");
            if (u_rank && u_rank.value !== data.defaultRank) {
              u_rank.value = data.defaultRank;
              if (typeof updateSubordinateVisibility === "function")
                updateSubordinateVisibility();
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
          }"""

content = content.replace(old_sync, new_sync)

# 2. Remove userDefaultRankSelect listener
import re
content = re.sub(r'  const userDefaultRankSelect = document\.getElementById\("user_default_rank"\);\s*if \(userDefaultRankSelect\) {.*?\n  }\n', '', content, flags=re.DOTALL)

with open('app.js', 'w') as f:
    f.write(content)
