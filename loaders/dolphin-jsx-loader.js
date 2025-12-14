// dolphin-jsx-core/loaders/dolphin-jsx-loader.js
'use strict';

const { compiler } = require('../compiler/babel-compiler.js');

module.exports = function dolphinJSXLoader(source) {
  const callback = this.async();
  const options = this.getOptions() || {};
  
  compiler.compile(source, {
    filename: this.resourcePath,
    platform: options.platform || 'web',
    minify: this.mode === 'production',
    sourceMaps: this.sourceMap
  })
  .then(result => {
    callback(null, result.code, result.map);
  })
  .catch(error => {
    callback(error);
  });
};