const fs = require('fs');
fs.copyFileSync('../integrations/build/dedupe.js', './test/integration/dedupe.js');
fs.copyFileSync('../integrations/build/dedupe.js.map', './test/integration/dedupe.js.map');

module.exports = [
  { pattern: 'test/integration/polyfills/es6-promise-4.2.5.auto.js', included: false },
  { pattern: 'test/integration/polyfills/whatwg-fetch-3.0.0.js', included: false },
  { pattern: 'test/integration/123', included: false },
  { pattern: 'test/integration/console-logs.js', included: false },
  { pattern: 'test/integration/throw-string.js', included: false },
  { pattern: 'test/integration/throw-error.js', included: false },
  { pattern: 'test/integration/throw-object.js', included: false },
  { pattern: 'test/integration/example.json', included: false },
  { pattern: 'test/integration/frame.html', included: false },
  { pattern: 'test/integration/loader.html', included: false },
  { pattern: 'test/integration/loader-lazy-no.html', included: false },
  { pattern: 'test/integration/loader-with-no-global-init.html', included: false },
  { pattern: 'test/integration/loader-with-no-global-init-lazy-no.html', included: false },
  { pattern: 'test/integration/common.js', included: false },
  { pattern: 'src/loader.js', included: false },
  { pattern: 'test/integration/init.js', included: false },
  { pattern: 'build/bundle.js', included: false },
  { pattern: 'build/bundle.js.map', included: false },
  { pattern: 'test/integration/dedupe.js', included: false },
  { pattern: 'test/integration/dedupe.js.map', included: false },
  'test/integration/test.js',
];
