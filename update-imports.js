import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const replacements = [
  // Next.js imports
  { from: "import Link from 'next/link'", to: "import { Link } from 'react-router-dom'" },
  { from: 'import Link from "next/link"', to: 'import { Link } from "react-router-dom"' },
  { from: "import { useRouter } from 'next/navigation'", to: "import { useNavigate } from 'react-router-dom'" },
  { from: 'import { useRouter } from "next/navigation"', to: 'import { useNavigate } from "react-router-dom"' },
  { from: "import Image from 'next/image'", to: "// import Image from 'next/image' // Removed for Vite" },
  { from: 'import Image from "next/image"', to: '// import Image from "next/image" // Removed for Vite' },
  
  // Rawa7el packages
  { from: "@rawa7el/supabase/server", to: "@/lib/supabase" },
  { from: "@rawa7el/supabase/client", to: "@/lib/supabase" },
  { from: "@rawa7el/ui/", to: "@/components/ui/" },
  
  // Remove 'use client' and Next.js specific
  { from: "'use client'", to: "// 'use client' removed for Vite" },
  { from: '"use client"', to: '// "use client" removed for Vite' },
  { from: "redirect(", to: "// redirect( // TODO: Replace with navigate()" },
  { from: "cookies()", to: "// cookies() // TODO: Handle differently in Vite" },
];

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  replacements.forEach(({ from, to }) => {
    if (content.includes(from)) {
      content = content.replaceAll(from, to);
      modified = true;
    }
  });

  // Replace router.push with navigate
  if (content.includes('router.push(')) {
    content = content.replace(/const router = useRouter\(\)/g, 'const navigate = useNavigate()');
    content = content.replace(/router\.push\(/g, 'navigate(');
    content = content.replace(/router\.refresh\(\)/g, '// router.refresh() removed');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated: ${filePath}`);
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
      updateFile(filePath);
    }
  });
}

const pagesDir = path.join(__dirname, 'src', 'pages');
console.log('🔄 Updating imports in:', pagesDir);
walkDir(pagesDir);
console.log('✅ Done!');
