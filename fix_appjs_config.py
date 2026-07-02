with open('app.js', 'r') as f:
    content = f.read()

content = content.replace(
    'p_dailyLuckyRate: getVal("p_dailyLuckyRate"),',
    'p_defaultUserRank: document.getElementById("p_defaultUserRank") ? document.getElementById("p_defaultUserRank").value : "gd",\n        p_dailyLuckyRate: getVal("p_dailyLuckyRate"),'
)

content = content.replace(
    'setVal("p_dailyLuckyRate", data.p_dailyLuckyRate);',
    'setVal("p_defaultUserRank", data.p_defaultUserRank || "gd");\n      setVal("p_dailyLuckyRate", data.p_dailyLuckyRate);'
)

with open('app.js', 'w') as f:
    f.write(content)
