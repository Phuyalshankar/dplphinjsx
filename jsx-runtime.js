'use strict';

import { createElement } from './utils/utilities.js';

export { createElement };
export { Fragment } from './utils/utilities.js';

// Automatic JSX runtime
export function jsx(type, props, key) {
  return createElement(type, props);
}

export function jsxs(type, props, key) {
  return createElement(type, props);
}