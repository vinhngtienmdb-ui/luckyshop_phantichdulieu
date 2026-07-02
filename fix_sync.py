import re

with open('app.js', 'r') as f:
    content = f.read()

# Replace the block for user_default_rank event listener
content = re.sub(
    r'  const userDefaultRankSelect = document\.getElementById\("user_default_rank"\);.*?catch\(.*?\}\n  \}',
    '',
    content,
    flags=re.DOTALL
)

# Replace the onSnapshot block for sync
old_block = """          const userDefaultRankSelect =
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
          }"""

new_block = """          if (data.defaultRank) {
            const u_rank = document.getElementById("u_rank");
            if (u_rank && u_rank.value !== data.defaultRank) {
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
          }"""

content = content.replace(old_block, new_block)

with open('app.js', 'w') as f:
    f.write(content)
