(function () {
  const ROUTE_IDS = {
    '/': 'home-section',
    '/report': 'result-section',
    '/compatibility-input': 'hepan-input-section',
    '/compatibility-result': 'hepan-result-section',
  };

  let onRouteChange = null;

  function normalizePath(path) {
    if (!path || path === '/' || path === '#/') return '/';
    const raw = path.replace(/^#/, '');
    const p = raw.startsWith('/') ? raw : `/${raw}`;
    return ROUTE_IDS[p] ? p : '/';
  }

  function getPath() {
    return normalizePath(window.location.hash.slice(1) || '/');
  }

  function hideAll() {
    Object.values(ROUTE_IDS).forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
  }

  function showSection(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
    return el;
  }

  function applyRoute(path, options = {}) {
    const route = normalizePath(path);
    const sectionId = ROUTE_IDS[route];
    if (!sectionId) return false;

    hideAll();
    showSection(sectionId);
    window.scrollTo({ top: 0, behavior: options.smooth ? 'smooth' : 'auto' });

    if (typeof onRouteChange === 'function') {
      onRouteChange(route, options);
    }
    return route;
  }

  function navigate(path, options = {}) {
    const route = normalizePath(path);
    const hash = route === '/' ? '#/' : `#${route}`;

    if (options.replace) {
      history.replaceState({ route }, '', hash);
    } else {
      history.pushState({ route }, '', hash);
    }

    return applyRoute(route, options);
  }

  function start(initialHandler) {
    onRouteChange = initialHandler;

    window.addEventListener('popstate', () => {
      applyRoute(getPath(), { fromPopstate: true });
    });

    window.addEventListener('hashchange', () => {
      applyRoute(getPath(), { fromHashchange: true });
    });

    const boot = getPath();
    if (boot !== '/' && !history.state?.route) {
      history.replaceState({ route: boot }, '', boot === '/' ? '#/' : `#${boot}`);
    }
    applyRoute(boot);
  }

  window.AppRouter = {
    ROUTE_IDS,
    getPath,
    navigate,
    applyRoute,
    start,
  };
})();
