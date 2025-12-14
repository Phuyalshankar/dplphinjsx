// dolphin-jsx-core/systems/router.js
'use strict';

export default async function _initRouter() {
  const system = {
    routes: new Map(),
    currentRoute: null,
    history: [],
    params: {},
    query: {},
    
    ready: () => Promise.resolve(true),
    destroy: () => {
      this.routes.clear();
      this.history = [];
    },
    
    // Register route
    register(path, component, options = {}) {
      const route = {
        path,
        component,
        exact: options.exact !== false,
        meta: options.meta || {},
        guards: options.guards || [],
        children: options.children || []
      };
      
      this.routes.set(path, route);
      this.logger.info(`Registered route: ${path}`);
      
      return this;
    },
    
    // Navigation
    async navigate(path, params = {}, query = {}, state = {}) {
      try {
        // Parse path
        const { route, matchedParams } = this._matchRoute(path);
        
        if (!route) {
          throw new Error(`Route not found: ${path}`);
        }
        
        // Run route guards
        for (const guard of route.guards) {
          const result = await guard(this, route, params, query);
          if (result === false) {
            throw new Error(`Navigation blocked by guard`);
          }
          if (typeof result === 'string') {
            // Redirect
            return this.navigate(result, params, query, state);
          }
        }
        
        // Update state
        const previousRoute = this.currentRoute;
        this.currentRoute = route;
        this.params = { ...matchedParams, ...params };
        this.query = query;
        
        // Add to history
        this.history.push({
          path,
          params: this.params,
          query: this.query,
          timestamp: Date.now(),
          state
        });
        
        // Emit events
        this.emit('routeChanged', {
          from: previousRoute,
          to: route,
          params: this.params,
          query: this.query
        });
        
        this.emit(`route:${path}`, {
          params: this.params,
          query: this.query,
          state
        });
        
        // Return the component to render
        return route.component;
        
      } catch (error) {
        this.logger.error('Navigation failed:', error);
        this.emit('navigationError', error);
        throw error;
      }
    },
    
    // Go back
    back() {
      if (this.history.length > 1) {
        this.history.pop(); // Remove current
        const previous = this.history.pop();
        if (previous) {
          return this.navigate(previous.path, previous.params, previous.query, previous.state);
        }
      }
      return null;
    },
    
    // Get current route info
    getCurrent() {
      return {
        route: this.currentRoute,
        params: { ...this.params },
        query: { ...this.query },
        path: this.currentRoute ? this.currentRoute.path : null
      };
    },
    
    // Get history
    getHistory() {
      return [...this.history];
    },
    
    // Match route
    _matchRoute(path) {
      for (const [routePath, route] of this.routes) {
        const matchedParams = {};
        const isMatch = this._matchPath(path, routePath, route.exact, matchedParams);
        
        if (isMatch) {
          return { route, matchedParams };
        }
      }
      
      return { route: null, matchedParams: {} };
    },
    
    _matchPath(path, pattern, exact, params) {
      const patternParts = pattern.split('/').filter(p => p);
      const pathParts = path.split('/').filter(p => p);
      
      if (exact && patternParts.length !== pathParts.length) {
        return false;
      }
      
      for (let i = 0; i < patternParts.length; i++) {
        const patternPart = patternParts[i];
        const pathPart = pathParts[i];
        
        if (!pathPart && i < patternParts.length) {
          return false;
        }
        
        if (patternPart.startsWith(':')) {
          // Parameter
          const paramName = patternPart.slice(1);
          params[paramName] = pathPart;
        } else if (patternPart !== pathPart) {
          return false;
        }
      }
      
      return true;
    },
    
    // Route guards
    createGuard(condition, redirect) {
      return async (router, route, params, query) => {
        const result = typeof condition === 'function' 
          ? await condition(router, route, params, query)
          : condition;
        
        if (!result) {
          return redirect || false;
        }
        return true;
      };
    },
    
    // Authentication guard
    authGuard(redirectTo = '/login') {
      return this.createGuard(
        () => !!this.state.user, // Check if user is logged in
        redirectTo
      );
    },
    
    // Role-based guard
    roleGuard(allowedRoles, redirectTo = '/unauthorized') {
      return this.createGuard(
        () => {
          const userRole = this.state.user?.role;
          return allowedRoles.includes(userRole);
        },
        redirectTo
      );
    },
    
    // Lazy loading
    lazy(loader) {
      let component = null;
      let loading = false;
      
      return async () => {
        if (component) return component;
        if (loading) {
          // Wait for existing load
          return new Promise(resolve => {
            const check = () => {
              if (component) resolve(component);
              else setTimeout(check, 10);
            };
            check();
          });
        }
        
        loading = true;
        try {
          const module = await loader();
          component = module.default || module;
          return component;
        } finally {
          loading = false;
        }
      };
    },
    
    // Nested routes
    nest(parentPath, children) {
      const parentRoute = this.routes.get(parentPath);
      if (parentRoute) {
        parentRoute.children.push(...children);
      }
      return this;
    },
    
    // Link generator
    link(path, params = {}, query = {}) {
      let result = path;
      
      // Replace params
      Object.keys(params).forEach(key => {
        result = result.replace(`:${key}`, params[key]);
      });
      
      // Add query string
      if (Object.keys(query).length > 0) {
        const queryString = new URLSearchParams(query).toString();
        result += `?${queryString}`;
      }
      
      return result;
    }
  };
  
  // Default routes
  system.register('/', () => ({ type: 'div', children: 'Home' }));
  system.register('/404', () => ({ type: 'div', children: 'Not Found' }));
  
  this.logger.info('Router initialized');
  
  return system;
}