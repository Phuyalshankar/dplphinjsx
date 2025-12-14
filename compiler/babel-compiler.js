// dolphin-jsx-core/compiler/babel-compiler.js
'use strict';

import * as babel from '@babel/core';
import dolphinJSXPlugin from './dolphin-jsx-plugin.js';

export class DolphinBabelCompiler {
  constructor(options = {}) {
    this.options = {
      minify: options.minify || false,
      sourceMaps: options.sourceMaps || false,
      target: options.target || 'es2020',
      platform: options.platform || 'web',
      ...options
    };
    
    this.cache = new Map();
    this.stats = {
      compilations: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }
  
  async compile(code, filename = 'unknown.js') {
    this.stats.compilations++;
    
    const cacheKey = this._generateCacheKey(code, filename);
    if (this.cache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.cache.get(cacheKey);
    }
    
    this.stats.cacheMisses++;
    
    try {
      const startTime = performance.now();
      
      const result = await this._transform(code, filename);
      
      const duration = performance.now() - startTime;
      
      const output = {
        code: result.code,
        map: result.map,
        ast: result.ast,
        metadata: {
          filename,
          duration,
          size: {
            input: code.length,
            output: result.code.length,
            compression: ((code.length - result.code.length) / code.length * 100).toFixed(1) + '%'
          }
        }
      };
      
      // Cache the result
      this.cache.set(cacheKey, output);
      
      // Limit cache size
      if (this.cache.size > 100) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      
      return output;
      
    } catch (error) {
      throw new Error(`Compilation failed for ${filename}: ${error.message}`);
    }
  }
  
  async _transform(code, filename) {
    const plugins = [
      // Use custom Dolphin JSX plugin
      [dolphinJSXPlugin, {
        pragma: 'Dolphin.createElement',
        pragmaFrag: 'Dolphin.Fragment'
      }],
      
      // Platform-specific transforms
      ...this._getPlatformPlugins(),
      
      // Minification if enabled
      ...(this.options.minify ? [
        require('@babel/plugin-transform-member-expression-literals'),
        require('@babel/plugin-transform-property-literals'),
        require('@babel/plugin-transform-minify-booleans')
      ] : [])
    ];
    
    const presets = [
      ['@babel/preset-env', {
        targets: this._getTargets(),
        modules: false,
        useBuiltIns: 'usage',
        corejs: 3
      }]
    ];
    
    return babel.transformAsync(code, {
      filename,
      presets,
      plugins,
      sourceMaps: this.options.sourceMaps,
      ast: true,
      compact: this.options.minify,
      comments: !this.options.minify,
      sourceType: 'module',
      parserOpts: {
        allowReturnOutsideFunction: true,
        allowAwaitOutsideFunction: true,
        plugins: [
          'jsx',
          'asyncGenerators',
          'classProperties',
          'dynamicImport',
          'exportDefaultFrom',
          'exportNamespaceFrom',
          'optionalCatchBinding',
          'optionalChaining',
          'nullishCoalescingOperator'
        ]
      }
    });
  }
  
  _getPlatformPlugins() {
    const platform = this.options.platform;
    
    switch (platform) {
      case 'web':
        return [
          require('@babel/plugin-proposal-optional-chaining'),
          require('@babel/plugin-proposal-nullish-coalescing-operator')
        ];
        
      case 'node':
        return [
          require('@babel/plugin-transform-modules-commonjs')
        ];
        
      case 'android':
      case 'ios':
        return [
          require('@babel/plugin-transform-modules-commonjs'),
          require('@babel/plugin-syntax-dynamic-import')
        ];
        
      case 'embedded':
        return [
          // Minimal transforms for embedded
          require('@babel/plugin-transform-arrow-functions'),
          require('@babel/plugin-transform-template-literals')
        ];
        
      default:
        return [];
    }
  }
  
  _getTargets() {
    switch (this.options.platform) {
      case 'web':
        return {
          browsers: ['last 2 versions', 'not dead']
        };
        
      case 'node':
        return {
          node: 'current'
        };
        
      case 'android':
        return {
          android: '5.0'
        };
        
      case 'ios':
        return {
          ios: '10.0'
        };
        
      case 'embedded':
        return {
          esmodules: true
        };
        
      default:
        return {};
    }
  }
  
  _generateCacheKey(code, filename) {
    return `${filename}:${this.options.platform}:${this.options.minify}:${this._hash(code)}`;
  }
  
  _hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(36);
  }
  
  clearCache() {
    this.cache.clear();
    this.stats.cacheHits = 0;
    this.stats.cacheMisses = 0;
  }
  
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      hitRate: this.stats.compilations > 0 
        ? (this.stats.cacheHits / this.stats.compilations * 100).toFixed(1) + '%'
        : '0%'
    };
  }
  
  // Batch compilation
  async compileFiles(files) {
    const results = {};
    const promises = [];
    
    for (const [filename, code] of Object.entries(files)) {
      promises.push(
        this.compile(code, filename)
          .then(result => {
            results[filename] = result;
          })
          .catch(error => {
            results[filename] = { error: error.message };
          })
      );
    }
    
    await Promise.all(promises);
    return results;
  }
  
  // Generate bundle
  async createBundle(entryFile, files) {
    // Compile all files
    const compiled = await this.compileFiles(files);
    
    // Generate module map
    const moduleMap = {};
    const moduleCode = {};
    
    for (const [filename, result] of Object.entries(compiled)) {
      if (result.error) continue;
      
      const moduleId = this._normalizeModuleId(filename);
      moduleMap[moduleId] = filename;
      moduleCode[moduleId] = result.code;
    }
    
    // Generate bundle wrapper
    const bundle = this._generateBundleWrapper(entryFile, moduleMap, moduleCode);
    
    return {
      code: bundle,
      modules: compiled,
      stats: this.getStats()
    };
  }
  
  _normalizeModuleId(filename) {
    return filename
      .replace(/^\.\//, '')
      .replace(/\.jsx?$/, '')
      .replace(/[^a-zA-Z0-9]/g, '_');
  }
  
  _generateBundleWrapper(entryFile, moduleMap, moduleCode) {
    return `(function() {
  var modules = {};
  var cache = {};
  
  function require(moduleId) {
    if (cache[moduleId]) return cache[moduleId].exports;
    
    var module = cache[moduleId] = {
      exports: {}
    };
    
    modules[moduleId](module, module.exports, require);
    
    return module.exports;
  }
  
  // Module definitions
  ${Object.entries(moduleCode).map(([id, code]) => `
  modules['${id}'] = function(module, exports, require) {
    ${code}
  };`).join('\n')}
  
  // Entry point
  require('${this._normalizeModuleId(entryFile)}');
})();`;
  }
}

// Export singleton instance
export const compiler = new DolphinBabelCompiler();

// Default export
export default DolphinBabelCompiler;