#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const { build } = require('../build/build-system.js');
const { compiler } = require('../compiler/transform-jsx.js');
const fs = require('fs');
const path = require('path');

program
  .name('dolphin')
  .description('DolphinJS CLI - Universal JSX Framework')
  .version('1.0.0');

program
  .command('new <name>')
  .description('Create a new DolphinJS project')
  .option('-t, --template <template>', 'Project template (web, mobile, desktop, embedded)', 'web')
  .action((name, options) => {
    console.log(`🚀 Creating new DolphinJS project: ${name}`);
    createProject(name, options.template);
  });

program
  .command('build')
  .description('Build project for target platform')
  .option('-t, --target <target>', 'Target platform', 'web')
  .option('-o, --output <dir>', 'Output directory', './dist')
  .option('-m, --minify', 'Minify output', false)
  .action(async (options) => {
    console.log(`🏗️ Building for ${options.target}...`);
    try {
      await build({
        target: options.target,
        output: options.output,
        minify: options.minify
      });
      console.log(`✅ Build complete: ${path.resolve(options.output)}`);
    } catch (error) {
      console.error(`❌ Build failed: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('serve')
  .description('Serve built project')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('-d, --dir <dir>', 'Directory to serve', './dist/web')
  .action((options) => {
    console.log(`🌐 Serving on http://localhost:${options.port}`);
    require('child_process').execSync(
      `npx serve ${options.dir} -p ${options.port}`,
      { stdio: 'inherit' }
    );
  });

program
  .command('compile <file>')
  .description('Compile JSX file')
  .option('-o, --output <file>', 'Output file')
  .option('-p, --platform <platform>', 'Target platform', 'web')
  .action(async (file, options) => {
    console.log(`🔧 Compiling ${file}...`);
    try {
      const code = fs.readFileSync(file, 'utf8');
      const result = await compiler.compile(code, {
        filename: file,
        platform: options.platform
      });
      
      const outputFile = options.output || file.replace(/\.jsx?$/, '.compiled.js');
      fs.writeFileSync(outputFile, result.code);
      console.log(`✅ Compiled to: ${outputFile}`);
    } catch (error) {
      console.error(`❌ Compilation failed: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('dev')
  .description('Start development server')
  .action(() => {
    console.log('🚀 Starting development server...');
    require('child_process').execSync('node examples/web-app.js', {
      stdio: 'inherit'
    });
  });

function createProject(name, template) {
  const templates = {
    web: {
      files: {
        'package.json': JSON.stringify({
          name,
          version: '1.0.0',
          type: 'module',
          scripts: {
            dev: 'dolphin dev',
            build: 'dolphin build',
            serve: 'dolphin serve'
          },
          dependencies: {
            'dolphinjs': '^1.0.0'
          }
        }, null, 2),
        'src/App.jsx': `import { useState } from 'dolphinjs';

function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="app">
      <h1>Hello DolphinJS!</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default App;`,
        'src/index.js': `import { createApp } from 'dolphinjs';
import App from './App.jsx';

const app = createApp({
  platform: 'web',
  debug: true
});

app.mount('#root', App);`,
        'index.html': `<!DOCTYPE html>
<html>
<head>
    <title>${name}</title>
    <style>
        body { margin: 0; font-family: sans-serif; }
        .app { padding: 20px; text-align: center; }
        button { padding: 10px 20px; font-size: 16px; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="./src/index.js"></script>
</body>
</html>`
      }
    }
  };

  const projectDir = path.join(process.cwd(), name);
  
  if (fs.existsSync(projectDir)) {
    console.error(`❌ Directory ${name} already exists`);
    process.exit(1);
  }
  
  fs.mkdirSync(projectDir, { recursive: true });
  fs.mkdirSync(path.join(projectDir, 'src'), { recursive: true });
  
  const templateFiles = templates[template]?.files || templates.web.files;
  
  Object.entries(templateFiles).forEach(([filePath, content]) => {
    const fullPath = path.join(projectDir, filePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content);
  });
  
  console.log(`✅ Project created: ${projectDir}`);
  console.log(`📦 Next steps:`);
  console.log(`   cd ${name}`);
  console.log(`   npm install`);
  console.log(`   npm run dev`);
}

program.parse(process.argv);