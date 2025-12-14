'use strict';

import { createElement } from './utils/utilities.js';

export { createElement };
export { Fragment } from './utils/utilities.js';

// Development JSX runtime with debugging
export function jsxDEV(type, props, key, isStaticChildren, source, self) {
  // Add development metadata
  if (process.env.NODE_ENV !== 'production') {
    props = props || {};
    props._source = source;
    props._self = self;
  }
  
  return createElement(type, props);
}