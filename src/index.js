'use strict';

const globalShortcut = require('global-shortcut');
const BrowserWindow = require('browser-window');
const app = require('app');
const windowsWithShortcuts = new WeakMap();


function unregisterAllShortcuts(win) {
  const shortcuts = windowsWithShortcuts.get(win);
  shortcuts.forEach( sc =>
    globalShortcut.unregister(sc.accelerator)
  );
}

function unregisterAll(win) {
  if (!windowsWithShortcuts.has(win)) {
    return;
  }

  unregisterAllShortcuts(win);
  windowsWithShortcuts.delete(win);
}

function register(win, accelerator, callback) {
  if (windowsWithShortcuts.has(win)) {
    const shortcuts = windowsWithShortcuts.get(win);
    shortcuts.push({
      accelerator: accelerator,
      callback: callback
    });
  } else {
    windowsWithShortcuts.set(win, [{
      accelerator: accelerator,
      callback: callback
    }]);
  }

  if (BrowserWindow.getFocusedWindow() === win) {
    globalShortcut.register(accelerator, callback);
  }
}

function indexOfShortcut(win, accelerator) {
  if (!windowsWithShortcuts.has(win)) {
    return -1;
  }

  const shortcuts = windowsWithShortcuts.get(win);
  let shortcutToUnregisterIdx = -1;
  shortcuts.some((s, idx) => {
    if (s.accelerator === accelerator) {
      shortcutToUnregisterIdx = idx;
      return true;
    }
    return false;
  });
  return shortcutToUnregisterIdx;
}

function unregister(win, accelerator) {
  const shortcutToUnregisterIdx = indexOfShortcut(win, accelerator);

  if (shortcutToUnregisterIdx !== -1) {
    globalShortcut.unregister(accelerator);
    const shortcuts = windowsWithShortcuts.get(win);
    shortcuts.splice(shortcutToUnregisterIdx);
  }
}

function isRegistered(win, accelerator) {
  return indexOfShortcut(win, accelerator) !== -1;
}


app.on('browser-window-focus', (e, win) => {
  if (!windowsWithShortcuts.has(win)) {
    return;
  }

  const shortcuts = windowsWithShortcuts.get(win);

  shortcuts.forEach( sc =>
    globalShortcut.register(sc.accelerator, sc.callback)
  );
});

app.on('browser-window-blur', (e, win) => {
  if (!windowsWithShortcuts.has(win)) {
    return;
  }

  unregisterAllShortcuts(win);
});

module.exports = {
  register: register,
  unregister: unregister,
  isRegistered: isRegistered,
  unregisterAll: unregisterAll
};
