/**
 * Optional authoring helper: expands shared HTML fragments into standalone pages.
 * Usage: node scripts/build.mjs           (all pages)
 *        node scripts/build.mjs index    (selected page names, without .html)
 * No package installation or browser-side template loader is required.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultSourceRoot = path.join(projectRoot, 'src');

function within(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

/** Expand includes, rejecting traversal, symlink escapes, missing files and cycles. */
export async function expandIncludes(filePath, sourceRoot = defaultSourceRoot, stack = []) {
  const realRoot = await fs.realpath(sourceRoot);
  const absoluteFile = path.resolve(filePath);
  if (!within(path.resolve(sourceRoot), absoluteFile)) {
    throw new Error(`Template is outside src: ${filePath}`);
  }

  let realFile;
  try {
    realFile = await fs.realpath(absoluteFile);
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error(`Template not found: ${path.relative(sourceRoot, absoluteFile)}`);
    throw error;
  }
  if (!within(realRoot, realFile)) throw new Error(`Template symlink is outside src: ${filePath}`);
  if (stack.includes(realFile)) {
    const chain = [...stack, realFile].map(file => path.relative(realRoot, file)).join(' -> ');
    throw new Error(`Circular include: ${chain}`);
  }

  const text = await fs.readFile(realFile, 'utf8');
  const include = /^([\t ]*)<!--\s*include:([^>\r\n]+?)\s*-->[\t ]*$/gm;
  let rendered = '';
  let cursor = 0;
  for (const match of text.matchAll(include)) {
    const [, indent, relative] = match;
    const name = relative.trim();
    if (!/^[a-z0-9_./-]+\.html$/i.test(name) || path.isAbsolute(name) || name.split('/').includes('..')) {
      throw new Error(`Invalid include path in ${path.relative(realRoot, realFile)}: ${name}`);
    }
    const includedPath = path.resolve(sourceRoot, name);
    if (!within(path.resolve(sourceRoot), includedPath)) throw new Error(`Include is outside src: ${name}`);
    const fragment = await expandIncludes(includedPath, sourceRoot, [...stack, realFile]);
    const indented = fragment.trimEnd().split('\n').map(line => line ? indent + line : '').join('\n');
    rendered += text.slice(cursor, match.index) + indented;
    cursor = match.index + match[0].length;
  }
  rendered += text.slice(cursor);
  if (/<!--\s*include:/.test(rendered)) {
    throw new Error(`Malformed include in ${path.relative(realRoot, realFile)}; put the marker on its own line.`);
  }
  return rendered;
}

/** Apply the current page marker to links in the shared sidebar only. */
export function markCurrentSidebar(html, pageName) {
  return html.replace(/<aside\b[^>]*\bid="sidebar"[^>]*>[\s\S]*?<\/aside>/, sidebar => {
    return sidebar.replace(/<a\b[^>]*>/g, anchor => {
      const href = anchor.match(/\bhref="([^"]+)"/);
      if (!href || href[1] !== `${pageName}.html`) return anchor;
      const clean = anchor.replace(/\s+aria-current="[^"]*"/g, '');
      return clean.replace(/>$/, ' aria-current="page">');
    });
  });
}

export async function buildPages(pageNames = []) {
  const sourcePages = path.join(defaultSourceRoot, 'pages');
  const names = pageNames.length ? pageNames : (await fs.readdir(sourcePages))
    .filter(name => name.endsWith('.html'))
    .map(name => name.slice(0, -5))
    .sort();

  // Render everything first: invalid templates never leave a partially updated build.
  const pages = [];
  for (const name of names) {
    if (!/^[a-z0-9][a-z0-9_-]*$/i.test(name)) throw new Error(`Invalid page name: ${name}`);
    const sourceFile = path.join(sourcePages, `${name}.html`);
    let html = await expandIncludes(sourceFile);
    html = markCurrentSidebar(html, name);
    html = html.replace(/<nav class="(?:main-nav|mobile-menu__nav)"[^>]*>[\s\S]*?<\/nav>/g, nav =>
      nav.replaceAll(`<a href="${name}.html">`, `<a href="${name}.html" aria-current="page">`)
    );
    const notice = `<!-- Generated from src/pages/${name}.html. Edit source/partials, then run node scripts/build.mjs. -->`;
    if (!/^<!doctype html>/i.test(html)) throw new Error(`Page requires an HTML doctype: ${name}`);
    html = html.replace(/^(<!doctype html>)/i, `$1\n${notice}`);
    pages.push({ name, html });
  }
  for (const { name, html } of pages) {
    await fs.writeFile(path.join(projectRoot, `${name}.html`), html, 'utf8');
  }
  return pages.map(page => `${page.name}.html`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const outputs = await buildPages(process.argv.slice(2));
    console.log(`Built: ${outputs.join(', ')}`);
  } catch (error) {
    console.error(`Build failed: ${error.message}`);
    process.exitCode = 1;
  }
}
