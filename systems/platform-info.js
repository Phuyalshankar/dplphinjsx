// dolphin-jsx-core/systems/platform-info.js
'use strict';

export default async function _initPlatform() {
  const system = {
    info: {},
    capabilities: {},
    ready: () => Promise.resolve(true),
    destroy: () => {}
  };
  
  // Platform info object
  const platformInfo = {
    // Basic info
    name: this.state.platform,
    version: '1.0.0',
    timestamp: Date.now(),
    
    // Capabilities
    hasDOM: typeof document !== 'undefined',
    hasWindow: typeof window !== 'undefined',
    hasNode: typeof process !== 'undefined',
    hasFS: typeof require !== 'undefined' || 
           (typeof window !== 'undefined' && window.showDirectoryPicker),
    hasGPU: typeof WebGLRenderingContext !== 'undefined',
    hasTouch: typeof window !== 'undefined' && 
              ('ontouchstart' in window || navigator.maxTouchPoints > 0),
    hasWebRTC: typeof RTCPeerConnection !== 'undefined',
    hasWebUSB: typeof navigator !== 'undefined' && navigator.usb,
    hasWebBluetooth: typeof navigator !== 'undefined' && navigator.bluetooth,
    
    // Screen info
    screen: {
      width: typeof screen !== 'undefined' ? screen.width : 0,
      height: typeof screen !== 'undefined' ? screen.height : 0,
      pixelRatio: typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1,
      orientation: typeof screen !== 'undefined' && screen.orientation ? 
        screen.orientation.type : 'landscape-primary'
    },
    
    // Network info
    network: {
      online: typeof navigator !== 'undefined' ? navigator.onLine : true,
      type: typeof navigator !== 'undefined' && navigator.connection ? 
        navigator.connection.effectiveType : 'unknown',
      downlink: typeof navigator !== 'undefined' && navigator.connection ? 
        navigator.connection.downlink : 0
    },
    
    // Memory info
    memory: {
      total: 0,
      used: 0,
      limit: 0
    },
    
    // Battery info
    battery: {
      charging: false,
      level: 1,
      chargingTime: 0,
      dischargingTime: 0
    }
  };
  
  // Fill memory info if available
  if (typeof performance !== 'undefined' && performance.memory) {
    platformInfo.memory = {
      total: performance.memory.totalJSHeapSize,
      used: performance.memory.usedJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit
    };
  }
  
  // Fill battery info if available
  if (typeof navigator !== 'undefined' && navigator.getBattery) {
    try {
      const battery = await navigator.getBattery();
      platformInfo.battery = {
        charging: battery.charging,
        level: battery.level,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      };
    } catch (e) {
      // Battery API not supported
    }
  }
  
  system.info = platformInfo;
  
  // Determine capabilities based on platform
  switch (this.state.platform) {
    case 'android':
    case 'ios':
      system.capabilities = {
        camera: true,
        gps: true,
        bluetooth: true,
        sensors: true,
        vibration: true,
        nfc: true,
        push: true
      };
      break;
      
    case 'web':
      system.capabilities = {
        camera: !!navigator.mediaDevices,
        gps: !!navigator.geolocation,
        bluetooth: !!navigator.bluetooth,
        sensors: 'DeviceOrientationEvent' in window,
        vibration: 'vibrate' in navigator,
        nfc: 'NDEFReader' in window,
        push: 'PushManager' in window
      };
      break;
      
    case 'node':
      system.capabilities = {
        camera: false,
        gps: false,
        bluetooth: false,
        sensors: false,
        vibration: false,
        nfc: false,
        push: false,
        filesystem: true,
        network: true
      };
      break;
      
    case 'embedded':
      system.capabilities = {
        gpio: true,
        i2c: true,
        spi: true,
        uart: true,
        adc: true,
        pwm: true
      };
      break;
      
    default:
      system.capabilities = {};
  }
  
  this.logger.platform('Platform info:', platformInfo);
  this.logger.platform('Capabilities:', system.capabilities);
  
  system.getInfo = () => ({ ...platformInfo });
  system.getCapability = (cap) => system.capabilities[cap] || false;
  
  return system;
}