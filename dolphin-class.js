// dolphinjs/dolphin-class.js
import EventEmitter from 'events';

class DolphinClass extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      debug: config.debug || false,
      platform: config.platform || 'auto',
      appId: config.appId || 'dolphin-app',
      version: '1.0.0',
      ...config
    };
    
    this.state = {
      platform: null,
      ready: false,
      initialized: false,
      mounted: false
    };
    
    this.systems = {};
    this.components = new Map();
    this.routes = new Map();
    this.stores = new Map();
    
    this._initialize();
  }
  
  async _initialize() {
    try {
      // Platform detection
      const { _detectPlatform } = await import('./core/platform-detection.js');
      this.state.platform = await _detectPlatform(this.config.platform);
      
      // Initialize logger
      const { _initLogger } = await import('./core/logger.js');
      this.logger = _initLogger(this.config.debug);
      
      console.log(`🚀 Dolphin JSX Core v${this.config.version}`);
      console.log(`📱 Platform: ${this.state.platform}`);
      
      // Simple renderer for now
      this.systems.renderer = {
        async mount(elementOrSelector, component) {
          console.log('Mounting component');
          return { success: true };
        },
        ready: () => Promise.resolve(true),
        destroy: () => {}
      };
      
      this.state.initialized = true;
      this.emit('initialized', this.state);
      
      if (this.config.autoInit !== false) {
        await this.ready();
      }
      
    } catch (error) {
      console.error('Initialization failed:', error);
      this.emit('error', error);
      throw error;
    }
  }
  
  async ready() {
    if (this.state.ready) return true;
    
    this.state.ready = true;
    this.emit('ready', this.state);
    console.log('✅ Dolphin is ready!');
    
    return true;
  }
  
  async mount(elementOrSelector, component) {
    if (!this.state.ready) {
      await this.ready();
    }
    
    const result = await this.systems.renderer.mount(elementOrSelector, component);
    this.state.mounted = true;
    this.emit('mounted', result);
    return result;
  }
  
  async destroy() {
    this.state.ready = false;
    this.state.initialized = false;
    this.removeAllListeners();
    
    console.log('🗑️ Dolphin destroyed');
    return this;
  }
  
  catch(handler) {
    this.on('error', handler);
    return this;
  }
}

export default DolphinClass;