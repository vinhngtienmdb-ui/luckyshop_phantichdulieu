const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

js = js.replace(/document\.getElementById\("pending_modal"\)\.style\.display = "flex";/g, 'const pm = document.getElementById("pending_modal"); if(pm) pm.style.display = "flex";');
js = js.replace(/document\.getElementById\("pending_modal"\)\.style\.display = "none";/g, 'const pm = document.getElementById("pending_modal"); if(pm) pm.style.display = "none";');
js = js.replace(/document\.getElementById\("edit_profile_modal"\)\.style\.display = "none";/g, 'const epm = document.getElementById("edit_profile_modal"); if(epm) epm.style.display = "none";');
js = js.replace(/document\.getElementById\("btn_pm_agri_cancel"\)\.style\.display = "inline-block";/g, 'const bpmac = document.getElementById("btn_pm_agri_cancel"); if(bpmac) bpmac.style.display = "inline-block";');

fs.writeFileSync('app.js', js);
