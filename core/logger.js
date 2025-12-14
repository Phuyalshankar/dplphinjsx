// dolphinjs/core/logger.js
export function _initLogger(debug = false) {
  const levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    silent: 4
  };
  
  const level = debug ? levels.debug : levels.info;
  
  const logger = {
    debug(...args) {
      if (level <= levels.debug) {
        console.debug('🐬 DEBUG:', ...args);
      }
    },
    
    info(...args) {
      if (level <= levels.info) {
        console.info('🐬 INFO:', ...args);
      }
    },
    
    warn(...args) {
      if (level <= levels.warn) {
        console.warn('🐬 WARN:', ...args);
      }
    },
    
    error(...args) {
      if (level <= levels.error) {
        console.error('🐬 ERROR:', ...args);
      }
    },
    
    log(...args) {
      this.info(...args);
    }
  };
  
  return logger;
}