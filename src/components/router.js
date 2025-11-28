export class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;

    window.addEventListener('popstate', () => this.handleRoute());
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-link]')) {
        e.preventDefault();
        this.navigate(e.target.getAttribute('href'));
      }
    });
  }

  addRoute(path, handler) {
    this.routes[path] = handler;
  }

  navigate(path) {
    window.history.pushState({}, '', path);
    this.handleRoute();
  }

  async handleRoute() {
    const path = window.location.pathname;
    this.currentRoute = path;

    const handler = this.routes[path] || this.routes['/'];

    if (handler) {
      await handler();
    }
  }

  start() {
    this.handleRoute();
  }
}
