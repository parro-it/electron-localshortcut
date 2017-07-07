'use strict';
const {BrowserWindow, app} = require('electron');
const test = require('tape-async');
const {appReady, windowVisible, windowClosed} = require('p-electron');
const pTimeout = require('p-timeout');
const delay = require('delay');

const robot = require('robotjs');

const shortcuts = require('.');

let winHolder;

const promiseForShortcutPressedOnWindow = (win, key) => new Promise(resolve =>
	shortcuts.register(win, key, resolve));

const promiseForShortcutPressed = key => new Promise(resolve =>
	shortcuts.register(winHolder, key, resolve));

async function beforeAll() {
	await appReady();
	// We could create a window, because the app is ready
	winHolder = new BrowserWindow();
	winHolder.loadURL(`file://${__dirname}/example.html`);
	await windowVisible(winHolder);
}

async function shortcutWasPressed(shortcutPressed) {
	return undefined === await pTimeout(shortcutPressed, 400);
}

function shortcutWasNotPressed(shortcutPressed) {
	return pTimeout(shortcutPressed, 400);
}

test('exports an shortcuts object', async t => {
	t.is(typeof shortcuts, 'object');
});

test('appReady return a promise that resolve when electron app is ready', beforeAll);

test('shortcut is called', async t => {
	const shortcutPressed = promiseForShortcutPressed('Alt+A');
	robot.keyTap('a', ['alt']);
	t.true(await shortcutWasPressed(shortcutPressed));
});

test('shortcut is not called on closed windows', async t => {
	const win = new BrowserWindow();
	win.loadURL(`file://${__dirname}/example.html`);
	await windowVisible(win);
	const shortcutPressed = promiseForShortcutPressedOnWindow(win, 'Ctrl+A');

	win.close();
	await windowClosed(win);

	robot.keyTap('a', ['control']);
	const err = await shortcutWasNotPressed(shortcutPressed).catch(err => err);
	t.equal(err.message, 'Promise timed out after 400 milliseconds');
});

test('shortcut is not called after unregistration', async t => {
	const shortcutPressed = promiseForShortcutPressed('Ctrl+A');
	shortcuts.unregister(winHolder, 'Ctrl+A');

	robot.keyTap('a', ['control']);
	const err = await shortcutWasNotPressed(shortcutPressed).catch(err => err);
	t.equal(err.message, 'Promise timed out after 400 milliseconds');
});

test('shortcut is called on keydown only', async t => {
	let called = 0;
	shortcuts.register(winHolder, 'Ctrl+A', () => {
		called++;
	});

	robot.keyTap('a', ['control']);
	await delay(400);
	t.is(called, 1);
});

test('app quit', t => {
	app.on('window-all-closed', () => app.quit());
	t.end();

	for (const w of BrowserWindow.getAllWindows()) {
		w.close();
	}
});
