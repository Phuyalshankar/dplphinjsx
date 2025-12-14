// dolphin-jsx-core/systems/component-system.js
'use strict';

export default async function _initComponentSystem() {
  const system = {
    components: new Map(),
    hooks: new Map(),
    contexts: new Map(),
    nextHookIndex: 0,
    
    ready: () => Promise.resolve(true),
    destroy: () => {
      this.components.clear();
      this.hooks.clear();
      this.contexts.clear();
    },
    
    // Component registration
    register(name, component) {
      if (typeof component !== 'function') {
        throw new Error('Component must be a function or class');
      }
      
      this.components.set(name, component);
      this.logger.info(`Registered component: ${name}`);
      return this;
    },
    
    get(name) {
      return this.components.get(name);
    },
    
    has(name) {
      return this.components.has(name);
    },
    
    // Hooks system (React-like)
    withHooks(component) {
      return (...args) => {
        // Reset hook index for this render
        const componentId = component.name || 'anonymous';
        const hookKey = `${componentId}-${Date.now()}`;
        this.hooks.set(hookKey, []);
        this.nextHookIndex = 0;
        
        try {
          return component(...args);
        } finally {
          // Cleanup hooks for this render
          this.hooks.delete(hookKey);
        }
      };
    },
    
    _getCurrentHooks() {
      // Get hooks for current component (simplified)
      const hookKey = Array.from(this.hooks.keys()).pop();
      return this.hooks.get(hookKey) || [];
    },
    
    _setCurrentHooks(hooks) {
      const hookKey = Array.from(this.hooks.keys()).pop();
      if (hookKey) {
        this.hooks.set(hookKey, hooks);
      }
    },
    
    // useState hook
    useState(initialValue) {
      const hooks = this._getCurrentHooks();
      const hookIndex = this.nextHookIndex;
      
      if (hookIndex >= hooks.length) {
        hooks.push({
          type: 'state',
          value: typeof initialValue === 'function' ? initialValue() : initialValue
        });
      }
      
      const hook = hooks[hookIndex];
      this.nextHookIndex++;
      
      const setState = (newValue) => {
        hook.value = typeof newValue === 'function' ? newValue(hook.value) : newValue;
        
        // Trigger re-render
        this.emit('stateChanged', { hookIndex, value: hook.value });
        
        // In a real implementation, this would schedule a re-render
        if (this.systems.renderer && this.systems.renderer.update) {
          this.systems.renderer.update();
        }
      };
      
      return [hook.value, setState];
    },
    
    // useEffect hook
    useEffect(callback, dependencies) {
      const hooks = this._getCurrentHooks();
      const hookIndex = this.nextHookIndex;
      
      if (hookIndex >= hooks.length) {
        hooks.push({
          type: 'effect',
          callback,
          dependencies,
          cleanup: null
        });
        
        // Run effect after render
        setTimeout(() => {
          const hook = hooks[hookIndex];
          hook.cleanup = hook.callback();
        }, 0);
      } else {
        const hook = hooks[hookIndex];
        const hasChanged = !dependencies || 
          !hook.dependencies || 
          dependencies.some((dep, i) => dep !== hook.dependencies[i]);
        
        if (hasChanged) {
          // Cleanup previous effect
          if (hook.cleanup && typeof hook.cleanup === 'function') {
            hook.cleanup();
          }
          
          // Update dependencies and run effect
          hook.dependencies = dependencies;
          hook.cleanup = hook.callback();
        }
      }
      
      this.nextHookIndex++;
    },
    
    // useContext hook
    createContext(defaultValue) {
      const contextId = Symbol('context');
      
      const Provider = ({ value, children }) => {
        this.contexts.set(contextId, value);
        return children;
      };
      
      const Consumer = ({ children }) => {
        const value = this.contexts.get(contextId) || defaultValue;
        return typeof children === 'function' ? children(value) : children;
      };
      
      return {
        Provider,
        Consumer,
        _id: contextId,
        _defaultValue: defaultValue
      };
    },
    
    useContext(context) {
      return this.contexts.get(context._id) || context._defaultValue;
    },
    
    // useRef hook
    useRef(initialValue) {
      const hooks = this._getCurrentHooks();
      const hookIndex = this.nextHookIndex;
      
      if (hookIndex >= hooks.length) {
        hooks.push({
          type: 'ref',
          current: initialValue
        });
      }
      
      const hook = hooks[hookIndex];
      this.nextHookIndex++;
      
      return hook;
    },
    
    // useMemo hook
    useMemo(factory, dependencies) {
      const hooks = this._getCurrentHooks();
      const hookIndex = this.nextHookIndex;
      
      if (hookIndex >= hooks.length) {
        const value = factory();
        hooks.push({
          type: 'memo',
          value,
          dependencies
        });
        this.nextHookIndex++;
        return value;
      }
      
      const hook = hooks[hookIndex];
      const hasChanged = !dependencies || 
        !hook.dependencies || 
        dependencies.some((dep, i) => dep !== hook.dependencies[i]);
      
      if (hasChanged) {
        hook.value = factory();
        hook.dependencies = dependencies;
      }
      
      this.nextHookIndex++;
      return hook.value;
    },
    
    // useCallback hook
    useCallback(callback, dependencies) {
      return this.useMemo(() => callback, dependencies);
    },
    
    // Built-in components
    _registerBuiltInComponents() {
      // Text component
      this.register('Text', ({ children, style, ...props }) => ({
        type: 'span',
        props: { style, ...props },
        children
      }));
      
      // View component (like div)
      this.register('View', ({ children, style, ...props }) => ({
        type: 'div',
        props: { style, ...props },
        children
      }));
      
      // Button component
      this.register('Button', ({ children, onClick, style, ...props }) => ({
        type: 'button',
        props: { 
          onClick, 
          style: { 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            ...style 
          },
          ...props 
        },
        children
      }));
      
      // Input component
      this.register('Input', ({ value, onChange, placeholder, style, ...props }) => ({
        type: 'input',
        props: {
          value,
          onChange,
          placeholder,
          style: {
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            ...style
          },
          ...props
        }
      }));
      
      // Image component
      this.register('Image', ({ src, alt, style, ...props }) => ({
        type: 'img',
        props: {
          src,
          alt,
          style: { maxWidth: '100%', ...style },
          ...props
        }
      }));
      
      // List component
      this.register('List', ({ data, renderItem, style, ...props }) => ({
        type: 'ul',
        props: { style: { listStyle: 'none', padding: 0, ...style }, ...props },
        children: data.map((item, index) => renderItem(item, index))
      }));
      
      // Conditional render component
      this.register('If', ({ condition, children }) => 
        condition ? children : null
      );
      
      // Loop component
      this.register('For', ({ each, children }) => 
        Array.isArray(each) ? each.map(children) : null
      );
    },
    
    // Update scheduler
    _scheduleUpdate(component) {
      // Debounce updates
      if (this._updateScheduled) return;
      
      this._updateScheduled = setTimeout(() => {
        this._updateScheduled = null;
        if (this.systems.renderer && this.systems.renderer.update) {
          this.systems.renderer.update();
        }
      }, 0);
    }
  };
  
  // Register built-in components
  system._registerBuiltInComponents();
  
  this.logger.info('Component system initialized');
  
  return system;
}