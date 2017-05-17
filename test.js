'use strict';
const {BrowserWindow, app} = require('electron');
const test = require('tape-async');
const pTimeout = require('p-timeout');
const {appReady, focusWindow, minimizeWindow} = require('p-electron');

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

async function beforeAll() {
	await appReady();
	// We could create a window, because the app is ready
	win = new BrowserWindow();
	win.loadURL('https://example.com');
	win.show();
}

async function shortcutIsNotEnabledOnRegistering(key, win) {
	const callbackCalled = new Promise(resolve => shortcuts.register(win, key, resolve));
	mock.keypress(key);
	const err = await pTimeout(callbackCalled, 400).catch(err => err);
	return err instanceof Error && err.message === 'Promise timed out after 400 milliseconds';
}

async function shortcutIsEnabledOnRegistering(key, win) {
	const callbackCalled = new Promise(resolve => shortcuts.register(win, key, resolve));
	mock.keypress(key);
	return undefined === await pTimeout(callbackCalled, 400);
}

test('exports an shortcuts object', async t => {
	t.is(typeof shortcuts, 'object');
});

test('appReady return a promise that resolve when electron app is ready', beforeAll);

test('shortcut is enabled on registering if window is focused', async t => {
	const win2 = new BrowserWindow();
	await focusWindow(win2);
	t.true(await shortcutIsEnabledOnRegistering('Ctrl+A', win2));
	win2.close();
});

test('shortcut is not enabled on registering if window is not focused', async t => {
	const win2 = new BrowserWindow();
	await focusWindow(win);
	t.true(await shortcutIsNotEnabledOnRegistering('Ctrl+B', win2));
	win2.close();
});

test('shortcut is not enabled on registering if window is minimized', async t => {
	const win2 = new BrowserWindow();
	await focusWindow(win2);
	await minimizeWindow(win2);

	t.true(win2.isMinimized());

	t.true(await shortcutIsNotEnabledOnRegistering('Ctrl+W', win2));

	win2.close();
});

test('shortcut is not enabled on registering if window is not showed', async t => {
	const win2 = new BrowserWindow({show: false});
	t.true(await shortcutIsNotEnabledOnRegistering('Ctrl+E', win2));
	win2.close();
});

test('shortcut is not enabled on registering if window is hidden', async t => {
	const win2 = new BrowserWindow();
	t.true(win2.isVisible());
	win2.hide();
	t.false(win2.isVisible());
	t.true(await shortcutIsNotEnabledOnRegistering('Ctrl+R', win2));
	win2.close();
});

test('app quit', t => {
	app.on('window-all-closed', () => app.quit());
	t.end();

	for (const w of BrowserWindow.getAllWindows()) {
		w.close();
	}
});
