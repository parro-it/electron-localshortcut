const test = require('tape-async');
const electronLocalshortcut = require('..');

test('add details files', function *(t) {
  const result = yield electronLocalshortcut();
  t.equal(result, 42);
});
