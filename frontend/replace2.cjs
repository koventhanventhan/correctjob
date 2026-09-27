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

        // First pass: replace direct colors
        content = content.replace(/\btext-plum\b/g, 'text-orange');
        content = content.replace(/\bbg-plum\b/g, 'bg-orange');
        content = content.replace(/\bbg-plum\/90\b/g, 'bg-orange/90');
        content = content.replace(/\bborder-plum\b/g, 'border-orange');
        content = content.replace(/\bring-plum\b/g, 'ring-orange');

        content = content.replace(/\btext-gray-900\b/g, 'text-charcoal');
        content = content.replace(/\btext-gray-800\b/g, 'text-charcoal');
        content = content.replace(/\btext-black\b/g, 'text-charcoal');

        content = content.replace(/\bbg-white\b/g, 'bg-warmwhite');
        
        content = content.replace(/hover:bg-gray-50\b/g, 'hover:bg-peach');
        content = content.replace(/hover:bg-gray-100\b/g, 'hover:bg-peach');
        
        content = content.replace(/\bbg-gray-50\b/g, 'bg-warmwhite');
        content = content.replace(/\bbg-gray-100\b/g, 'bg-peach');

        // Contrast and contextual fixes
        let lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            // Fix text on peach background (should be charcoal, not orange or white)
            if (lines[i].includes('bg-peach') && lines[i].includes('text-orange')) {
                lines[i] = lines[i].replace(/text-orange/g, 'text-charcoal');
            }
            if (lines[i].includes('bg-peach') && lines[i].includes('text-white')) {
                lines[i] = lines[i].replace(/text-white/g, 'text-charcoal');
            }
            
            // Fix text on orange background if it was peach
            if ((lines[i].includes('bg-orange') || lines[i].includes('bg-orange/90')) && lines[i].includes('text-peach')) {
                lines[i] = lines[i].replace(/text-peach/g, 'text-warmwhite');
            }
        }
        content = lines.join('\n');

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            modifiedCount++;
            console.log(`Modified ${filePath}`);
        }
    }
});

console.log(`Modified ${modifiedCount} files.`);
