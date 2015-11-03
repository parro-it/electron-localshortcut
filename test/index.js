'use strict';

const test = require('tape-async');
const electronLocalshortcut = require('..');
const BrowserWindow = require('browser-window');
const app = require('app');
require('electron-debug')();

test('add details files', function *(t) {
  app.on('ready', () => {
    const win = new BrowserWindow({});
    const win2 = new BrowserWindow({});

    electronLocalshortcut.register(win, 'Ctrl+A', () => {
      console.log('A');
    });

    electronLocalshortcut.register(win, 'Ctrl+B', () => {
      console.log('B');
    });
    win.loadUrl('about://blank');
    win.show();

    electronLocalshortcut.register(win2, 'Ctrl+A', () => {
      console.log('A2');
    });

    electronLocalshortcut.register(win2, 'Ctrl+B', () => {
      console.log('B2');
    });
    win2.loadUrl('about://blank');
    win2.show();

  });
});

test('exit electron', t => {
  // app.quit();
  t.ok(true);
});
