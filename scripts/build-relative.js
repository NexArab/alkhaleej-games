/**
 * Post-build path rewriter.
 *
 * The templates emit absolute paths ("/assets/...", "/love-test/").
 * Absolute paths only work when the site sits at a domain root.
 * On GitHub Pages project sites the URL is "user.github.io/repo/",
 * so "/assets/..." resolves to the wrong place and the site breaks.
 *
 * This step rewrites every absolute in-site path to a RELATIVE one,
 * computed from the depth of each HTML file. Result: the generated
 * site works identically at a domain root, in a subfolder, or locally.
 *
 *   generated/index.html              depth 0  →  prefix ""      → "assets/..."
 *   generated/love-test/index.html    depth 1  →  prefix "../"   → "../assets/..."
 *   generated/love-games/index.html   depth 1  →  prefix "../"   → "../love-test/"
 */
const fs = require('fs');
const path = require('path');

/**
 * Rewrite one HTML file's absolute in-site paths to relative.
 * @param {string} filePath - absolute path to the .html file
 * @param {string} outDir   - the generated/ root
 */
function rewriteFile(filePath, outDir) {
  let html = fs.readFileSync(filePath, 'utf8');

  // Depth = how many folders deep the file is, relative to outDir.
  // index.html at root → depth 0. <slug>/index.html → depth 1.
  const rel = path.relative(outDir, filePath);
  const depth = rel.split(path.sep).length - 1;
  const prefix = depth === 0 ? './' : '../'.repeat(depth);

  // Rewrite attributes: href="/..."  src="/..."  content="/..."
  // Only touch values that start with a single "/" (in-site absolute).
  // Leave "//cdn..." and "https://..." untouched.
  html = html.replace(
    /(href|src|content)="\/(?!\/)([^"]*)"/g,
    (match, attr, rest) => `${attr}="${prefix}${rest}"`
  );

  // Rewrite url(/...) inside any inline style or CSS
  html = html.replace(
    /url\(\/(?!\/)([^)]*)\)/g,
    (match, rest) => `url(${prefix}${rest})`
  );

  fs.writeFileSync(filePath, html, 'utf8');
}

/**
 * Walk generated/ and rewrite every .html file.
 * @param {string} outDir
 * @returns {number} count of files rewritten
 */
function makeRelative(outDir) {
  let count = 0;
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.html')) {
        rewriteFile(full, outDir);
        count++;
      }
    }
  }
  walk(outDir);
  return count;
}

module.exports = { makeRelative };
