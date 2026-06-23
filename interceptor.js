// Runs in the page's JS context. Patches navigation APIs and fires a custom
// event so the content script can intercept the destination URL.
(function () {
  let active = false;

  // Content script signals us just before a cmd+click with no anchor.
  window.addEventListener('__cmdclick_active__', () => {
    active = true;
    setTimeout(() => { active = false; }, 500);
  });

  function notify(url) {
    window.dispatchEvent(new CustomEvent('__cmdclick_nav__', { detail: url }));
  }

  // history.pushState / replaceState don't cause a full navigation,
  // so we notify but still let them proceed.
  const originalPush = history.pushState.bind(history);
  const originalReplace = history.replaceState.bind(history);

  history.pushState = function (state, title, url) {
    if (active) notify(url ? new URL(url, location.href).href : location.href);
    return originalPush(state, title, url);
  };

  history.replaceState = function (state, title, url) {
    if (active) notify(url ? new URL(url, location.href).href : location.href);
    return originalReplace(state, title, url);
  };

  // location.href / assign / replace cause full navigation — suppress it
  // when active so the page doesn't leave before window.open fires.
  const locationDescriptor = Object.getOwnPropertyDescriptor(window.Location.prototype, 'href');
  Object.defineProperty(window.Location.prototype, 'href', {
    set(url) {
      if (active) { active = false; notify(new URL(url, location.href).href); return; }
      locationDescriptor.set.call(this, url);
    },
    get: locationDescriptor.get,
    configurable: true,
  });

  const originalAssign = location.assign.bind(location);
  const originalLocReplace = location.replace.bind(location);

  Location.prototype.assign = function (url) {
    if (active) { active = false; notify(new URL(url, location.href).href); return; }
    return originalAssign(url);
  };

  Location.prototype.replace = function (url) {
    if (active) { active = false; notify(new URL(url, location.href).href); return; }
    return originalLocReplace(url);
  };
})();
