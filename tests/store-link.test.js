const test = require('node:test');
const assert = require('node:assert/strict');
const store = require('../assets/store-link.js');

const iosSafari =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) ' +
  'AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
const instagramIOS = iosSafari + ' Instagram 390.0.0.0';
const threadsIOS = iosSafari + ' Barcelona 390.0.0.0';
const facebookIOS = iosSafari + ' [FBAN/FBIOS;FBAV/520.0.0.0]';
const messengerIOS = iosSafari + ' FB_IAB/MESSENGER';
const tiktokIOS = iosSafari + ' musical_ly_39.0.0';
const androidWebView =
  'Mozilla/5.0 (Linux; Android 15; Pixel 9 Build/AP3A; wv) ' +
  'AppleWebKit/537.36 Version/4.0 Chrome/130.0 Mobile Safari/537.36';
const unmarkedAndroidWebView =
  'Mozilla/5.0 (Linux; Android 12; Pixel 6 Build/SQ3A) ' +
  'AppleWebKit/537.36 Version/4.0 Chrome/99.0 Mobile Safari/537.36';

test('detects iOS and Android', () => {
  assert.equal(store.isIOS(iosSafari), true);
  assert.equal(store.isAndroid(androidWebView), true);
  assert.equal(store.isAndroid(iosSafari), false);
});

test('detects Instagram and Threads in-app browsers', () => {
  assert.equal(store.isInstagramInApp(instagramIOS), true);
  assert.equal(store.isInstagramInApp(threadsIOS), true);
  assert.equal(store.isInstagramInApp(iosSafari), false);
});

test('detects Facebook and Messenger in-app browsers', () => {
  assert.equal(store.isFacebookInApp(facebookIOS), true);
  assert.equal(store.isFacebookInApp(messengerIOS), true);
  assert.equal(store.isFacebookInApp(iosSafari), false);
});

test('detects other embedded browsers without flagging Safari', () => {
  assert.equal(store.isInAppBrowser(tiktokIOS), true);
  assert.equal(store.isInAppBrowser(androidWebView), true);
  assert.equal(store.isInAppBrowser(unmarkedAndroidWebView), true);
  assert.equal(store.isInAppBrowser(iosSafari), false);
});
