// dolphinjs/examples/node-app.js
import { createApp, createElement, useState } from '../index.js';

function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn DolphinJS', completed: true },
    { id: 2, text: 'Build an app', completed: false },
    { id: 3, text: 'Deploy to production', completed: false }
  ]);
  const [input, setInput] = useState('');
  
  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { 
        id: Date.now(), 
        text: input, 
        completed: false 
      }]);
      setInput('');
    }
  };
  
  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };
  
  return createElement('div', { className: 'todo-app' },
    createElement('h1', null, '📝 Todo List'),
    createElement('div', { className: 'input-group' },
      createElement('input', {
        type: 'text',
        value: input,
        onChange: (e) => setInput(e.target.value),
        placeholder: 'Add a new todo...',
        onKeyPress: (e) => e.key === 'Enter' && addTodo()
      }),
      createElement('button', { onClick: addTodo }, 'Add')
    ),
    createElement('ul', { className: 'todo-list' },
      ...todos.map(todo =>
        createElement('li', { 
          key: todo.id,
          className: `todo-item ${todo.completed ? 'completed' : ''}`
        },
          createElement('input', {
            type: 'checkbox',
            checked: todo.completed,
            onChange: () => toggleTodo(todo.id)
          }),
          createElement('span', null, todo.text),
          createElement('button', {
            onClick: () => setTodos(todos.filter(t => t.id !== todo.id))
          }, '×')
        )
      )
    ),
    createElement('p', null, 
      `${todos.filter(t => t.completed).length} of ${todos.length} completed`
    )
  );
}

console.log('🚀 Starting DolphinJS Node.js App...');

const app = createApp({
  platform: 'node',
  debug: true
});

// Render the component tree
const componentTree = TodoApp();
console.log('Todo App Component Tree:');
console.log(JSON.stringify(componentTree, null, 2));

// Simulate some interactions
console.log('\n📊 Todo Statistics:');
const todos = componentTree.children[2].children;
console.log(`Total todos: ${todos.length}`);
console.log(`Completed: ${todos.filter(t => t.props.className.includes('completed')).length}`);

console.log('\n✅ Node.js example completed successfully!');