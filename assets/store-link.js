(function (root, factory) {
  var api = factory(root);

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.JourneyStore = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';

  var IOS_STORE_URL =
    'https://apps.apple.com/ua/app/journeykeep-daily-sidequests/id6749665109?l=ru';
  var ANDROID_PACKAGE = 'com.journeykeep.app';
  var ANDROID_STORE_URL =
    'https://play.google.com/store/apps/details?id=' + ANDROID_PACKAGE;
  var FALLBACK_DELAY = 1500;

  function getUA(ua) {
    if (typeof ua === 'string') return ua;
    return root.navigator && root.navigator.userAgent
      ? root.navigator.userAgent
      : '';
  }

  function isIOS(ua) {
    var value = getUA(ua);
    var navigator = root.navigator || {};

    return /iPad|iPhone|iPod/i.test(value)
      || (typeof ua !== 'string'
        && navigator.platform === 'MacIntel'
        && navigator.maxTouchPoints > 1);
  }

  function isAndroid(ua) {
    return /Android/i.test(getUA(ua));
  }

  function isInstagramInApp(ua) {
    return /Instagram|Barcelona/i.test(getUA(ua));
  }

  function isFacebookInApp(ua) {
    return /FBAN|FBAV|FB_IAB|Messenger/i.test(getUA(ua));
  }

  function isInAppBrowser(ua) {
    var value = getUA(ua);

    return isInstagramInApp(ua)
      || isFacebookInApp(ua)
      || /TikTok|BytedanceWebview|musical_ly|;\s*wv\)|\bwv\b/i.test(value)
      || (/Android/i.test(value)
        && /Version\/4\.0.*Chrome/i.test(value));
  }

  function platformFor(element) {
    var requested = element && element.getAttribute('data-store');
    if (requested === 'ios' || requested === 'android') return requested;
    if (isAndroid()) return 'android';
    return 'ios';
  }

  function storeUrlFor(platform) {
    return platform === 'android' ? ANDROID_STORE_URL : IOS_STORE_URL;
  }

  function manualSteps() {
    if (isInstagramInApp()) {
      return 'Tap the ••• menu, then choose “Open in external browser.”';
    }

    if (isFacebookInApp()) {
      return 'Tap the ••• menu, then choose “Open in browser.”';
    }

    return 'Open this page in Safari or Chrome, then tap the download button again.';
  }

  function ensureModal() {
    var document = root.document;
    var existing = document.getElementById('store-fallback-modal');
    if (existing) return existing;

    var modal = document.createElement('div');
    modal.id = 'store-fallback-modal';
    modal.className = 'store-modal';
    modal.hidden = true;
    modal.innerHTML =
      '<div class="store-modal__backdrop" data-store-close></div>' +
      '<section class="store-modal__panel" role="dialog" aria-modal="true" ' +
        'aria-labelledby="store-modal-title">' +
        '<button class="store-modal__close" type="button" aria-label="Close" data-store-close>×</button>' +
        '<img class="store-modal__icon" src="/assets/icon.png" alt="">' +
        '<h2 id="store-modal-title">Open Journey in the app store</h2>' +
        '<p class="store-modal__steps"></p>' +
        '<button class="store-modal__retry" type="button">Try again</button>' +
        '<button class="store-modal__copy" type="button">Copy store link</button>' +
        '<p class="store-modal__message" role="status" aria-live="polite"></p>' +
      '</section>';

    document.body.appendChild(modal);
    modal.querySelectorAll('[data-store-close]').forEach(function (button) {
      button.addEventListener('click', hideFallback);
    });

    return modal;
  }

  function hideFallback() {
    var modal = root.document.getElementById('store-fallback-modal');
    if (!modal) return;
    modal.hidden = true;
    root.document.body.classList.remove('store-modal-open');
  }

  function copyLink(url, message) {
    if (root.navigator.clipboard && root.navigator.clipboard.writeText) {
      root.navigator.clipboard.writeText(url).then(function () {
        message.textContent = 'Store link copied.';
      }).catch(function () {
        message.textContent = 'Press and hold the download button to copy its link.';
      });
      return;
    }

    var input = root.document.createElement('textarea');
    input.value = url;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    root.document.body.appendChild(input);
    input.select();

    try {
      root.document.execCommand('copy');
      message.textContent = 'Store link copied.';
    } catch (error) {
      message.textContent = 'Press and hold the download button to copy its link.';
    }

    input.remove();
  }

  function showFallback(platform) {
    var modal = ensureModal();
    var url = storeUrlFor(platform);
    var message = modal.querySelector('.store-modal__message');

    modal.querySelector('.store-modal__steps').textContent = manualSteps();
    message.textContent = '';
    modal.querySelector('.store-modal__retry').onclick = function () {
      hideFallback();
      openStore(platform);
    };
    modal.querySelector('.store-modal__copy').onclick = function () {
      copyLink(url, message);
    };

    modal.hidden = false;
    root.document.body.classList.add('store-modal-open');
    modal.querySelector('.store-modal__retry').focus();
  }

  function watchForAppSwitch(platform, delay, onFailure) {
    var switched = false;
    var events = ['visibilitychange', 'pagehide', 'blur'];

    function markSwitched(event) {
      if (event.type === 'visibilitychange' && !root.document.hidden) return;
      switched = true;
      cleanup();
    }

    function cleanup() {
      events.forEach(function (eventName) {
        var target = eventName === 'visibilitychange' ? root.document : root;
        target.removeEventListener(eventName, markSwitched);
      });
    }

    events.forEach(function (eventName) {
      var target = eventName === 'visibilitychange' ? root.document : root;
      target.addEventListener(eventName, markSwitched, { once: true });
    });

    root.setTimeout(function () {
      cleanup();
      if (!switched) {
        (onFailure || showFallback)(platform);
      }
    }, delay || FALLBACK_DELAY);
  }

  function escapeToStore(platform) {
    if (platform === 'android') {
      root.location.href = 'market://details?id=' + ANDROID_PACKAGE;
      return;
    }

    if (isInstagramInApp()) {
      root.location.href =
        'instagram://extbrowser/?url=' + encodeURIComponent(IOS_STORE_URL);
      return;
    }

    if (isFacebookInApp()) {
      root.open('x-safari-' + IOS_STORE_URL, '_blank');
      return;
    }

    root.location.href = IOS_STORE_URL;
  }

  function openStore(platform, options) {
    var selectedPlatform = platform || (isAndroid() ? 'android' : 'ios');
    var settings = options || {};

    watchForAppSwitch(
      selectedPlatform,
      settings.fallbackDelay,
      settings.onFailure
    );
    // Keep this call synchronous: iOS drops custom schemes after await/setTimeout.
    escapeToStore(selectedPlatform);
  }

  function enhanceLink(link) {
    if (link.dataset.storeReady === 'true') return;
    link.dataset.storeReady = 'true';

    link.addEventListener('click', function (event) {
      if (!isInAppBrowser()) return;

      event.preventDefault();
      openStore(platformFor(link));
    });
  }

  function bindStoreLinks(scope) {
    var container = scope || root.document;
    container.querySelectorAll('a[data-store]').forEach(enhanceLink);
  }

  function init() {
    bindStoreLinks();

    if (isIOS()) {
      root.document.querySelectorAll('a[data-store="android"]').forEach(function (link) {
        link.hidden = true;
      });
    } else if (isAndroid()) {
      root.document.querySelectorAll('a[data-store="ios"]').forEach(function (link) {
        link.hidden = true;
      });
    }
  }

  if (root.document) {
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  return {
    IOS_STORE_URL: IOS_STORE_URL,
    ANDROID_PACKAGE: ANDROID_PACKAGE,
    ANDROID_STORE_URL: ANDROID_STORE_URL,
    isIOS: isIOS,
    isAndroid: isAndroid,
    isInstagramInApp: isInstagramInApp,
    isFacebookInApp: isFacebookInApp,
    isInAppBrowser: isInAppBrowser,
    bindStoreLinks: bindStoreLinks,
    openStore: openStore,
    watchForAppSwitch: watchForAppSwitch
  };
});
