'use strict';
const {globalShortcut, BrowserWindow, app} = require('electron');
const isAccelerator = require('electron-is-accelerator');

const windowsWithShortcuts = new WeakMap();

// A placeholder to register shortcuts
// on any window of the app.
const ANY_WINDOW = {};

function _registerShortcut(shortcut) {
	console.log('_registerShortcut', {shortcut});
	globalShortcut.register(shortcut.accelerator, shortcut.callback);
	shortcut.registered = true;
}

function _unregisterShortcut(shortcut) {
	console.log('_unregisterShortcut', {shortcut});
	globalShortcut.unregister(shortcut.accelerator);
	shortcut.registered = false;
}

function unregisterAllShortcuts(win) {
	const shortcuts = windowsWithShortcuts.get(win);
	if (shortcuts) {
		shortcuts.forEach(_unregisterShortcut);
	}
}

function registerAllShortcuts(win) {
	const shortcuts = windowsWithShortcuts.get(win);
	if (shortcuts) {
		shortcuts.forEach(_registerShortcut);
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

function registerWindowAndAppShortcuts(e, win) {
	if (windowsWithShortcuts.has(ANY_WINDOW)) {
		registerAllShortcuts(ANY_WINDOW);
	}

	if (!windowsWithShortcuts.has(win)) {
		return;
	}

	registerAllShortcuts(win);
}

function unregisterWindowAndAppShortcuts(e, win) {
	if (windowsWithShortcuts.has(ANY_WINDOW)) {
		unregisterAllShortcuts(ANY_WINDOW);
	}

	if (!windowsWithShortcuts.has(win)) {
		return;
	}

	unregisterAllShortcuts(win);
}

function register(win, accelerator, callback) {
	if (arguments.length === 2 && typeof win === 'string') {
		// Register shortcut for any window in the app
		// win = accelerator, accelerator = callback
		register(ANY_WINDOW, win, accelerator);
		return;
	}

	checkAccelerator(accelerator);

	const newShortcut = {accelerator, callback, registered: false};

	const _unregister = () => {
		unregisterWindowAndAppShortcuts(null, win);
	};

	const _register = () => {
		registerWindowAndAppShortcuts(null, win);
	};

	if (windowsWithShortcuts.has(win)) {
		const shortcuts = windowsWithShortcuts.get(win);
		shortcuts.push(newShortcut);
	} else {
		windowsWithShortcuts.set(win, [newShortcut]);

		if (win !== ANY_WINDOW) {
			win.on('close', _unregister);

			win.on('hide', _unregister);

			win.on('minimize', _unregister);

			win.on('restore', _register);

			win.on('show', _register);
		}
	}

	const focusedWin = BrowserWindow.getFocusedWindow();
	const registeringAppShortcut = win === ANY_WINDOW;
	const appHasFocus = focusedWin !== null;
	const registeringWindowHasFocus = focusedWin === win;

	if ((registeringAppShortcut && appHasFocus) || registeringWindowHasFocus) {
		_register();
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
		_unregisterShortcut(accelerator);
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

app.on('browser-window-focus', registerWindowAndAppShortcuts);
app.on('browser-window-blur', unregisterWindowAndAppShortcuts);

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
