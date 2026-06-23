// Inject a script into the page's own JS context so we can intercept
// window.location and history navigation (inaccessible from content script scope).
const injected = document.createElement('script');
injected.src = chrome.runtime.getURL('interceptor.js');
(document.head || document.documentElement).appendChild(injected);

let awaitingNavigation = false;

// Receive intercepted navigation URLs from the page context.
window.addEventListener('__cmdclick_nav__', (e) => {
  if (!awaitingNavigation) return;
  awaitingNavigation = false;
  window.open(e.detail, '_blank');
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

  // Fallback: no anchor found — let the click execute but intercept any
  // resulting navigation and redirect it to a new tab.
  awaitingNavigation = true;
  setTimeout(() => { awaitingNavigation = false; }, 500);
}, true); // capture phase so we run before the page's own handlers
