'use strict';
const {BrowserWindow, app} = require('electron');
const test = require('tape-async');
const pTimeout = require('p-timeout');
const {appReady, focusWindow, minimizeWindow, restoreWindow, windowVisible} = require('p-electron');

const shortcuts = require('.');

let winHolder;
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
	winHolder = new BrowserWindow({show: false});
	winHolder.loadURL('https://example.com');
	winHolder.show();
}

const promiseForShortcutPressed = (win, key) => new Promise(resolve => shortcuts.register(win, key, resolve));
const promiseForAppShortcutPressed = key => new Promise(resolve => shortcuts.register(key, resolve));

async function shortcutWasPressed(shortcutPressed) {
	return undefined === await pTimeout(shortcutPressed, 400);
}

async function shortcutWasNotPressed(shortcutPressed) {
	const err = await pTimeout(shortcutPressed, 400).catch(err => err);
	return err instanceof Error && err.message === 'Promise timed out after 400 milliseconds';
}

async function shortcutIsNotEnabledOnRegistering(key, win) {
	const shortcutPressed = promiseForShortcutPressed(win, key);
	mock.keypress(key);
	return shortcutWasNotPressed(shortcutPressed);
}

async function shortcutIsEnabledOnRegistering(key, win) {
	const shortcutPressed = promiseForShortcutPressed(win, key);
	mock.keypress(key);
	return shortcutWasPressed(shortcutPressed);
}

async function appShortcutIsNotEnabledOnRegistering(key) {
	const shortcutPressed = promiseForAppShortcutPressed(key);
	mock.keypress(key);
	return shortcutWasNotPressed(shortcutPressed);
}

async function appShortcutIsEnabledOnRegistering(key) {
	const shortcutPressed = promiseForAppShortcutPressed(key);
	mock.keypress(key);
	return shortcutWasPressed(shortcutPressed);
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
	const win2 = new BrowserWindow({show: false});
	win2.showInactive();
	await windowVisible(win2);
	t.true(await shortcutIsNotEnabledOnRegistering('Ctrl+B', win2));
	win2.close();
});

test('shortcut is not enabled on registering if window is minimized', async t => {
	const win2 = new BrowserWindow();
	await focusWindow(win2);
	await minimizeWindow(win2);
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
	win2.hide();
	t.true(await shortcutIsNotEnabledOnRegistering('Ctrl+R', win2));
	win2.close();
});

test('shortcut is not enabled on registering if window is never showed, but minimized and restored', async t => {
	const win2 = new BrowserWindow({show: false});
	await minimizeWindow(win2);
	await restoreWindow(win2);
	t.true(await shortcutIsNotEnabledOnRegistering('Ctrl+J', win2));
	win2.close();
});

test('app shortcut is enabled on registering if window is focused', async t => {
	const win2 = new BrowserWindow();
	await focusWindow(win2);
	t.true(await appShortcutIsEnabledOnRegistering('Ctrl+D'));
	win2.close();
});

test('app shortcut is not enabled on registering if window is not focused', async t => {
	const win2 = new BrowserWindow({show: false});
	winHolder.hide();
	win2.showInactive();
	await windowVisible(win2);
	t.true(await appShortcutIsNotEnabledOnRegistering('Ctrl+E'));
	win2.close();
	winHolder.show();
});

test('app shortcut is not enabled on registering if window is minimized', async t => {
	const win2 = new BrowserWindow();
	await focusWindow(win2);
	await minimizeWindow(win2);
	t.true(await appShortcutIsNotEnabledOnRegistering('Ctrl+I'));
	win2.close();
});

test('app shortcut is not enabled on registering if window is not showed', async t => {
	winHolder.hide();
	const win2 = new BrowserWindow({show: false});
	t.true(await appShortcutIsNotEnabledOnRegistering('Ctrl+L'));
	win2.close();
	winHolder.show();
});

test('app shortcut is not enabled on registering if window is hidden', async t => {
	const win2 = new BrowserWindow();
	winHolder.hide();
	win2.hide();
	t.true(await appShortcutIsNotEnabledOnRegistering('Ctrl+M'));
	win2.close();
	winHolder.show();
});

test('app shortcut is not enabled on registering if window is never showed, but minimized and restored', async t => {
	winHolder.hide();
	const win2 = new BrowserWindow({show: false});
	await minimizeWindow(win2);
	await restoreWindow(win2);
	t.true(await appShortcutIsNotEnabledOnRegistering('Ctrl+N'));
	win2.close();
	winHolder.show();
});

test('app quit', t => {
	app.on('window-all-closed', () => app.quit());
	t.end();

	for (const w of BrowserWindow.getAllWindows()) {
		w.close();
	}
});
