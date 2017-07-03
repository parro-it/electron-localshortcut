'use strict';
const {BrowserWindow, app} = require('electron');
const isAccelerator = require('electron-is-accelerator');
const equals = require('keyboardevents-areequal');
const {toKeyEvent} = require('keyboardevent-from-electron-accelerator');
const insp = require('insp');
const _debug = require('debug');

const debug = _debug('electron-localshortcut');

// A placeholder to register shortcuts
// on any window of the app.
const ANY_WINDOW = {};

const shortcuts = new WeakMap();

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

}

/**
 * Enable all of the shortcuts registered on the BrowserWindow instance that you had previously disabled calling `disableAll` method.
 * @param  {BrowserWindow} win BrowserWindow instance
 * @return {Undefined}
 */
function enableAll(win) {

}

/**
 * Unregisters all of the shortcuts registered on any focused BrowserWindow instance. This method does not unregister any shortcut you registered on a particular window instance.
 * @param  {BrowserWindow} win BrowserWindow instance
 * @return {Undefined}
 */
function unregisterAll(win) {

}

/**
* Registers the shortcut `accelerator`on the BrowserWindow instance.
 * @param  {BrowserWindow} win - BrowserWindow instance to register. This argument could be omitted, in this case the function register the shortcut on all app windows.
 * @param  {String} accelerator - the shortcut to register
 * @param  {Function} callback    This function is called when the shortcut is pressed and the window is focused and not minimized.
 * @return {Undefined}
 */
function register(win, accelerator, callback) {
	debug(`Register callback for ${accelerator} on window ${win.getTitle()}`);
	_checkAccelerator(accelerator);

	const wc = win.webContents;

	let shortcutsCatalog;
	if (shortcuts.has(wc)) {
		debug(`Window has others shortcuts registered.`);
		shortcutsCatalog = shortcuts.get(wc);
	} else {
		debug(`This is the first shortcut of the window.`);
		shortcutsCatalog = [];
		shortcuts.set(wc, shortcutsCatalog);

		wc.on('before-input-event', (e, input) => {
			const electronizedEvent = {
				code: input.code,
				key: input.key
			};

			['alt', 'shift', 'meta'].forEach(prop => {
				if (typeof input[prop] !== 'undefined') {
					electronizedEvent[`${prop}Key`] = input[prop];
				}
			});

			if (typeof input.control !== 'undefined') {
				electronizedEvent.ctrlKey = input.control;
			}

			debug(insp`before-input-event: ${input} is translated to: ${electronizedEvent}`);
			for (const {eventStamp, callback} of shortcutsCatalog) {
				if (equals(eventStamp, electronizedEvent)) {
					debug(insp`eventStamp: ${eventStamp} match`);
					callback();
					return;
				}
				debug(insp`eventStamp: ${eventStamp} no match`);
			}
		});
	}

	const eventStamp = toKeyEvent(accelerator);

	shortcutsCatalog.push({eventStamp, callback});
}

/**
 * Unregisters the shortcut of `accelerator` registered on the BrowserWindow instance.
 * @param  {BrowserWindow} win - BrowserWindow instance to unregister. This argument could be omitted, in this case the function unregister the shortcut on all app windows. If you registered the shortcut on a particular window instance, it will do nothing.
 * @param  {String} accelerator - the shortcut to unregister
 * @return {Undefined}
 */
function unregister(win, accelerator) {
	_checkAccelerator(accelerator);
}

/**
 * Returns `true` or `false` depending on whether the shortcut `accelerator` is
registered on `window`.
 * @param  {BrowserWindow} win - BrowserWindow instance to check. This argument could be omitted, in this case the function returns whether the shortcut `accelerator` is registered on all app windows. If you registered the shortcut on a particular window instance, it return false.
 * @param  {String} accelerator - the shortcut to check
 * @return {Boolean} - if the shortcut `accelerator` is registered on `window`.
 */
function isRegistered(win, accelerator) {
	_checkAccelerator(accelerator);
}

module.exports = {
	register,
	unregister,
	isRegistered,

	unregisterAll,
	enableAll,
	disableAll
};
