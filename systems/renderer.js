// renderer.js
import { transformJSX, inlineJSX } from '../compiler/transform-jsx.js';

export default function createRenderer() {
  const system = {
    // ... other existing methods ...
    
    // Add _compileJSX method to system object
    async _compileJSX(jsxCode, component) {
      if (typeof jsxCode === 'string' && jsxCode.includes('</')) {
        // It's JSX string, compile it
        try {
          const result = await transformJSX(jsxCode, {
            platform: this.state.platform
          });
          
          // Create component from compiled code
          const componentFactory = new Function('Dolphin', `
            ${result.code}
            return App;
          `);
          
          const Dolphin = {
            createElement: this.createElement.bind(this),
            Fragment: this.Fragment.bind(this)
          };
          
          return componentFactory(Dolphin);
        } catch (error) {
          this.logger.error('JSX compilation failed:', error);
          // Fallback to inline parsing
          return inlineJSX(jsxCode);
        }
      }
      return jsxCode;
    },
    
    // Update _callComponent method
    async _callComponent(component) {
      // First check if component is JSX string
      if (typeof component === 'string' && component.trim().startsWith('<')) {
        component = await this._compileJSX(component);
      }
      
      // Rest of existing _callComponent implementation
      // ... existing code ...
      return component;
    },
    
    async _renderToDOM(vdom, container) {
      if (!vdom) return;
      
      // Clear container
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      
      // Create DOM element
      const element = this._createDOMElement(vdom);
      
      if (element) {
        container.appendChild(element);
      }
    },
    
    _createDOMElement(vnode) {
      if (!vnode) return null;
      
      // Handle text nodes
      if (typeof vnode === 'string' || typeof vnode === 'number') {
        return document.createTextNode(String(vnode));
      }
      
      // Handle fragments
      if (Array.isArray(vnode)) {
        const fragment = document.createDocumentFragment();
        vnode.forEach(child => {
          const childElement = this._createDOMElement(child);
          if (childElement) {
            fragment.appendChild(childElement);
          }
        });
        return fragment;
      }
      
      // Handle component nodes
      if (typeof vnode.type === 'function') {
        // Render component recursively
        const componentVdom = vnode.type(vnode.props);
        return this._createDOMElement(componentVdom);
      }
      
      // Create element
      const element = document.createElement(vnode.type);
      
      // Set attributes
      if (vnode.props) {
        Object.keys(vnode.props).forEach(key => {
          const value = vnode.props[key];
          
          if (key === 'children') {
            // Skip children, handled separately
          } else if (key.startsWith('on') && typeof value === 'function') {
            // Event handler
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, value);
          } else if (key === 'style' && typeof value === 'object') {
            // Style object
            Object.assign(element.style, value);
          } else if (key === 'className') {
            // Class name
            element.className = value;
          } else {
            // Regular attribute
            element.setAttribute(key, value);
          }
        });
      }
      
      // Add children
      if (vnode.children) {
        const children = Array.isArray(vnode.children) ? vnode.children : [vnode.children];
        children.forEach(child => {
          const childElement = this._createDOMElement(child);
          if (childElement) {
            element.appendChild(childElement);
          }
        });
      }
      
      return element;
    },
    
    async _renderToAndroid(vdom, container) {
      // Map vdom to Android Views
      const androidView = this._mapElementToAndroidView(vdom);
      
      // In real implementation, this would call through JNI
      const result = await this.systems.native.callNative('render.android', {
        view: androidView,
        container: container
      });
      
      return result;
    },
    
    async _renderToIOS(vdom, container) {
      // Map vdom to iOS UIViews
      const iosView = this._mapElementToIOSView(vdom);
      
      // In real implementation, this would call through WebKit
      const result = await this.systems.native.callNative('render.ios', {
        view: iosView,
        container: container
      });
      
      return result;
    },
    
    async _renderToEmbedded(vdom, container) {
      // Map vdom to LVGL or other embedded UI framework
      const embeddedUI = this._mapElementToLVGL(vdom);
      
      // Send to embedded display
      const result = await this.systems.native.callNative('render.embedded', {
        ui: embeddedUI,
        container: container
      });
      
      return result;
    },
    
    async _createRootElement() {
      switch (this.state.platform) {
        case 'web':
          return document.createElement('div');
        case 'android':
          return { type: 'ViewGroup', id: 'root' };
        case 'ios':
          return { type: 'UIView', id: 'root' };
        case 'embedded':
          return { type: 'screen', id: 0 };
        default:
          return { type: 'container', id: 'root' };
      }
    },
    
    // Public render method for custom rendering
    render(vdom, container) {
      return this._renderToDOM(vdom, container);
    },
    
    // Create element helper (JSX support)
    createElement(type, props, ...children) {
      return {
        type,
        props: props || {},
        children: children.length === 1 ? children[0] : children
      };
    },
    
    // Fragment support
    Fragment(props) {
      return props.children;
    },
    
    // Helper methods for platform-specific rendering
    _mapElementToAndroidView(vnode) {
      // Implementation for Android view mapping
      if (!vnode) return null;
      
      if (typeof vnode === 'string' || typeof vnode === 'number') {
        return { type: 'TextView', text: String(vnode) };
      }
      
      if (typeof vnode.type === 'function') {
        const componentVdom = vnode.type(vnode.props);
        return this._mapElementToAndroidView(componentVdom);
      }
      
      return {
        type: vnode.type,
        props: vnode.props,
        children: Array.isArray(vnode.children) 
          ? vnode.children.map(child => this._mapElementToAndroidView(child))
          : this._mapElementToAndroidView(vnode.children)
      };
    },
    
    _mapElementToIOSView(vnode) {
      // Implementation for iOS view mapping
      if (!vnode) return null;
      
      if (typeof vnode === 'string' || typeof vnode === 'number') {
        return { type: 'UILabel', text: String(vnode) };
      }
      
      if (typeof vnode.type === 'function') {
        const componentVdom = vnode.type(vnode.props);
        return this._mapElementToIOSView(componentVdom);
      }
      
      return {
        type: vnode.type,
        props: vnode.props,
        children: Array.isArray(vnode.children) 
          ? vnode.children.map(child => this._mapElementToIOSView(child))
          : this._mapElementToIOSView(vnode.children)
      };
    },
    
    _mapElementToLVGL(vnode) {
      // Implementation for LVGL mapping
      if (!vnode) return null;
      
      if (typeof vnode === 'string' || typeof vnode === 'number') {
        return { type: 'label', text: String(vnode) };
      }
      
      if (typeof vnode.type === 'function') {
        const componentVdom = vnode.type(vnode.props);
        return this._mapElementToLVGL(componentVdom);
      }
      
      return {
        type: vnode.type,
        props: vnode.props,
        children: Array.isArray(vnode.children) 
          ? vnode.children.map(child => this._mapElementToLVGL(child))
          : this._mapElementToLVGL(vnode.children)
      };
    }
  };
  
  // Initialize logger if it exists
  if (system.logger) {
    system.logger.info('Renderer initialized for', system.state?.platform || 'unknown');
  }
  
  return system;
}