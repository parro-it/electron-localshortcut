# electron-localshortcut

A module to register/unregister a keyboard shortcut
locally to a BrowserWindow instance, without using a Menu.

This is built to circumvent [this Electron issue](https://github.com/atom/electron/issues/1334).

**Note:** Since this module internally use `global-shortcut` native module, you should not use it until the `ready` event of the app module is emitted. See [electron docs](http://electron.atom.io/docs/latest/api/global-shortcut/).

[![Travis Build Status](https://img.shields.io/travis/parro-it/electron-localshortcut.svg)](http://travis-ci.org/parro-it/electron-localshortcut)
[![NPM module](https://img.shields.io/npm/v/electron-localshortcut.svg)](https://npmjs.org/package/electron-localshortcut)
[![NPM downloads](https://img.shields.io/npm/dt/electron-localshortcut.svg)](https://npmjs.org/package/electron-localshortcut)


## Installation

```bash
npm install --save electron-localshortcut
```

## Usage

```javascript
  const electronLocalshortcut = require('electron-localshortcut');
  const BrowserWindow = require('electron').BrowserWindow;

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

### `disableAll(window)`

* `window` BrowserWindow instance

Disable all of the shortcuts registered on the BrowserWindow instance.
Registered shortcuts no more works on the `window` instance, but the module keep a reference on them. You can reactivate them later by calling `enableAll` method on the same window instance.

### `enableAll(window)`

* `window` BrowserWindow instance

Enable all of the shortcuts registered on the BrowserWindow instance that you had previously disabled calling `disableAll` method.


## Global shortcuts

This set of methods allow you to manage shortcuts that work on any window of your app. They are active only when a window in the app is focused.

They differ from native [global-shortcuts](https://github.com/atom/electron/blob/master/docs/api/global-shortcut.md) because they doesn't interfere with other apps running on the same machine.

### `register(accelerator, callback)`

* `accelerator` [Accelerator](https://github.com/atom/electron/blob/master/docs/api/accelerator.md)
* `callback` Function

Registers a shortcut of `accelerator` on any focused BrowserWindow instance. The `callback` is called when the registered shortcut is pressed by the user, only if a BrowserWindow is focused.

### `isRegistered(accelerator)`

* `accelerator` [Accelerator](https://github.com/atom/electron/blob/master/docs/api/accelerator.md)

Returns `true` or `false` depending on whether the shortcut `accelerator` is registered on all focused instances. If you registered the shortcut on a particular instance, this method
return false.

### `unregister(accelerator)`

* `accelerator` [Accelerator](https://github.com/atom/electron/blob/master/docs/api/accelerator.md)

Unregisters the shortcut of `accelerator` registered on all focused instances. This method does not unregister any shortcut you
registered on a particular window instance.

### `unregisterAll()`

Unregisters all of the shortcuts registered on any focused BrowserWindow instance. This method does not unregister any shortcut you registered on a particular window instance.

## License

The MIT License (MIT)

Copyright (c) 2015 Andrea Parodi



