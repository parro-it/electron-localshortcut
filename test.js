'use strict';
const {BrowserWindow, app} = require('electron');
const test = require('tape-async');
const {appReady} = require('p-electron');
const pTimeout = require('p-timeout');

const robot = require('robotjs');

const shortcuts = require('.');

let winHolder;

const promiseForShortcutPressed = key => new Promise(resolve =>
	shortcuts.register(winHolder, key, resolve));

async function beforeAll() {
	await appReady();
	// We could create a window, because the app is ready
	winHolder = new BrowserWindow({show: false});
	winHolder.loadURL(`file://${__dirname}/example.html`);
	winHolder.show();
}

async function shortcutWasPressed(shortcutPressed) {
	return undefined === await pTimeout(shortcutPressed, 400);
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

test('app quit', t => {
	app.on('window-all-closed', () => app.quit());
	t.end();

	for (const w of BrowserWindow.getAllWindows()) {
		w.close();
	}
});
