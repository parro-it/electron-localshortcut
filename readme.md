# electron-localshortcut

A module to register/unregister a keyboard shortcut
locally to a BrowserWindow instance, without using a Menu.

[![NPM module](https://img.shields.io/npm/v/electron-localshortcut.svg)](https://npmjs.org/package/electron-localshortcut)
[![NPM downloads](https://img.shields.io/npm/dt/electron-localshortcut.svg)](https://npmjs.org/package/electron-localshortcut)


## Installation

```bash
npm install --save electron-localshortcut
```

## Usage

```javascript
  const electronLocalshortcut = require('electron-localshortcut');
  const BrowserWindow = require('browser-window');

  const win = new BrowserWindow();
  win.loadUrl('https://github.com');
  win.show();

  electronLocalshortcut.register(win, 'Ctrl+A', () => {
    console.log('You pressed ctrl & A');
  });

  electronLocalshortcut.register(win, 'Ctrl+B', () => {
    console.log('You pressed ctrl & B');
  });

  console.log(
    electronLocalshortcut.isRegistered(win, 'Ctrl+A')
  );      // true

  electronLocalshortcut.unregister(win, 'Ctrl+A');
  electronLocalshortcut.unregisterAll(win);


```

## Methods

The `electron-localshortcut` module has following methods:

### `register(window, accelerator, callback)`

* `window` BrowserWindow instance
* `accelerator` [Accelerator](https://github.com/atom/electron/blob/master/docs/api/accelerator.md)
* `callback` Function

Registers a shortcut of `accelerator` on the `window` BrowserWindow instance. The `callback` is called when the registered shortcut is pressed by the user, only if `window` is focused.

### `isRegistered(window, accelerator)`

* `window` BrowserWindow instance
* `accelerator` [Accelerator](https://github.com/atom/electron/blob/master/docs/api/accelerator.md)

Returns `true` or `false` depending on whether the shortcut `accelerator` is
registered on `window`.

### `unregister(window, accelerator)`

* `window` BrowserWindow instance
* `accelerator` [Accelerator](https://github.com/atom/electron/blob/master/docs/api/accelerator.md)

Unregisters the shortcut of `accelerator` registered on the BrowserWindow instance.

### `unregisterAll(window)`

* `window` BrowserWindow instance

Unregisters all of the shortcuts registered on the BrowserWindow instance.


## License

The MIT License (MIT)

Copyright (c) 2015 Andrea Parodi



