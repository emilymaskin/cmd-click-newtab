(function () {
  let active = false;

  window.addEventListener('__cmdclick_active__', () => {

    active = true;
    setTimeout(() => { active = false; }, 500);
  });

  if (!window.navigation) {

    return;
  }

  window.navigation.addEventListener('navigate', (e) => {

    if (!active || !e.cancelable || e.hashChange || e.downloadRequest) return;
    active = false;
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('__cmdclick_nav__', { detail: e.destination.url }));
  });
})();
