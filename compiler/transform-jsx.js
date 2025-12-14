// dolphinjs/compiler/transform-jsx.js

// Create a simple compiler object
export const compiler = {
  async compile(code, options = {}) {
    console.log('🔧 Compiling JSX...');
    
    // Simple transformation
    let transformed = code;
    
    // Convert JSX-like syntax if present
    if (code.includes('React.createElement')) {
      transformed = code.replace(/React\./g, 'Dolphin.');
    }
    
    return {
      code: transformed,
      metadata: {
        filename: options.filename || 'unknown.js',
        size: {
          input: code.length,
          output: transformed.length,
          compression: ((code.length - transformed.length) / code.length * 100).toFixed(1) + '%'
        }
      }
    };
  }
};

// Simple JSX transformer
export async function transformJSX(code, options = {}) {
  return compiler.compile(code, options);
}

// Inline JSX parser
export function inlineJSX(jsxString) {
  // Simple regex parser
  const elementRegex = /<(\w+)([^>]*)>([\s\S]*?)<\/\1>/;
  const match = elementRegex.exec(jsxString);
  
  if (match) {
    const [, tag, attrs, content] = match;
    const props = {};
    
    // Parse attributes
    const attrRegex = /(\w+)=["']([^"']*)["']/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      props[attrMatch[1]] = attrMatch[2];
    }
    
    return {
      type: tag,
      props,
      children: content.trim() || []
    };
  }
  
  // Try self-closing tag
  const selfCloseRegex = /<(\w+)([^>]*)\/>/;
  const selfCloseMatch = selfCloseRegex.exec(jsxString);
  
  if (selfCloseMatch) {
    const [, tag, attrs] = selfCloseMatch;
    const props = {};
    
    const attrRegex = /(\w+)=["']([^"']*)["']/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      props[attrMatch[1]] = attrMatch[2];
    }
    
    return {
      type: tag,
      props,
      children: []
    };
  }
  
  return null;
}

// Create JSX transform function
export function createJSXTransformFunction() {
  const transformCode = `
    const Dolphin = {
      createElement: (type, props, ...children) => {
        if (typeof type === 'function') {
          return type({ ...props, children });
        }
        
        return {
          type,
          props: props || {},
          children: children.length === 1 ? children[0] : children
        };
      },
      Fragment: (props) => props.children
    };
    
    return function transform(jsxCode) {
      try {
        return eval(jsxCode);
      } catch (error) {
        console.error('JSX transform failed:', error);
        return null;
      }
    };
  `;
  
  return new Function(transformCode)();
}

// Default export
export default {
  compiler,
  transformJSX,
  inlineJSX,
  createJSXTransformFunction
};