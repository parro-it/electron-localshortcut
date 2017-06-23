'use strict';
const {globalShortcut, BrowserWindow, app} = require('electron');
const isAccelerator = require('electron-is-accelerator');
const _debug = require('debug');

const debug = _debug('electron-localshortcut');
const windowsWithShortcuts = new WeakMap();

// A placeholder to register shortcuts
// on any window of the app.
const ANY_WINDOW = {};

let _enableShortcut = shortcut => {
	debug(`Calling globalShortcut.register(${shortcut.accelerator}, ${shortcut.callback.name})`);
	globalShortcut.register(shortcut.accelerator, shortcut.callback);
	shortcut.registered = true;
};

let _disableShortcut = shortcut => {
	debug(`Calling globalShortcut.unregister(${shortcut.accelerator})`);
	globalShortcut.unregister(shortcut.accelerator);
	shortcut.registered = false;
};

function __mockup(enableShortcut, disableShortcut) {
	_enableShortcut = enableShortcut;
	_disableShortcut = disableShortcut;
}

function _enableWindowAndApp(win) {
	debug(`_enableWindowAndApp ${win.getTitle && win.getTitle()}`);
	if (windowsWithShortcuts.has(ANY_WINDOW)) {
		enableAll(ANY_WINDOW);
	}

	if (!windowsWithShortcuts.has(win)) {
		return;
	}

	enableAll(win);
}

function _disableWindowAndApp(win) {
	debug(`_disableWindowAndApp ${win.getTitle && win.getTitle()}`);
	if (windowsWithShortcuts.has(ANY_WINDOW)) {
		disableAll(ANY_WINDOW);
	}

	if (!windowsWithShortcuts.has(win)) {
		return;
	}

	disableAll(win);
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

/**
 * Disable all of the shortcuts registered on the BrowserWindow instance.
Registered shortcuts no more works on the `window` instance, but the module keep a reference on them. You can reactivate them later by calling `enableAll` method on the same window instance.
 * @param  {BrowserWindow} win BrowserWindow instance
 * @return {Undefined}
 */
function disableAll(win) {
	const shortcuts = windowsWithShortcuts.get(win);
	if (shortcuts) {
		shortcuts.forEach(_disableShortcut);
	}
}

/**
 * Enable all of the shortcuts registered on the BrowserWindow instance that you had previously disabled calling `disableAll` method.
 * @param  {BrowserWindow} win BrowserWindow instance
 * @return {Undefined}
 */
function enableAll(win) {
	const shortcuts = windowsWithShortcuts.get(win);
	if (shortcuts) {
		shortcuts.forEach(_enableShortcut);
	}
}

/**
 * Unregisters all of the shortcuts registered on any focused BrowserWindow instance. This method does not unregister any shortcut you registered on a particular window instance.
 * @param  {BrowserWindow} win BrowserWindow instance
 * @return {Undefined}
 */
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

/**
* Registers the shortcut `accelerator`on the BrowserWindow instance.
 * @param  {BrowserWindow} win - BrowserWindow instance to register. This argument could be omitted, in this case the function register the shortcut on all app windows.
 * @param  {String} accelerator - the shortcut to register
 * @param  {Function} callback    This function is called when the shortcut is pressed and the window is focused and not minimized.
 * @return {Undefined}
 */
function register(win, accelerator, callback) {
	if (arguments.length === 2 && typeof win === 'string') {
		// Register shortcut for any window in the app
		// win = accelerator, accelerator = callback
		register(ANY_WINDOW, win, accelerator);
		return;
	}

	_checkAccelerator(accelerator);

	const newShortcut = {accelerator, callback, registered: false};

	const _unregister = because => () => {
		debug(`Disabling shortcuts for app and for window '${(win.getTitle && win.getTitle()) || 'No name'}' because ${because}.`);
		_disableWindowAndApp(win);
	};

	const _register = because => () => {
		debug(`Enabling shortcuts for app and for window '${(win.getTitle && win.getTitle()) || 'No name'}' because ${because}.`);
		_enableWindowAndApp(win);
	};

	if (windowsWithShortcuts.has(win)) {
		const shortcuts = windowsWithShortcuts.get(win);
		shortcuts.push(newShortcut);
	} else {
		windowsWithShortcuts.set(win, [newShortcut]);

		if (win !== ANY_WINDOW) {
			win.on('close', _unregister('the window was closed.'));

			win.on('hide', _unregister('the window was hidden.'));

			win.on('minimize', _unregister('the window was minimized.'));

			win.on('restore', _register('the window was restored from minimized state.'));

			win.on('show', _register('the window was showed.'));
		}
	}

	const focusedWin = BrowserWindow.getFocusedWindow();
	const registeringAppShortcut = win === ANY_WINDOW;
	const appHasFocus = focusedWin !== null && focusedWin.isVisible();
	const registeringWindowHasFocus = focusedWin === win;
	const registeringWindowIsMinimized = () => focusedWin.isMinimized();

	if ((registeringAppShortcut && appHasFocus) ||
		(registeringWindowHasFocus && !registeringWindowIsMinimized())) {
		_register('the window was focused at shortcut registration.');
	}
}

/**
 * Unregisters the shortcut of `accelerator` registered on the BrowserWindow instance.
 * @param  {BrowserWindow} win - BrowserWindow instance to unregister. This argument could be omitted, in this case the function unregister the shortcut on all app windows. If you registered the shortcut on a particular window instance, it will do nothing.
 * @param  {String} accelerator - the shortcut to unregister
 * @return {Undefined}
 */
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

/**
 * Returns `true` or `false` depending on whether the shortcut `accelerator` is
registered on `window`.
 * @param  {BrowserWindow} win - BrowserWindow instance to check. This argument could be omitted, in this case the function returns whether the shortcut `accelerator` is registered on all app windows. If you registered the shortcut on a particular window instance, it return false.
 * @param  {String} accelerator - the shortcut to check
 * @return {Boolean} - if the shortcut `accelerator` is registered on `window`.
 */
function isRegistered(win, accelerator) {
	if (arguments.length === 1 && typeof win === 'string') {
		// Check shortcut for any window in the app
		// win = accelerator
		return isRegistered(ANY_WINDOW, win);
	}

	_checkAccelerator(accelerator);

	return _indexOfShortcut(win, accelerator) !== -1;
}

const windowBlur = because => (_, win) => {
	debug(`Disabling shortcuts for app and for window '${(win.getTitle && win.getTitle()) || 'No name'}' because ${because}.`);
	_disableWindowAndApp(win);
};

const windowFocus = because => (_, win) => {
	debug(`Enabling shortcuts for app and for window '${(win.getTitle && win.getTitle()) || 'No name'}' because ${because}.`);
	_enableWindowAndApp(win);
};

app.on('browser-window-focus', windowFocus('the window gained focus'));
app.on('browser-window-blur', windowBlur('the window loose focus'));

// All shortcuts should be unregistered by closing the window.
// just for double check
app.on('window-all-closed', unregisterAll);

module.exports = {
	register,
	unregister,
	isRegistered,
	unregisterAll,
	enableAll,
	disableAll,
	__mockup
};
