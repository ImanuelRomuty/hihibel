#!/usr/bin/env node
/**
 * Generate js/config.js from environment variables (Netlify build)
 * Usage: SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/generate-config.js
 */
const fs = require('fs');
const path = require('path');

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_ANON_KEY || '';

const content = `// Auto-generated — do not edit manually on production
window.HIHIBEL_CONFIG = {
  SUPABASE_URL: '${url}',
  SUPABASE_ANON_KEY: '${key}',
};
`;

const out = path.join(__dirname, '..', 'js', 'config.js');
fs.writeFileSync(out, content);
console.log('config.js generated', url ? '(with Supabase URL)' : '(empty — offline mode)');
