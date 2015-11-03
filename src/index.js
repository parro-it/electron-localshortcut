const globalShortcut = require('global-shortcut');
const BrowserWindow = require('browser-window');
const windowsShortcuts = new WeakMap();

function register(window, accelerator, callback) {
  if (windowsShortcuts.has(window)) {
    const shortcuts = windowsShortcuts.get(window);
    shortcuts.push({
      accelerator: accelerator,
      callback: callback
    });
  } else {
    windowsShortcuts.set(window, [{
      accelerator: accelerator,
      callback: callback
    }]);

    window.on('focus', () => {
      const shortcuts = windowsShortcuts.get(window);
      shortcuts.forEach( sc =>
        globalShortcut.register(sc.accelerator, sc.callback)
      );
    });

    window.on('blur', () => {
      const shortcuts = windowsShortcuts.get(window);
      shortcuts.forEach( sc =>
        globalShortcut.unregister(sc.accelerator)
      );
    });
  }

  if (BrowserWindow.getFocusedWindow() === window) {
    globalShortcut.register(accelerator, callback);
  }
}

function unregister(window, accelerator) {
}

function isRegistered(window, accelerator) {
}

function unregisterAll(window) {

}

module.exports = {
  register: register,
  unregister: unregister,
  isRegistered: isRegistered,
  unregisterAll: unregisterAll
};
