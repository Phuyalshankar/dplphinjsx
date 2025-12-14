#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const templates = {
  web: {
    name: 'Web App',
    description: 'Standard web application',
    dependencies: ['dolphinjs']
  },
  mobile: {
    name: 'Mobile App',
    description: 'Mobile app with hardware access',
    dependencies: ['dolphinjs', 'cordova']
  },
  electron: {
    name: 'Desktop App',
    description: 'Electron desktop application',
    dependencies: ['dolphinjs', 'electron']
  },
  embedded: {
    name: 'Embedded App',
    description: 'Embedded system application',
    dependencies: ['dolphinjs']
  }
};

function createApp(name, template = 'web') {
  console.log(`🚀 Creating DolphinJS ${templates[template].name}...`);
  
  const projectDir = path.join(process.cwd(), name);
  
  // Create project structure
  const structure = [
    `${name}/`,
    `${name}/src/`,
    `${name}/src/components/`,
    `${name}/src/pages/`,
    `${name}/src/styles/`,
    `${name}/src/utils/`,
    `${name}/public/`,
    `${name}/tests/`,
    `${name}/config/`
  ];
  
  structure.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
  
  // Create package.json
  const packageJson = {
    name,
    version: '1.0.0',
    description: `A DolphinJS ${templates[template].name}`,
    main: 'src/index.js',
    type: 'module',
    scripts: {
      dev: 'dolphin dev',
      build: 'dolphin build',
      serve: 'dolphin serve',
      test: 'jest',
      lint: 'eslint src/'
    },
    dependencies: {
      dolphinjs: '^1.0.0',
      ...(template === 'mobile' && { cordova: '^11.0.0' }),
      ...(template === 'electron' && { electron: '^25.0.0' })
    },
    devDependencies: {
      '@babel/core': '^7.24.0',
      '@babel/preset-react': '^7.23.3',
      'eslint': '^8.0.0',
      'jest': '^29.5.0'
    },
    keywords: ['dolphinjs', template, 'jsx'],
    author: '',
    license: 'MIT'
  };
  
  fs.writeFileSync(
    path.join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Create main App component
  const appComponent = `import { useState } from 'dolphinjs';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to DolphinJS!</h1>
        <p>You have clicked {count} times</p>
        <button onClick={() => setCount(count + 1)}>
          Click me
        </button>
      </header>
    </div>
  );
}

export default App;`;
  
  fs.writeFileSync(
    path.join(projectDir, 'src/App.jsx'),
    appComponent
  );
  
  // Create entry file
  const entryFile = `import { createApp } from 'dolphinjs';
import App from './App.jsx';

const dolphin = createApp({
  platform: '${template === 'electron' ? 'web' : template}',
  debug: process.env.NODE_ENV !== 'production',
  appId: '${name}'
});

// Mount the app
dolphin.mount('#root', App);

// Handle errors
dolphin.catch((error) => {
  console.error('App error:', error);
});

export default dolphin;`;
  
  fs.writeFileSync(
    path.join(projectDir, 'src/index.js'),
    entryFile
  );
  
  // Create HTML file
  const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name} - DolphinJS App</title>
    <link rel="stylesheet" href="./src/styles/App.css">
</head>
<body>
    <div id="root"></div>
    <script type="module" src="./src/index.js"></script>
</body>
</html>`;
  
  fs.writeFileSync(
    path.join(projectDir, 'public/index.html'),
    htmlTemplate
  );
  
  // Create CSS
  const css = `.App {
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}

.App-header {
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
}

button {
  background-color: #61dafb;
  border: none;
  padding: 12px 24px;
  font-size: 18px;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 20px;
}

button:hover {
  background-color: #4fa8c7;
}`;
  
  fs.writeFileSync(
    path.join(projectDir, 'src/styles/App.css'),
    css
  );
  
  // Create config files
  const babelConfig = {
    presets: ['@babel/preset-react']
  };
  
  fs.writeFileSync(
    path.join(projectDir, '.babelrc'),
    JSON.stringify(babelConfig, null, 2)
  );
  
  const eslintConfig = {
    env: {
      browser: true,
      es2021: true
    },
    extends: [
      'eslint:recommended',
      'plugin:react/recommended'
    ],
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      'react/react-in-jsx-scope': 'off'
    }
  };
  
  fs.writeFileSync(
    path.join(projectDir, '.eslintrc.json'),
    JSON.stringify(eslintConfig, null, 2)
  );
  
  // Create README
  const readme = `# ${name}

A DolphinJS ${templates[template].name}

## Getting Started

### Installation
\`\`\`bash
npm install
\`\`\`

### Development
\`\`\`bash
npm run dev
\`\`\`

### Build
\`\`\`bash
npm run build
\`\`\`

### Serve
\`\`\`bash
npm run serve
\`\`\`

## Project Structure

\`\`\`
${name}/
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── styles/        # CSS files
│   ├── utils/         # Utility functions
│   ├── App.jsx        # Main App component
│   └── index.js       # Entry point
├── public/            # Static files
├── tests/             # Test files
└── config/            # Configuration files
\`\`\`

## Features

- 🚀 Built with DolphinJS
- 📱 ${templates[template].description}
- ⚡ Hot reload in development
- 🎨 CSS support
- 🧪 Test-ready
- 📦 Production builds

## Learn More

- [DolphinJS Documentation](https://dolphinjs.dev)
- [JSX Guide](https://dolphinjs.dev/docs/jsx)
- [API Reference](https://dolphinjs.dev/docs/api)

## License

MIT
`;
  
  fs.writeFileSync(
    path.join(projectDir, 'README.md'),
    readme
  );
  
  console.log(`✅ Project created at ./${name}`);
  console.log(`\n📦 Next steps:`);
  console.log(`   cd ${name}`);
  console.log(`   npm install`);
  console.log(`   npm run dev\n`);
  
  // Initialize git if available
  try {
    execSync('git init', { cwd: projectDir, stdio: 'ignore' });
    console.log(`📚 Git repository initialized`);
  } catch (error) {
    // Git not available, skip
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const templateIndex = args.findIndex(arg => arg === '--template' || arg === '-t');
const template = templateIndex !== -1 ? args[templateIndex + 1] : 'web';
const name = args[0] || 'my-dolphin-app';

createApp(name, template);