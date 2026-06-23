// Runs in the page's JS context. Patches navigation APIs and fires a custom
// event so the content script can intercept the destination URL.
(function () {
  function notify(url) {
    window.dispatchEvent(new CustomEvent('__cmdclick_nav__', { detail: url }));
  }

  // Intercept history.pushState / replaceState
  const originalPush = history.pushState.bind(history);
  const originalReplace = history.replaceState.bind(history);

  history.pushState = function (state, title, url) {
    notify(url ? new URL(url, location.href).href : location.href);
    return originalPush(state, title, url);
  };

  history.replaceState = function (state, title, url) {
    notify(url ? new URL(url, location.href).href : location.href);
    return originalReplace(state, title, url);
  };

  // Intercept window.location.href assignments
  const locationDescriptor = Object.getOwnPropertyDescriptor(window.Location.prototype, 'href');
  Object.defineProperty(window.Location.prototype, 'href', {
    set(url) {
      notify(new URL(url, location.href).href);
      locationDescriptor.set.call(this, url);
    },
    get: locationDescriptor.get,
    configurable: true,
  });

  // Intercept location.assign / location.replace
  const originalAssign = location.assign.bind(location);
  const originalLocReplace = location.replace.bind(location);

  Location.prototype.assign = function (url) {
    notify(new URL(url, location.href).href);
    return originalAssign(url);
  };

  Location.prototype.replace = function (url) {
    notify(new URL(url, location.href).href);
    return originalLocReplace(url);
  };
})();
