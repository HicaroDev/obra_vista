import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src', 'pages', 'Kanban.tsx');

try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // 1. Fix useEffect dependency lint (first occurrence)
    // Matches: loadEtiquetas();\n    }, []);
    const useEffectRegex1 = /(loadEtiquetas\(\);\s+)(?:\r\n|\r|\n)(\s*\}\, \[\]\;)/;
    if (useEffectRegex1.test(content)) {
        console.log('Found first useEffect pattern.');
        content = content.replace(useEffectRegex1, '$1// eslint-disable-next-line react-hooks/exhaustive-deps\n$2');
    }

    // 2. Fix useEffect dependency lint (second occurrence)
    // Matches: loadAtribuicoes();\n        }\n    }, [selectedObra]);
    const useEffectRegex2 = /(loadAtribuicoes\(\);\s+)(?:\r\n|\r|\n)(\s+\}\s+)(?:\r\n|\r|\n)(\s*\}\, \[selectedObra\]\;)/;
    if (useEffectRegex2.test(content)) {
        console.log('Found second useEffect pattern.');
        content = content.replace(useEffectRegex2, '$1$2// eslint-disable-next-line react-hooks/exhaustive-deps\n$3');
    }

    // 3. Fix corrupted text "OcorrÃªncias"
    // Using hex codes to be safe? Or just the copy-pasted garbage.
    // The user saw: âš ï¸  OcorrÃªncias
    if (content.includes('OcorrÃªncias')) {
        console.log('Found corrupted string "OcorrÃªncias". Fixing...');
        content = content.replace(/âš ï¸  OcorrÃªncias/g, '⚠️ Ocorrências');
        content = content.replace(/OcorrÃªncias/g, 'Ocorrências');
    } else if (content.includes('Ocorrências')) {
        console.log('String "Ocorrências" is already correct or simple.');
        // Ensure the emoji is correct if it was just text
        // Check if we have the garbled emoji: âš ï¸
        if (content.includes('âš ï¸')) {
            content = content.replace(/âš ï¸/g, '⚠️');
        }
    }

    // 4. Remove unused import Filter
    // import { ... Filter, ... } from 'lucide-react';
    if (content.includes('Filter,')) {
        console.log('Removing unused Filter import...');
        content = content.replace(/Filter,\s*/g, '');
    }

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Kanban.tsx updated successfully.');
    } else {
        console.log('No changes needed or patterns not found.');
    }

} catch (error) {
    console.error('Error processing file:', error);
}
