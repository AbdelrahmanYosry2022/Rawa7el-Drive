import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Remove lines like: const supabase = createClient();
  if (content.match(/const supabase = createClient\(\)/)) {
    content = content.replace(/\s*const supabase = createClient\(\);?\s*/g, '\n  // supabase is imported from @/lib/supabase\n');
    modified = true;
  }

  // Also check for createClient with parameters
  if (content.match(/const supabase = createClient\([^)]*\)/)) {
    content = content.replace(/\s*const supabase = createClient\([^)]*\);?\s*/g, '\n  // supabase is imported from @/lib/supabase\n');
    modified = true;
  }

  // Make sure supabase is imported
  if (!content.includes("import { supabase }") && !content.includes("import { createClient, supabase }")) {
    // Find the import section and add supabase import
    const importMatch = content.match(/(import.*from ['"]@\/lib\/supabase['"])/);
    if (importMatch) {
      const oldImport = importMatch[1];
      if (oldImport.includes('createClient') && !oldImport.includes('supabase')) {
        content = content.replace(oldImport, oldImport.replace('createClient', 'createClient, supabase'));
        modified = true;
      } else if (!oldImport.includes('createClient') && !oldImport.includes('supabase')) {
        content = content.replace(oldImport, "import { supabase } from '@/lib/supabase'");
        modified = true;
      }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fixFile(filePath);
    }
  });
}

const pagesDir = path.join(__dirname, 'src', 'pages');
console.log('🔄 Fixing supabase client instances in:', pagesDir);
walkDir(pagesDir);
console.log('✅ Done!');
