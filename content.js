// Inject a script into the page's own JS context so we can intercept
// window.location and history navigation (inaccessible from content script scope).
const injected = document.createElement('script');
injected.src = chrome.runtime.getURL('interceptor.js');
(document.head || document.documentElement).appendChild(injected);

let awaitingNavigation = false;

// Receive intercepted navigation URLs from the page context.
// Route through the background service worker to avoid popup-blocker issues
// (window.open loses user gesture context inside a custom event handler).
window.addEventListener('__cmdclick_nav__', (e) => {
  if (!awaitingNavigation) return;
  awaitingNavigation = false;
  chrome.runtime.sendMessage({ type: 'open-tab', url: e.detail });
});

document.addEventListener('click', (e) => {
  if (!e.metaKey) return;

  // Fast path: walk up the DOM to find an anchor with a usable href.
  let el = e.target;
  while (el && el !== document.body) {
    if (el.tagName === 'A' && el.href && !el.href.startsWith('javascript:')) {
      e.preventDefault();
      e.stopImmediatePropagation();
      window.open(el.href, '_blank');
      return;
    }
    el = el.parentElement;
  }

  // Fallback: no anchor found — signal the interceptor, then let the click
  // execute. The interceptor will suppress the navigation and notify us.
  awaitingNavigation = true;
  setTimeout(() => { awaitingNavigation = false; }, 500);
  window.dispatchEvent(new CustomEvent('__cmdclick_active__'));
}, true); // capture phase so we run before the page's own handlers
