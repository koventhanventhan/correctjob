const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(dirPath);
    });
}

let modifiedCount = 0;

walk('c:\\xampp\\htdocs\\correctjob\\frontend\\src', (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        content = content.replace(/\b(bg|text|border|ring|stroke|fill)-(indigo|blue)-(\d+)/g, (match, type, color, weight) => {
            let w = parseInt(weight);
            if (type === 'bg') {
                if (w >= 500) {
                    return w >= 700 ? 'bg-plum/90' : 'bg-plum';
                } else {
                    return 'bg-peach'; 
                }
            } else if (type === 'text') {
                // Peach is too light for text on white, use plum.
                return 'text-plum';
            } else if (type === 'border' || type === 'ring' || type === 'stroke' || type === 'fill') {
                if (w <= 300) return type + '-peach';
                return type + '-plum';
            }
            return match;
        });

        // Handle text-white that might be on peach. (bg-peach text-white is bad).
        // Since we are replacing bg-indigo-50 with bg-peach, text on it was usually text-indigo-700 which is now text-plum.
        // That's fine. If there is any bg-peach text-white, it would be caught, but usually it was bg-indigo-600 text-white.
        
        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Modified ${filePath}`);
            modifiedCount++;
        }
    }
});

console.log(`Modified ${modifiedCount} files.`);
