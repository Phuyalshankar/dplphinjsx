// dolphinjs/utils/utilities.js
import DolphinClass from '../dolphin-class.js';

// Create a new Dolphin app instance
export function createApp(config = {}) {
  return new DolphinClass(config);
}

// JSX factory function
export function createElement(type, props, ...children) {
  if (type === Fragment) {
    return children;
  }
  
  if (typeof type === 'function') {
    return type({ ...props, children });
  }
  
  return {
    type,
    props: props || {},
    children: children.length === 1 ? children[0] : children
  };
}

// Fragment component for grouping
export function Fragment(props) {
  return props.children;
}

// Get framework information
export function getInfo() {
  return {
    name: 'Dolphin JSX Core',
    version: '1.0.0',
    platforms: ['web', 'android', 'ios', 'node', 'embedded']
  };
}

// Cleanup helper
export function destroy(app) {
  if (app && typeof app.destroy === 'function') {
    return app.destroy();
  }
  return Promise.resolve();
}

// Hooks implementation
let currentHooks = [];
let hookIndex = 0;

export function useState(initialValue) {
  const index = hookIndex;
  
  if (currentHooks[index] === undefined) {
    currentHooks[index] = {
      value: typeof initialValue === 'function' ? initialValue() : initialValue,
      setter: function(newValue) {
        currentHooks[index].value = typeof newValue === 'function' 
          ? newValue(currentHooks[index].value) 
          : newValue;
        console.log('State updated:', currentHooks[index].value);
      }
    };
  }
  
  hookIndex++;
  
  return [currentHooks[index].value, currentHooks[index].setter];
}

export function useEffect(callback, dependencies) {
  const index = hookIndex;
  
  if (currentHooks[index] === undefined) {
    currentHooks[index] = {
      callback,
      dependencies,
      cleanup: null
    };
    
    // Run effect
    setTimeout(() => {
      currentHooks[index].cleanup = callback();
    }, 0);
  } else {
    const hasChanged = !dependencies || 
      !currentHooks[index].dependencies || 
      dependencies.some((dep, i) => dep !== currentHooks[index].dependencies[i]);
    
    if (hasChanged) {
      if (currentHooks[index].cleanup) {
        currentHooks[index].cleanup();
      }
      
      currentHooks[index].dependencies = dependencies;
      currentHooks[index].cleanup = callback();
    }
  }
  
  hookIndex++;
}

export function useContext(context) {
  return context._defaultValue;
}

// Reset hooks for new render
export function resetHooks() {
  currentHooks = [];
  hookIndex = 0;
}