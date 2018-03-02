'use strict';
const {BrowserWindow, app} = require('electron');
const test = require('tape-async');
const {appReady, windowVisible, windowClosed} = require('p-electron');
const pTimeout = require('p-timeout');
const delay = require('delay');

const robot = require('robotjs');

const shortcuts = require('.');

let winHolder;

test('exports an shortcuts object', async t => {
	t.is(typeof shortcuts, 'object');
});

test(
	'appReady return a promise that resolve when electron app is ready',
	beforeAll
);

test('shortcut is called on keydown only', async t => {
	let called = 0;
	shortcuts.register(winHolder, 'Alt+R', () => {
		called++;
	});
	robot.keyTap('r', ['alt']);
	await delay(400);
	shortcuts.unregister(winHolder, 'Alt+R');
	t.is(called, 1);
});

test('shortcut is called', async t => {
	const shortcutPressed = promiseForShortcutPressed('Alt+Ctrl+U');
	robot.keyTap('u', ['alt', 'control']);
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

test('app shortcut are called on every windows', async t => {
	winHolder.hide();

	const win = new BrowserWindow({show: false});
	const win2 = new BrowserWindow({show: false});

	win.loadURL(`file://${__dirname}/example.html`);
	win2.loadURL(`file://${__dirname}/example.html`);

	let called = 0;
	shortcuts.register('Alt+R', () => {
		if (called === 0) {
			win.close();
		}

		if (called === 1) {
			win2.close();
		}

		called++;
	});

	win.show();
	await windowVisible(win);

	robot.keyTap('r', ['alt']);

	await windowClosed(win);

	win2.show();
	await windowVisible(win2);

	robot.keyTap('r', ['alt']);

	await windowClosed(win2);

	winHolder.show();
	t.is(called, 2);
});

test('shortcut is not called after unregister', async t => {
	const shortcutPressed = promiseForShortcutPressed('Ctrl+A');
	shortcuts.unregister(winHolder, 'Ctrl+A');

	robot.keyTap('a', ['control']);
	const err = await shortcutWasNotPressed(shortcutPressed).catch(err => err);
	console.log(err);
	t.equal(err.message, 'Promise timed out after 400 milliseconds');
});

test('accelerator can be array of strings', async t => {
	let called = 0;
	shortcuts.register(winHolder, ['Ctrl+X', 'Ctrl+Y'], () => {
		called++;
	});

	robot.keyTap('x', ['control']);
	robot.keyTap('y', ['control']);
	await delay(400);
	shortcuts.unregister(winHolder, ['Ctrl+X', 'Ctrl+Y']);
	t.is(called, 2);
});

test('shortcuts are not called after unregister', async t => {
	const shortcutPressed = promiseForShortcutPressed(['Ctrl+X', 'Ctrl+Y']);
	shortcuts.unregister(winHolder, ['Ctrl+X', 'Ctrl+Y']);

	robot.keyTap('x', ['control']);
	robot.keyTap('y', ['control']);
	const err = await shortcutWasNotPressed(shortcutPressed).catch(err => err);
	console.log(err);
	t.equal(err.message, 'Promise timed out after 400 milliseconds');
});

test('app quit', t => {
	app.on('window-all-closed', () => app.quit());
	t.end();

	for (const w of BrowserWindow.getAllWindows()) {
		w.close();
	}
});

function promiseForShortcutPressedOnWindow(win, key) {
	const destroy = () => shortcuts.unregister(win, key);

	const result = new Promise(resolve =>
		shortcuts.register(win, key, resolve)
	).then(destroy);

	result.destroy = destroy;
	return result;
}

function promiseForShortcutPressed(key) {
	const destroy = () => shortcuts.unregister(winHolder, key);

	const result = new Promise(resolve =>
		shortcuts.register(winHolder, key, resolve)
	).then(destroy);

	result.destroy = destroy;
	return result;
}

async function beforeAll() {
	await appReady();
	// We could create a window, because the app is ready
	winHolder = new BrowserWindow();
	winHolder.loadURL(`file://${__dirname}/example.html`);
	await windowVisible(winHolder);
}

async function shortcutWasPressed(shortcutPressed) {
	return undefined === (await pTimeout(shortcutPressed, 400));
}

function shortcutWasNotPressed(shortcutPressed) {
	return pTimeout(shortcutPressed, 400).catch(err => {
		shortcutPressed.destroy();
		throw err;
	});
}
