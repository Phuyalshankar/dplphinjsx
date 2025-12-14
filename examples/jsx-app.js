// dolphinjs/examples/jsx-app.js - Ensure it's CommonJS
'use strict';

const dolphin = require('../index.js');
const { createApp, createElement, useState, Fragment } = dolphin;

// Using createElement directly (similar to JSX)
function Counter() {
  const [count, setCount] = useState(0);
  
  return createElement('div', { className: 'counter' },
    createElement('h2', null, 'Counter Example'),
    createElement('p', null, `Count: ${count}`),
    createElement('button', {
      onClick: () => setCount(count + 1)
    }, 'Increment'),
    createElement('button', {
      onClick: () => setCount(count - 1)
    }, 'Decrement'),
    createElement('button', {
      onClick: () => setCount(0)
    }, 'Reset')
  );
}

function UserList() {
  const [users, setUsers] = useState([
    { id: 1, name: 'Alice', age: 25 },
    { id: 2, name: 'Bob', age: 30 },
    { id: 3, name: 'Charlie', age: 35 }
  ]);
  
  return createElement('div', { className: 'user-list' },
    createElement('h2', null, 'User List'),
    createElement('ul', null,
      ...users.map(user =>
        createElement('li', { key: user.id },
          createElement('strong', null, user.name),
          createElement('span', null, ` (${user.age} years old)`)
        )
      )
    )
  );
}

function MainApp() {
  return createElement(Fragment, null,
    createElement('h1', null, '🐬 DolphinJS Demo App'),
    createElement('p', null, 'Welcome to the DolphinJS framework!'),
    createElement('hr', null),
    createElement(Counter, null),
    createElement('hr', null),
    createElement(UserList, null)
  );
}

console.log('🚀 Starting DolphinJS JSX App...');

const app = createApp({
  platform: 'web',
  debug: true
});

// Render the app
const appTree = MainApp();
console.log('App Component Tree:');
console.log(JSON.stringify(appTree, null, 2));

console.log('\n✅ JSX App example completed successfully!');

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Counter, UserList, MainApp };
}