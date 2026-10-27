'use strict';
// Offering the browser extension from Setup: finds the folders and browsers, opens only fixed folders and pages. Run: node browserext-test.js
const assert = require('assert'), path = require('path'), createBrowserExt = require('./browserext.js');

const files = new Set(), started = [];
const env = { ProgramFiles: 'C:\\Program Files', 'ProgramFiles(x86)': 'C:\\Program Files (x86)', LOCALAPPDATA: 'C:\\Users\\u\\AppData\\Local' };
const mk = () => createBrowserExt({ roots: ['C:\\app\\extension\\dist', 'C:\\app\\resources\\extension'], env, exists: (f) => files.has(f.replace(/\//g, '\\')), spawn: (f, a, o) => { started.push({ f, a, o }); return { unref() {}, on() {} }; } });

// nothing built, nothing installed
let x = mk(); assert.deepEqual(x.view(), { ready: false, folders: null, browsers: { chrome: false, edge: false, firefox: false } });
assert.throws(() => x.open('chrome', 'folder'), /extension files were not found/);

// built in a source checkout; Chrome in its per-user folder, Edge and Firefox in Program Files
for (const f of ['C:\\app\\extension\\dist\\chrome\\manifest.json', 'C:\\app\\extension\\dist\\firefox\\manifest.json', 'C:\\Users\\u\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Mozilla Firefox\\firefox.exe']) files.add(f);
x = mk(); const v = x.view();
assert.equal(v.ready, true); assert.equal(v.folders.chrome, path.join('C:\\app\\extension\\dist', 'chrome')); assert.deepEqual(v.browsers, { chrome: true, edge: true, firefox: true });

// folders: Chrome and Edge share one, Firefox has its own; always Explorer, always our folder
x.open('edge', 'folder'); x.open('firefox', 'folder');
assert.deepEqual(started.map((s) => [s.f, s.a[0]]), [['explorer.exe', path.join('C:\\app\\extension\\dist', 'chrome')], ['explorer.exe', path.join('C:\\app\\extension\\dist', 'firefox')]]);
// pages: the browser itself, on its own extensions page, detached from this process
started.length = 0; x.open('chrome', 'page'); x.open('edge', 'page'); x.open('firefox', 'page');
assert.deepEqual(started.map((s) => [path.basename(s.f), s.a]), [['chrome.exe', ['chrome://extensions']], ['msedge.exe', ['edge://extensions']], ['firefox.exe', ['about:debugging#/runtime/this-firefox']]]);
assert.ok(started.every((s) => s.o.detached === true && s.o.stdio === 'ignore'));
// the packaged layout (extension folder next to the app) is found too
files.delete('C:\\app\\extension\\dist\\chrome\\manifest.json'); for (const f of ['C:\\app\\resources\\extension\\chrome\\manifest.json', 'C:\\app\\resources\\extension\\firefox\\manifest.json']) files.add(f);
assert.equal(mk().view().folders.firefox, path.join('C:\\app\\resources\\extension', 'firefox'));
// nothing else can be asked for
for (const [b, w] of [['safari', 'page'], ['chrome', 'run'], ['../x', 'folder'], ['chrome', '']]) assert.throws(() => x.open(b, w), /Unknown/);
files.delete('C:\\Program Files\\Mozilla Firefox\\firefox.exe'); assert.throws(() => mk().open('firefox', 'page'), /does not seem to be installed/);
console.log('browserext-test: ok');
