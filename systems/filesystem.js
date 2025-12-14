// dolphin-jsx-core/systems/filesystem.js
'use strict';

export default async function _initFileSystem() {
  const system = {
    ready: () => Promise.resolve(true),
    destroy: () => {},
    
    // Web implementation using IndexedDB
    _webIndexedDB: null,
    
    async init() {
      switch (this.state.platform) {
        case 'web':
          return this._initIndexedDB();
        case 'node':
          // Node.js filesystem is available natively
          return Promise.resolve();
        default:
          // Other platforms may have their own FS
          return Promise.resolve();
      }
    },
    
    async _initIndexedDB() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('dolphin-fs', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
          this._webIndexedDB = request.result;
          resolve();
        };
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('files')) {
            db.createObjectStore('files', { keyPath: 'path' });
          }
          if (!db.objectStoreNames.contains('metadata')) {
            db.createObjectStore('metadata', { keyPath: 'path' });
          }
        };
      });
    },
    
    // File operations
    async readFile(path, options = {}) {
      const platform = this.state.platform;
      
      switch (platform) {
        case 'web':
          return this._readWebFile(path, options);
        case 'node':
          return this._readNodeFile(path, options);
        case 'android':
        case 'ios':
          return this._readMobileFile(path, options);
        default:
          throw new Error(`Filesystem not supported on ${platform}`);
      }
    },
    
    async writeFile(path, data, options = {}) {
      const platform = this.state.platform;
      
      switch (platform) {
        case 'web':
          return this._writeWebFile(path, data, options);
        case 'node':
          return this._writeNodeFile(path, data, options);
        case 'android':
        case 'ios':
          return this._writeMobileFile(path, data, options);
        default:
          throw new Error(`Filesystem not supported on ${platform}`);
      }
    },
    
    async deleteFile(path) {
      const platform = this.state.platform;
      
      switch (platform) {
        case 'web':
          return this._deleteWebFile(path);
        case 'node':
          return this._deleteNodeFile(path);
        case 'android':
        case 'ios':
          return this._deleteMobileFile(path);
        default:
          throw new Error(`Filesystem not supported on ${platform}`);
      }
    },
    
    async listFiles(dir = '/') {
      const platform = this.state.platform;
      
      switch (platform) {
        case 'web':
          return this._listWebFiles(dir);
        case 'node':
          return this._listNodeFiles(dir);
        case 'android':
        case 'ios':
          return this._listMobileFiles(dir);
        default:
          throw new Error(`Filesystem not supported on ${platform}`);
      }
    },
    
    // Web implementations
    async _readWebFile(path) {
      if (!this._webIndexedDB) {
        await this._initIndexedDB();
      }
      
      return new Promise((resolve, reject) => {
        const transaction = this._webIndexedDB.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        const request = store.get(path);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          resolve(request.result ? request.result.data : null);
        };
      });
    },
    
    async _writeWebFile(path, data) {
      if (!this._webIndexedDB) {
        await this._initIndexedDB();
      }
      
      return new Promise((resolve, reject) => {
        const transaction = this._webIndexedDB.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        const request = store.put({ path, data, modified: Date.now() });
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    },
    
    async _deleteWebFile(path) {
      if (!this._webIndexedDB) {
        await this._initIndexedDB();
      }
      
      return new Promise((resolve, reject) => {
        const transaction = this._webIndexedDB.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        const request = store.delete(path);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    },
    
    async _listWebFiles(dir) {
      if (!this._webIndexedDB) {
        await this._initIndexedDB();
      }
      
      return new Promise((resolve, reject) => {
        const transaction = this._webIndexedDB.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        const request = store.getAll();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const files = request.result
            .filter(file => file.path.startsWith(dir))
            .map(file => ({
              name: file.path.split('/').pop(),
              path: file.path,
              size: file.data.length,
              modified: file.modified
            }));
          resolve(files);
        };
      });
    },
    
    // Node.js implementations
    async _readNodeFile(path, options) {
      const fs = require('fs').promises;
      const encoding = options.encoding || 'utf8';
      return fs.readFile(path, encoding);
    },
    
    async _writeNodeFile(path, data, options) {
      const fs = require('fs').promises;
      const encoding = options.encoding || 'utf8';
      return fs.writeFile(path, data, encoding);
    },
    
    async _deleteNodeFile(path) {
      const fs = require('fs').promises;
      return fs.unlink(path);
    },
    
    async _listNodeFiles(dir) {
      const fs = require('fs').promises;
      const files = await fs.readdir(dir, { withFileTypes: true });
      
      return Promise.all(files.map(async (file) => {
        const fullPath = `${dir}/${file.name}`;
        const stats = await fs.stat(fullPath);
        
        return {
          name: file.name,
          path: fullPath,
          size: stats.size,
          modified: stats.mtime.getTime(),
          isDirectory: stats.isDirectory()
        };
      }));
    },
    
    // Mobile implementations (stub)
    async _readMobileFile(path) {
      // This would use cordova-plugin-file or similar
      const result = await this.systems.native.callNative('filesystem.read', { path });
      return result.data;
    },
    
    async _writeMobileFile(path, data) {
      return this.systems.native.callNative('filesystem.write', { path, data });
    },
    
    async _deleteMobileFile(path) {
      return this.systems.native.callNative('filesystem.delete', { path });
    },
    
    async _listMobileFiles(dir) {
      const result = await this.systems.native.callNative('filesystem.list', { dir });
      return result.files;
    },
    
    // Utility methods
    async exists(path) {
      try {
        await this.readFile(path);
        return true;
      } catch {
        return false;
      }
    },
    
    async mkdir(path) {
      // Implementation depends on platform
      if (this.state.platform === 'node') {
        const fs = require('fs').promises;
        return fs.mkdir(path, { recursive: true });
      }
      // For web and mobile, directories are virtual
      return Promise.resolve();
    },
    
    async getInfo(path) {
      try {
        const content = await this.readFile(path);
        return {
          exists: true,
          size: content.length,
          path: path
        };
      } catch (error) {
        return {
          exists: false,
          path: path,
          error: error.message
        };
      }
    },
    
    // File picker (web only)
    async pickFile(options = {}) {
      if (this.state.platform !== 'web') {
        throw new Error('File picker only available on web');
      }
      
      return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        
        if (options.accept) {
          input.accept = options.accept;
        }
        if (options.multiple) {
          input.multiple = true;
        }
        
        input.onchange = async (e) => {
          const files = Array.from(e.target.files);
          const results = await Promise.all(files.map(async (file) => {
            const content = await file.text();
            return {
              name: file.name,
              type: file.type,
              size: file.size,
              content: content
            };
          }));
          
          resolve(options.multiple ? results : results[0]);
        };
        
        input.oncancel = () => {
          reject(new Error('File selection cancelled'));
        };
        
        input.click();
      });
    }
  };
  
  await system.init();
  this.logger.info('Filesystem initialized for', this.state.platform);
  
  return system;
}