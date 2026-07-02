const fs = require('fs');
const js = fs.readFileSync('app.js', 'utf8');

const lines = js.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('style.')) {
        if (!line.includes('if (') && !line.includes('if(')) {
           console.log((i+1) + ": " + line.trim());
        }
    }
}
