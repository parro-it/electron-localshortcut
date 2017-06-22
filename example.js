'use strict';

const {BrowserWindow, app, Menu} = require('electron');
const electronLocalshortcut = require('.');

app.on('ready', () => {
	const win = new BrowserWindow({});
	const win2 = new BrowserWindow({});

	// Should raise a warning in console
	electronLocalshortcut.register(win, 'C+C', () => {});

	electronLocalshortcut.register(win, 'CmdOrCtrl+Z', () => {
		process.stdout.write('A\n');
	});

	electronLocalshortcut.register(win, 'Ctrl+B', () => {
		process.stdout.write('B\n');
	});

	electronLocalshortcut.register(win2, 'Ctrl+A', () => {
		process.stdout.write('A2\n');
	});

	electronLocalshortcut.register(win2, 'Ctrl+B', () => {
		process.stdout.write('B2\n');
	});

	electronLocalshortcut.register(win2, 'Ctrl+C', () => {
		process.stdout.write('C2\n');
	});

	const template = [{
		label: 'test',
		submenu: [
			{
				label: 'Unregister all shortcuts',
				click() {
					electronLocalshortcut.unregisterAll(win);
				}
			}
		]
	}];

	win.setMenu(Menu.buildFromTemplate(template));
	win.loadURL('about://blank');
	win.show();

	const template2 = [{
		label: 'test',
		submenu: [{
			label: 'Unregister C2',
			click() {
				electronLocalshortcut.unregister(win2, 'Ctrl+C');
			}
		}, {
			label: 'Register unvalid shortcut',
			click() {
				electronLocalshortcut.unregister(win2, 'Ctrl+Alt');
			}
		}, {
			label: 'Register C2',
			click() {
				electronLocalshortcut.register(win2, 'Ctrl+C', () => {
					process.stdout.write('C2\n');
				});
			}
		}, {
			label: 'Disable shortcuts',
			click() {
				electronLocalshortcut.disableAll(win2);
			}
		}, {
			label: 'Enable shortcuts',
			click() {
				electronLocalshortcut.enableAll(win2);
			}
		}, {
			label: 'Check C2',
			click() {
				const isRegistered = electronLocalshortcut.isRegistered(win2, 'Ctrl+C');
				process.stdout.write(`${isRegistered}\n`);
			}
		}, {
			label: 'Check existing global shortcut',
			click() {
				electronLocalshortcut.register(win2, 'Ctrl+E', () => {
					console.log('Control E !');
				});
			}
		}]
	}, {
		label: 'test all window',
		submenu: [{
			label: 'Unregister ALL',
			click() {
				electronLocalshortcut.unregister('Alt+A');
			}
		}, {
			label: 'Unregister any ALL',
			click() {
				electronLocalshortcut.unregisterAll();
			}
		}, {
			label: 'Register ALL',
			click() {
				electronLocalshortcut.register('Alt+A', () => {
					process.stdout.write('ALL\n');
				});
			}
		}, {
			label: 'Check ALL',
			click() {
				const isRegistered = electronLocalshortcut.isRegistered('Alt+A');
				process.stdout.write(`${isRegistered}\n`);
			}
		}]
	}];

	win2.setMenu(Menu.buildFromTemplate(template2));
	win2.loadURL('about://blank');
	win2.show();
	win2.openDevTools();
	win2.webContents.executeJavaScript(`
		document.body.innerHTML = '<textarea></textarea>';
		document.addEventListener('keydown', e => {
			console.log((e.ctrlKey ? 'Ctrl + ' : '') +e.key);
		});
	`);
});
