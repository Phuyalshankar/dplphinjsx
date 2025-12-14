// examples/mobile-app.js - Mobile App Example
import { createApp, createElement, useState, useEffect } from '../index.js';

export function MobileApp() {
  const [count, setCount] = useState(0);
  const [theme, setTheme] = useState('light');
  const [location, setLocation] = useState(null);
  
  // Simulate mobile features
  useEffect(() => {
    console.log('📱 Mobile app mounted');
    
    // Simulate getting location
    setTimeout(() => {
      setLocation({ latitude: 27.7172, longitude: 85.3240 }); // Kathmandu
    }, 1000);
    
    // Battery status simulation
    const batteryInterval = setInterval(() => {
      const battery = Math.floor(Math.random() * 50) + 50;
      console.log(`🔋 Battery: ${battery}%`);
    }, 5000);
    
    return () => clearInterval(batteryInterval);
  }, []);
  
  const increment = () => {
    setCount(count + 1);
    console.log('➕ Incremented:', count + 1);
  };
  
  const decrement = () => {
    setCount(count - 1);
    console.log('➖ Decremented:', count - 1);
  };
  
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
    console.log(`🌓 Theme changed to: ${theme}`);
  };
  
  const vibrate = () => {
    console.log('📳 Device vibrated!');
    // Actual mobile vibration would go here
  };
  
  const share = () => {
    console.log('📤 Sharing content...');
    // Mobile share API would go here
  };
  
  const takePhoto = () => {
    console.log('📸 Opening camera...');
    // Camera API would go here
  };
  
  return createElement('div', { className: `mobile-app ${theme}` },
    // Header
    createElement('div', { className: 'header' },
      createElement('h1', null, '📱 Dolphin Mobile'),
      createElement('div', { className: 'status-bar' },
        createElement('span', null, '4G'),
        createElement('span', null, '🔋 85%'),
        createElement('span', null, '🕐 14:30')
      )
    ),
    
    // Main content
    createElement('div', { className: 'content' },
      // Counter section
      createElement('div', { className: 'card' },
        createElement('h2', null, 'Counter'),
        createElement('div', { className: 'counter-display' },
          createElement('span', null, count)
        ),
        createElement('div', { className: 'button-group' },
          createElement('button', { 
            className: 'btn btn-primary',
            onClick: increment
          }, '➕ Increment'),
          createElement('button', { 
            className: 'btn btn-secondary',
            onClick: decrement
          }, '➖ Decrement')
        )
      ),
      
      // Mobile features
      createElement('div', { className: 'card' },
        createElement('h2', null, 'Mobile Features'),
        createElement('div', { className: 'feature-grid' },
          createElement('button', { 
            className: 'feature-btn',
            onClick: toggleTheme
          },
            createElement('span', { className: 'icon' }, '🌓'),
            createElement('span', null, 'Toggle Theme')
          ),
          createElement('button', { 
            className: 'feature-btn',
            onClick: vibrate
          },
            createElement('span', { className: 'icon' }, '📳'),
            createElement('span', null, 'Vibrate')
          ),
          createElement('button', { 
            className: 'feature-btn',
            onClick: share
          },
            createElement('span', { className: 'icon' }, '📤'),
            createElement('span', null, 'Share')
          ),
          createElement('button', { 
            className: 'feature-btn',
            onClick: takePhoto
          },
            createElement('span', { className: 'icon' }, '📸'),
            createElement('span', null, 'Camera')
          )
        )
      ),
      
      // Location info
      createElement('div', { className: 'card' },
        createElement('h2', null, 'Location'),
        location ? 
          createElement('div', { className: 'location-info' },
            createElement('p', null, `📍 Latitude: ${location.latitude}`),
            createElement('p', null, `📍 Longitude: ${location.longitude}`),
            createElement('small', null, 'Kathmandu, Nepal')
          ) :
          createElement('p', null, '🌍 Getting location...')
      ),
      
      // Device info
      createElement('div', { className: 'card' },
        createElement('h2', null, 'Device Info'),
        createElement('ul', { className: 'device-list' },
          createElement('li', null, '📱 Platform: Mobile'),
          createElement('li', null, '🖥️ OS: Android/iOS'),
          createElement('li', null, '🌐 Network: 4G'),
          createElement('li', null, '💾 Memory: 4GB'),
          createElement('li', null, '⚡ Battery: 85%')
        )
      )
    ),
    
    // Bottom navigation
    createElement('div', { className: 'bottom-nav' },
      createElement('button', { className: 'nav-btn active' },
        createElement('span', { className: 'nav-icon' }, '🏠'),
        createElement('span', { className: 'nav-text' }, 'Home')
      ),
      createElement('button', { className: 'nav-btn' },
        createElement('span', { className: 'nav-icon' }, '🔍'),
        createElement('span', { className: 'nav-text' }, 'Search')
      ),
      createElement('button', { className: 'nav-btn' },
        createElement('span', { className: 'nav-icon' }, '📱'),
        createElement('span', { className: 'nav-text' }, 'Apps')
      ),
      createElement('button', { className: 'nav-btn' },
        createElement('span', { className: 'nav-icon' }, '⚙️'),
        createElement('span', { className: 'nav-text' }, 'Settings')
      )
    )
  );
}

// CSS styles for mobile
const mobileCSS = `
.mobile-app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 400px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
}

.mobile-app.dark {
  background: #121212;
  color: white;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  text-align: center;
}

.header h1 {
  margin: 0;
  font-size: 24px;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 12px;
  opacity: 0.8;
}

.content {
  padding: 20px;
}

.card {
  background: white;
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.dark .card {
  background: #1e1e1e;
  color: white;
}

.counter-display {
  font-size: 48px;
  text-align: center;
  margin: 20px 0;
  font-weight: bold;
  color: #667eea;
}

.button-group {
  display: flex;
  gap: 10px;
}

.btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn:active {
  transform: scale(0.95);
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.dark .btn-secondary {
  background: #333;
  color: white;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 10px;
}

.feature-btn {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.2s;
}

.dark .feature-btn {
  background: #2d2d2d;
  border-color: #404040;
  color: white;
}

.feature-btn:active {
  background: #e9ecef;
}

.dark .feature-btn:active {
  background: #404040;
}

.icon {
  font-size: 24px;
}

.location-info {
  text-align: center;
}

.device-list {
  list-style: none;
  padding: 0;
}

.device-list li {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 10px;
}

.dark .device-list li {
  border-bottom-color: #333;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  display: flex;
  border-top: 1px solid #eee;
}

.dark .bottom-nav {
  background: #1e1e1e;
  border-top-color: #333;
}

.nav-btn {
  flex: 1;
  padding: 12px;
  background: none;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #666;
}

.dark .nav-btn {
  color: #999;
}

.nav-btn.active {
  color: #667eea;
}

.nav-icon {
  font-size: 20px;
}

.nav-text {
  font-size: 12px;
}
`;

// Create and run the mobile app
console.log('📱 Starting Mobile App...');
const app = createApp({
  platform: 'mobile',
  debug: true,
  meta: {
    viewport: 'width=device-width, initial-scale=1.0',
    themeColor: '#667eea'
  }
});

// For web simulation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = mobileCSS;
  document.head.appendChild(style);
  
  const element = MobileApp();
  console.log('📱 Mobile App Component:', element);
} else {
  console.log('📱 Running in Node.js environment');
  console.log('To view mobile UI, run in browser or React Native');
}

