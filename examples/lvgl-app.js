// dolphinjs/examples/lvgl-app.js
import { createApp, createElement, useState } from '../index.js';

function LVGLApp() {
  const [count, setCount] = useState(0);
  const [brightness, setBrightness] = useState(50);
  
  return createElement('div', { 
    className: 'lvgl-app',
    style: {
      backgroundColor: '#1a1a1a',
      padding: '20px'
    }
  },
    createElement('h1', { 
      style: { 
        color: '#6200EE',
        fontSize: '24px'
      }
    }, '🐬 LVGL Dashboard'),
    
    createElement('div', { className: 'card' },
      createElement('h2', { style: { color: '#FFFFFF' } }, 'Counter'),
      createElement('p', { style: { color: '#CCCCCC' } }, `Count: ${count}`),
      createElement('button', {
        onClick: () => setCount(count + 1),
        style: {
          backgroundColor: '#6200EE',
          color: '#FFFFFF',
          padding: '10px 20px',
          borderRadius: '8px',
          border: 'none'
        }
      }, 'Increment')
    ),
    
    createElement('div', { className: 'card' },
      createElement('h2', { style: { color: '#FFFFFF' } }, 'Brightness'),
      createElement('p', { style: { color: '#CCCCCC' } }, `${brightness}%`),
      createElement('input', {
        type: 'range',
        min: '0',
        max: '100',
        value: brightness,
        onChange: (e) => setBrightness(e.target.value),
        style: {
          width: '100%',
          height: '8px'
        }
      })
    ),
    
    createElement('div', { className: 'controls' },
      createElement('button', {
        onClick: () => console.log('LED On'),
        style: {
          backgroundColor: '#03DAC6',
          color: '#000000',
          padding: '10px',
          margin: '5px',
          borderRadius: '8px'
        }
      }, 'LED On'),
      
      createElement('button', {
        onClick: () => console.log('LED Off'),
        style: {
          backgroundColor: '#CF6679',
          color: '#000000',
          padding: '10px',
          margin: '5px',
          borderRadius: '8px'
        }
      }, 'LED Off')
    )
  );
}

console.log('🎨 Starting LVGL App...');

// In a real embedded system, we would use LVGL renderer
// For now, just log the component tree
const componentTree = LVGLApp();
console.log('LVGL App Structure:', JSON.stringify(componentTree, null, 2));

console.log('\n✅ LVGL example ready!');
console.log('To run on embedded device:');
console.log('1. Install LVGL library on your MCU');
console.log('2. Build with: npm run build:embedded -- --platform esp32 --display lvgl');