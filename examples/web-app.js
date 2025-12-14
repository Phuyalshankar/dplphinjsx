// dolphinjs/examples/web-app.js
import { createApp, createElement, useState, useEffect } from '../index.js';

function App() {
  const [count, setCount] = useState(0);
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    console.log('App mounted or count changed:', count);

    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => {
      console.log('Cleaning up timer');
      clearInterval(timer);
    };
  }, [count]);

  return createElement(
    'div',
    { className: 'app' },
    createElement('h1', null, '🐬 DolphinJS Web App'),
    createElement('p', null, `Current Time: ${time}`),
    createElement('p', null, `Count: ${count}`),
    createElement(
      'button',
      { onClick: () => setCount(count + 1) },
      'Increment'
    ),
    createElement(
      'button',
      { onClick: () => setCount(0) },
      'Reset'
    )
  );
}

// Create and run the app
console.log('🚀 Starting DolphinJS Web App...');

const app = createApp({
  platform: 'web',
  debug: true
});

// For this example, we'll just log the component tree
const componentTree = App();
console.log('Component Tree:', JSON.stringify(componentTree, null, 2));

console.log('⚠️ Running in Node.js environment - DOM mounting skipped');
console.log('✅ Example completed successfully!');