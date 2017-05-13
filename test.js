'use strict';
const {BrowserWindow, app} = require('electron');
const test = require('tape-async');
const pEvent = require('p-event');
const delay = require('delay');
const pTimeout = require('p-timeout');

const shortcuts = require('.');

let win;
const mock = createMock();

function createMock() {
	const shortcutsRegister = {};

	const enableShortcut = shortcut => {
		shortcutsRegister[shortcut.accelerator] = shortcut.callback;
	};

	const disableShortcut = shortcut => {
		delete shortcutsRegister[shortcut.accelerator];
	};

	const keypress = keys => {
		const shortcut = shortcutsRegister[keys];
		if (shortcut) {
			shortcut();
		}
	};

	shortcuts.__mockup(enableShortcut, disableShortcut);

	return {keypress};
}

function appReady() {
	if (app.isReady()) {
		return Promise.resolve();
	}
	return pEvent(app, 'ready');
}

test('exports an appReady function', async t => {
	t.is(typeof shortcuts, 'object');
});

test('appReady return a promise that resolve when electron app is ready', async () => {
	await appReady();
	// We could create a window, because the app is ready
	win = new BrowserWindow();
	win.loadURL('https://example.com');
	win.show();
});

test('shortcut is enabled on registering if window is focused', async t => {
	const win2 = new BrowserWindow();
	win2.focus();
	await delay(100);

	const callbackCalled = new Promise(resolve => shortcuts.register(win2, 'Ctrl+A', resolve));
	mock.keypress('Ctrl+A');
	t.is(await pTimeout(callbackCalled, 100), undefined);
	win2.close();
});

test('shortcut is not enabled on registering if window is not focused', async t => {
	const win2 = new BrowserWindow();
	const callbackCalled = new Promise(resolve => shortcuts.register(win2, 'Ctrl+A', resolve));
	mock.keypress('Ctrl+A');
	const err = await pTimeout(callbackCalled, 200).catch(err => err);
	t.is(err.message, 'Promise timed out after 200 milliseconds');
	win2.close();
});

test('app quit', t => {
	app.on('window-all-closed', () => app.quit());
	t.end();
	win.close();
});
