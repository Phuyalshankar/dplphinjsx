// dolphin-jsx-core/systems/network.js
'use strict';

export default async function _initNetwork() {
  const system = {
    connections: new Map(),
    websockets: new Map(),
    requests: new Map(),
    offlineQueue: [],
    isOnline: true,
    
    ready: () => Promise.resolve(true),
    destroy: () => {
      // Close all connections
      this.websockets.forEach(ws => ws.close());
      this.websockets.clear();
      this.connections.clear();
      this.requests.clear();
    },
    
    // HTTP methods
    async request(method, url, data = null, options = {}) {
      const requestId = `${method}:${url}:${Date.now()}`;
      const requestOptions = {
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        credentials: options.credentials || 'same-origin',
        mode: options.mode || 'cors',
        cache: options.cache || 'default',
        ...options
      };
      
      if (data && method !== 'GET' && method !== 'HEAD') {
        if (typeof data === 'object' && !(data instanceof FormData)) {
          requestOptions.body = JSON.stringify(data);
        } else {
          requestOptions.body = data;
          // Remove Content-Type for FormData to let browser set it
          if (data instanceof FormData) {
            delete requestOptions.headers['Content-Type'];
          }
        }
      }
      
      // Check network status
      if (!this.isOnline && !options.force) {
        return this._queueOfflineRequest(requestId, method, url, data, options);
      }
      
      try {
        const startTime = Date.now();
        const response = await fetch(url, requestOptions);
        const duration = Date.now() - startTime;
        
        let responseData;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else if (contentType && contentType.includes('text/')) {
          responseData = await response.text();
        } else {
          responseData = await response.blob();
        }
        
        const result = {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data: responseData,
          duration,
          requestId
        };
        
        this.emit('request', result);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return result;
        
      } catch (error) {
        this.emit('requestError', {
          requestId,
          url,
          method,
          error: error.message,
          timestamp: Date.now()
        });
        
        if (options.retry !== false) {
          return this._retryRequest(requestId, method, url, data, options);
        }
        
        throw error;
      }
    },
    
    // Convenience methods
    async get(url, options = {}) {
      return this.request('GET', url, null, options);
    },
    
    async post(url, data, options = {}) {
      return this.request('POST', url, data, options);
    },
    
    async put(url, data, options = {}) {
      return this.request('PUT', url, data, options);
    },
    
    async patch(url, data, options = {}) {
      return this.request('PATCH', url, data, options);
    },
    
    async delete(url, options = {}) {
      return this.request('DELETE', url, null, options);
    },
    
    // WebSocket
    async connectWebSocket(url, options = {}) {
      const ws = new WebSocket(url);
      const socketId = `ws_${Date.now()}`;
      
      return new Promise((resolve, reject) => {
        ws.onopen = () => {
          this.websockets.set(socketId, ws);
          this.emit('websocket:connected', { socketId, url });
          resolve({ socketId, send: this._createSendFunction(ws) });
        };
        
        ws.onerror = (error) => {
          this.emit('websocket:error', { socketId, url, error });
          reject(error);
        };
        
        ws.onmessage = (event) => {
          let data;
          try {
            data = JSON.parse(event.data);
          } catch {
            data = event.data;
          }
          
          this.emit('websocket:message', { socketId, data });
          this.emit(`websocket:${socketId}:message`, data);
        };
        
        ws.onclose = () => {
          this.websockets.delete(socketId);
          this.emit('websocket:closed', { socketId, url });
        };
        
        // Set timeout
        setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, options.timeout || 10000);
      });
    },
    
    _createSendFunction(ws) {
      return (data) => {
        if (ws.readyState === WebSocket.OPEN) {
          const payload = typeof data === 'object' ? JSON.stringify(data) : data;
          ws.send(payload);
          return true;
        }
        return false;
      };
    },
    
    sendWebSocket(socketId, data) {
      const ws = this.websockets.get(socketId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        const payload = typeof data === 'object' ? JSON.stringify(data) : data;
        ws.send(payload);
        return true;
      }
      return false;
    },
    
    closeWebSocket(socketId) {
      const ws = this.websockets.get(socketId);
      if (ws) {
        ws.close();
        this.websockets.delete(socketId);
        return true;
      }
      return false;
    },
    
    // File upload/download
    async upload(url, file, options = {}) {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options.fields) {
        Object.entries(options.fields).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }
      
      return this.request('POST', url, formData, {
        ...options,
        headers: {
          ...options.headers
          // Don't set Content-Type for FormData
        }
      });
    },
    
    async download(url, options = {}) {
      const response = await this.request('GET', url, null, {
        ...options,
        responseType: 'blob'
      });
      
      if (response.ok) {
        // Create download link
        const blob = response.data;
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = options.filename || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      }
      
      return response;
    },
    
    // Network information
    async getNetworkInfo() {
      if (typeof navigator !== 'undefined' && navigator.connection) {
        const connection = navigator.connection;
        return {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
          type: connection.type,
          onLine: navigator.onLine
        };
      }
      
      return {
        onLine: this.isOnline,
        type: 'unknown'
      };
    },
    
    // Offline support
    _queueOfflineRequest(requestId, method, url, data, options) {
      const queuedRequest = {
        requestId,
        method,
        url,
        data,
        options,
        timestamp: Date.now(),
        retries: 0
      };
      
      this.offlineQueue.push(queuedRequest);
      this.emit('offlineQueued', queuedRequest);
      
      // Try to process queue when back online
      this._processOfflineQueue();
      
      return Promise.reject(new Error('Network offline - request queued'));
    },
    
    async _processOfflineQueue() {
      if (!this.isOnline || this.offlineQueue.length === 0) return;
      
      while (this.offlineQueue.length > 0) {
        const request = this.offlineQueue.shift();
        try {
          await this.request(request.method, request.url, request.data, {
            ...request.options,
            retry: false
          });
          this.emit('offlineProcessed', request);
        } catch (error) {
          // Put back in queue with increased retry count
          request.retries++;
          if (request.retries < 3) {
            this.offlineQueue.push(request);
          } else {
            this.emit('offlineFailed', request);
          }
        }
      }
    },
    
    // Retry logic
    async _retryRequest(requestId, method, url, data, options) {
      const maxRetries = options.maxRetries || 3;
      const retryDelay = options.retryDelay || 1000;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        
        try {
          return await this.request(method, url, data, {
            ...options,
            retry: false
          });
        } catch (error) {
          if (attempt === maxRetries) {
            throw error;
          }
        }
      }
    },
    
    // Event listeners for network status
    _initNetworkListeners() {
      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => {
          this.isOnline = true;
          this.emit('network:online');
          this._processOfflineQueue();
        });
        
        window.addEventListener('offline', () => {
          this.isOnline = false;
          this.emit('network:offline');
        });
        
        // Monitor network quality
        if (navigator.connection) {
          navigator.connection.addEventListener('change', () => {
            this.emit('network:change', this.getNetworkInfo());
          });
        }
      }
    },
    
    // Request interceptors
    interceptors: {
      request: [],
      response: [],
      
      useRequest(interceptor) {
        this.request.push(interceptor);
      },
      
      useResponse(interceptor) {
        this.response.push(interceptor);
      }
    }
  };
  
  // Initialize network listeners
  system._initNetworkListeners();
  
  this.logger.info('Network system initialized');
  
  return system;
}