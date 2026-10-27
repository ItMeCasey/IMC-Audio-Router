'use strict';
/**
 * The IMC Audio Router browser extension, offered from the Setup page.
 * Browsers do not let a program install an extension from outside their stores, so this does the part that can be done for the user:
 * it finds the prepared extension folders and the installed browsers, opens the folder, and opens the browser's own extensions page
 * (where "Load unpacked" / "Load Temporary Add-on" is one click away). Only fixed addresses and folders are ever opened.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawn: nodeSpawn } = require('node:child_process');

module.exports = function createBrowserExt(ctx) {
  const exists = ctx.exists || fs.existsSync, spawn = ctx.spawn || nodeSpawn, env = ctx.env || process.env, log = ctx.log || (() => {});
  const join = (...a) => a.filter(Boolean).join('\\').replace(/\\+/g, '\\');
  // the install locations of each browser on Windows (the first that exists is used)
  const EXES = {
    chrome: [join(env.ProgramFiles, 'Google/Chrome/Application/chrome.exe'), join(env['ProgramFiles(x86)'], 'Google/Chrome/Application/chrome.exe'), join(env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe')],
    edge: [join(env['ProgramFiles(x86)'], 'Microsoft/Edge/Application/msedge.exe'), join(env.ProgramFiles, 'Microsoft/Edge/Application/msedge.exe')],
    firefox: [join(env.ProgramFiles, 'Mozilla Firefox/firefox.exe'), join(env['ProgramFiles(x86)'], 'Mozilla Firefox/firefox.exe')]
  };
  // the browser's own page for loading an extension by hand
  const PAGES = { chrome: 'chrome://extensions', edge: 'edge://extensions', firefox: 'about:debugging#/runtime/this-firefox' };
  // Chrome and Edge share one extension folder; Firefox has its own
  const KIND = { chrome: 'chrome', edge: 'chrome', firefox: 'firefox' };

  const exe = (b) => (EXES[b] || []).find((f) => f && exists(f)) || '';
  // the folder holding the built extension: next to the app when installed, extension/dist in a source checkout
  const base = () => (ctx.roots || []).find((r) => exists(path.join(r, 'chrome', 'manifest.json')) && exists(path.join(r, 'firefox', 'manifest.json'))) || '';

  function view() {
    const b = base();
    return { ready: !!b, folders: b ? { chrome: path.join(b, 'chrome'), firefox: path.join(b, 'firefox') } : null, browsers: { chrome: !!exe('chrome'), edge: !!exe('edge'), firefox: !!exe('firefox') } };
  }
  // run a program on its own, so it outlives this server
  function start(file, args) { const c = spawn(file, args, { detached: true, stdio: 'ignore', windowsHide: false }); if (c && c.on) c.on('error', (e) => log('browser extension: could not start', file, e.message)); if (c && c.unref) c.unref(); }

  /** what = 'folder' shows the prepared folder in Explorer; what = 'page' opens the browser on its extensions page */
  function open(browser, what) {
    if (!KIND[browser]) throw new Error('Unknown browser');
    const b = base(); if (!b) throw new Error('The extension files were not found. Reinstall the app, or run "node extension/build.js" in the source folder.');
    if (what === 'folder') { start('explorer.exe', [path.join(b, KIND[browser])]); return { ok: true }; }
    if (what !== 'page') throw new Error('Unknown action');
    const f = exe(browser); if (!f) throw new Error(browser[0].toUpperCase() + browser.slice(1) + ' does not seem to be installed.');
    start(f, [PAGES[browser]]); return { ok: true };
  }
  return { view, open };
};
