'use strict';
const electron = require('electron');
const isAccelerator = require('electron-is-accelerator');

const globalShortcut = electron.globalShortcut;
const BrowserWindow = electron.BrowserWindow;
const app = electron.app;
const windowsWithShortcuts = new WeakMap();

// A placeholder to register shortcuts
// on any window of the app.
const ANY_WINDOW = {};

function unregisterAllShortcuts(win) {
	const shortcuts = windowsWithShortcuts.get(win);
	if (shortcuts) {
		shortcuts.forEach(sc =>
			globalShortcut.unregister(sc.accelerator)
		);
	}
}

function registerAllShortcuts(win) {
	const shortcuts = windowsWithShortcuts.get(win);
	if (shortcuts) {
		shortcuts.forEach(sc =>
			globalShortcut.register(sc.accelerator, sc.callback)
		);
	}
}

function unregisterAll(win) {
	if (win === undefined) {
		// Unregister shortcuts for any window in the app
		unregisterAll(ANY_WINDOW);
		return;
	}

	if (!windowsWithShortcuts.has(win)) {
		return;
	}

	unregisterAllShortcuts(win);
	windowsWithShortcuts.delete(win);
}

function register(win, accelerator, callback) {
	if (arguments.length === 2 && typeof win === 'string') {
		// Register shortcut for any window in the app
		// win = accelerator, accelerator = callback
		register(ANY_WINDOW, win, accelerator);
		return;
	}

	checkAccelerator(accelerator);

	if (windowsWithShortcuts.has(win)) {
		const shortcuts = windowsWithShortcuts.get(win);
		shortcuts.push({
			accelerator,
			callback
		});
	} else {
		windowsWithShortcuts.set(win, [{
			accelerator,
			callback
		}]);
		win.on('close', () => {
			unregisterAllShortcuts(win);
		});
	}

	const focusedWin = BrowserWindow.getFocusedWindow();
	if ((win === ANY_WINDOW && focusedWin !== null) || focusedWin === win) {
		globalShortcut.register(accelerator, callback);
	}
}

function indexOfShortcut(win, accelerator) {
	if (!windowsWithShortcuts.has(win)) {
		return -1;
	}
	checkAccelerator(accelerator);

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

function checkAccelerator(accelerator) {
	if (!isAccelerator(accelerator)) {
		const w = {};
		Error.captureStackTrace(w);
		const msg = `
WARNING: ${accelerator} is not a valid accelerator.

${w.stack.split('\n').slice(4).join('\n')}
`;
		console.error(msg);
	}
}

function unregister(win, accelerator) {
	if (arguments.length === 1 && typeof win === 'string') {
		// Unregister shortcut for any window in the app
		// win === accelerator
		unregister(ANY_WINDOW, win);
		return;
	}

	checkAccelerator(accelerator);

	const shortcutToUnregisterIdx = indexOfShortcut(win, accelerator);

	if (shortcutToUnregisterIdx !== -1) {
		globalShortcut.unregister(accelerator);
		const shortcuts = windowsWithShortcuts.get(win);
		shortcuts.splice(shortcutToUnregisterIdx, 1);
	}
}

function isRegistered(win, accelerator) {
	if (arguments.length === 1 && typeof win === 'string') {
		// Check shortcut for any window in the app
		// win = accelerator
		return isRegistered(ANY_WINDOW, win);
	}

	checkAccelerator(accelerator);

	return indexOfShortcut(win, accelerator) !== -1;
}

app.on('browser-window-focus', (e, win) => {
	if (windowsWithShortcuts.has(ANY_WINDOW)) {
		registerAllShortcuts(ANY_WINDOW);
	}

	if (!windowsWithShortcuts.has(win)) {
		return;
	}

	registerAllShortcuts(win);
});

app.on('browser-window-blur', (e, win) => {
	if (windowsWithShortcuts.has(ANY_WINDOW)) {
		unregisterAllShortcuts(ANY_WINDOW);
	}

	if (!windowsWithShortcuts.has(win)) {
		return;
	}

	unregisterAllShortcuts(win);
});

// All shortcuts should be unregistered by closing the window.
// just for double check
app.on('window-all-closed', () => {
	unregisterAll();
});

module.exports = {
	register,
	unregister,
	isRegistered,
	unregisterAll,
	enableAll: registerAllShortcuts,
	disableAll: unregisterAllShortcuts
};
