// dolphin-jsx-core/compiler/dolphin-jsx-plugin.js
'use strict';

export default function dolphinJSXPlugin({ types: t }) {
  return {
    name: 'dolphin-jsx',
    visitor: {
      JSXElement(path, state) {
        const openingElement = path.node.openingElement;
        const tagName = openingElement.name;
        const attributes = openingElement.attributes;
        const children = path.node.children;
        
        // Convert JSX element to Dolphin.createElement call
        const callExpr = this.createElementCall(
          tagName,
          attributes,
          children,
          state
        );
        
        path.replaceWith(callExpr);
      },
      
      JSXFragment(path, state) {
        const children = path.node.children;
        
        // Convert Fragment to array of children
        const fragmentCall = t.arrayExpression(
          children.map(child => this.transformJSXChild(child, state))
            .filter(Boolean)
        );
        
        path.replaceWith(fragmentCall);
      },
      
      JSXExpressionContainer(path, state) {
        // Just extract the expression
        path.replaceWith(path.node.expression);
      },
      
      JSXSpreadAttribute(path) {
        // Handle spread attributes
        path.replaceWith(path.node.argument);
      }
    },
    
    // Helper method to create element call
    createElementCall(tagName, attributes, children, state) {
      const { pragma = 'Dolphin.createElement' } = state.opts;
      
      // Parse tag name
      let tagExpr;
      if (t.isJSXIdentifier(tagName)) {
        if (tagName.name[0] === tagName.name[0].toUpperCase()) {
          // Component
          tagExpr = t.identifier(tagName.name);
        } else {
          // HTML element
          tagExpr = t.stringLiteral(tagName.name);
        }
      } else if (t.isJSXMemberExpression(tagName)) {
        // Member expression like <Component.SubComponent />
        tagExpr = this.transformJSXMemberExpression(tagName);
      } else {
        tagExpr = tagName;
      }
      
      // Convert attributes to props object
      const propsExpr = this.buildPropsObject(attributes, state);
      
      // Convert children
      const childrenExpr = this.transformChildren(children, state);
      
      // Create the call expression
      const createElementIdentifier = this.parsePragma(pragma);
      
      return t.callExpression(createElementIdentifier, [
        tagExpr,
        propsExpr,
        ...childrenExpr
      ]);
    },
    
    // Parse pragma into identifier
    parsePragma(pragma) {
      const parts = pragma.split('.');
      let identifier = t.identifier(parts[0]);
      
      for (let i = 1; i < parts.length; i++) {
        identifier = t.memberExpression(
          identifier,
          t.identifier(parts[i])
        );
      }
      
      return identifier;
    },
    
    // Build props object from attributes
    buildPropsObject(attributes, state) {
      const props = [];
      const spreads = [];
      
      attributes.forEach(attr => {
        if (t.isJSXSpreadAttribute(attr)) {
          spreads.push(attr.argument);
        } else if (t.isJSXAttribute(attr)) {
          const key = this.transformJSXIdentifier(attr.name);
          let value;
          
          if (attr.value) {
            if (t.isJSXExpressionContainer(attr.value)) {
              value = attr.value.expression;
            } else {
              value = attr.value;
            }
          } else {
            // Boolean attribute without value
            value = t.booleanLiteral(true);
          }
          
          // Handle special attributes
          if (t.isStringLiteral(key) && key.value === 'className') {
            // Convert className to class
            props.push(t.objectProperty(
              t.stringLiteral('class'),
              value
            ));
          } else if (t.isStringLiteral(key) && key.value === 'htmlFor') {
            // Convert htmlFor to for
            props.push(t.objectProperty(
              t.stringLiteral('for'),
              value
            ));
          } else if (t.isStringLiteral(key) && key.value.startsWith('on')) {
            // Event handlers
            props.push(t.objectProperty(
              t.stringLiteral(key.value.toLowerCase()),
              value
            ));
          } else {
            props.push(t.objectProperty(key, value));
          }
        }
      });
      
      let propsObject;
      
      if (props.length === 0 && spreads.length === 0) {
        propsObject = t.nullLiteral();
      } else if (props.length === 1 && spreads.length === 0) {
        propsObject = t.objectExpression(props);
      } else {
        // Combine props and spreads
        const allProps = [...props];
        
        spreads.forEach(spread => {
          allProps.push(t.spreadElement(spread));
        });
        
        propsObject = t.objectExpression(allProps);
      }
      
      return propsObject;
    },
    
    // Transform children
    transformChildren(children, state) {
      return children
        .map(child => this.transformJSXChild(child, state))
        .filter(Boolean);
    },
    
    // Transform a single JSX child
    transformJSXChild(child, state) {
      if (t.isJSXText(child)) {
        const value = child.value.trim();
        if (value) {
          return t.stringLiteral(value);
        }
        return null;
      } else if (t.isJSXExpressionContainer(child)) {
        return child.expression;
      } else if (t.isJSXElement(child)) {
        // This will be handled by JSXElement visitor
        return child;
      } else if (t.isJSXFragment(child)) {
        // This will be handled by JSXFragment visitor
        return child;
      } else if (t.isJSXSpreadChild(child)) {
        return t.spreadElement(child.expression);
      }
      return null;
    },
    
    // Transform JSX identifier
    transformJSXIdentifier(name) {
      if (t.isJSXIdentifier(name)) {
        return t.stringLiteral(name.name);
      }
      return name;
    },
    
    // Transform JSX member expression
    transformJSXMemberExpression(node) {
      let object;
      if (t.isJSXMemberExpression(node.object)) {
        object = this.transformJSXMemberExpression(node.object);
      } else {
        object = t.identifier(node.object.name);
      }
      
      return t.memberExpression(object, t.identifier(node.property.name));
    }
  };
}