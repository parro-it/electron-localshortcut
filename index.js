'use strict';
const {globalShortcut, BrowserWindow, app} = require('electron');
const isAccelerator = require('electron-is-accelerator');

const windowsWithShortcuts = new WeakMap();

// A placeholder to register shortcuts
// on any window of the app.
const ANY_WINDOW = {};

function _enableShortcut(shortcut) {
	console.log('_enableShortcut', {shortcut});
	globalShortcut.register(shortcut.accelerator, shortcut.callback);
	shortcut.registered = true;
}

function _disableShortcut(shortcut) {
	console.log('_disableShortcut', {shortcut});
	globalShortcut.unregister(shortcut.accelerator);
	shortcut.registered = false;
}

function _enableWindowAndApp(win) {
	if (windowsWithShortcuts.has(ANY_WINDOW)) {
		enableAll(ANY_WINDOW);
	}

	if (!windowsWithShortcuts.has(win)) {
		return;
	}

	enableAll(win);
}

function _disableWindowAndApp(win) {
	if (windowsWithShortcuts.has(ANY_WINDOW)) {
		disableAll(ANY_WINDOW);
	}

	if (!windowsWithShortcuts.has(win)) {
		return;
	}

	disableAll(win);
}

function disableAll(win) {
	const shortcuts = windowsWithShortcuts.get(win);
	if (shortcuts) {
		shortcuts.forEach(_disableShortcut);
	}
}

function enableAll(win) {
	const shortcuts = windowsWithShortcuts.get(win);
	if (shortcuts) {
		shortcuts.forEach(_enableShortcut);
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

	disableAll(win);
	windowsWithShortcuts.delete(win);
}

function register(win, accelerator, callback) {
	if (arguments.length === 2 && typeof win === 'string') {
		// Register shortcut for any window in the app
		// win = accelerator, accelerator = callback
		register(ANY_WINDOW, win, accelerator);
		return;
	}

	_checkAccelerator(accelerator);

	const newShortcut = {accelerator, callback, registered: false};

	const _unregister = () => {
		_disableWindowAndApp(win);
	};

	const _register = () => {
		_enableWindowAndApp(win);
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

function _indexOfShortcut(win, accelerator) {
	if (!windowsWithShortcuts.has(win)) {
		return -1;
	}
	_checkAccelerator(accelerator);

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

function _checkAccelerator(accelerator) {
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

	_checkAccelerator(accelerator);

	const shortcutToUnregisterIdx = _indexOfShortcut(win, accelerator);

	if (shortcutToUnregisterIdx !== -1) {
		_disableShortcut(accelerator);
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

	_checkAccelerator(accelerator);

	return _indexOfShortcut(win, accelerator) !== -1;
}

app.on('browser-window-focus', (_, win) => _enableWindowAndApp(win));
app.on('browser-window-blur', (_, win) => _disableWindowAndApp(win));

// All shortcuts should be unregistered by closing the window.
// just for double check
app.on('window-all-closed', unregisterAll);

module.exports = {
	register,
	unregister,
	isRegistered,
	unregisterAll,
	enableAll,
	disableAll
};
