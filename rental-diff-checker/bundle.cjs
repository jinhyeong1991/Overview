const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
let html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

const assetsDir = path.join(distDir, 'assets');

// Inline CSS
const cssFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.css'));
cssFiles.forEach(f => {
  const css = fs.readFileSync(path.join(assetsDir, f), 'utf8');
  const escaped = f.replace(/\./g, '\\.').replace(/\-/g, '\\-');
  const re = new RegExp('<link[^>]+href=["\'][^"\']*' + escaped + '["\'][^>]*>', 'g');
  html = html.replace(re, () => '<style>' + css + '</style>');
});

// Inline JS — use function replacer to avoid $-substitution in minified code
const jsFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js'));
jsFiles.forEach(f => {
  const js = fs.readFileSync(path.join(assetsDir, f), 'utf8');
  const escaped = f.replace(/\./g, '\\.').replace(/\-/g, '\\-');
  const re = new RegExp('<script[^>]+src=["\'][^"\']*' + escaped + '["\'][^>]*><\\/script>', 'g');
  html = html.replace(re, () => '<script type="module">' + js + '</script>');
});

const outPath = path.join(__dirname, '..', 'rental-checker.html');
fs.writeFileSync(outPath, html, 'utf8');
const size = Math.round(fs.statSync(outPath).size / 1024);

// Verify: no bare asset src/href tags remain
const srcRemaining = /<script[^>]+src=[^>]*\/assets\//.test(html);
const hrefRemaining = /<link[^>]+href=[^>]*\/assets\//.test(html);
console.log('Bundle written:', size, 'KB');
console.log('Script src remaining:', srcRemaining ? 'YES (problem!)' : 'none (OK)');
console.log('Link href remaining:', hrefRemaining ? 'YES (problem!)' : 'none (OK)');
