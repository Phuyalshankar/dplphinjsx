#!/usr/bin/env node
// dolphin-jsx-core/compiler/cli.js
'use strict';

import { compiler } from './babel-compiler.js';
import fs from 'fs';
import path from 'path';
import { program } from 'commander';

program
  .name('dolphin-jsx')
  .description('Compile JSX files for Dolphin Framework')
  .version('1.0.0')
  .option('-i, --input <file>', 'Input JSX file')
  .option('-o, --output <file>', 'Output JS file')
  .option('-p, --platform <platform>', 'Target platform', 'web')
  .option('-m, --minify', 'Minify output', false)
  .option('-s, --source-maps', 'Generate source maps', false)
  .option('-w, --watch', 'Watch for changes', false);

program.parse(process.argv);

const options = program.opts();

async function compileFile(inputPath, outputPath) {
  try {
    const code = fs.readFileSync(inputPath, 'utf8');
    const result = await compiler.compile(code, {
      filename: path.basename(inputPath),
      platform: options.platform,
      minify: options.minify,
      sourceMaps: options.sourceMaps
    });
    
    fs.writeFileSync(outputPath, result.code);
    
    if (result.map && options.sourceMaps) {
      fs.writeFileSync(outputPath + '.map', JSON.stringify(result.map));
    }
    
    console.log(`✅ Compiled: ${inputPath} -> ${outputPath}`);
    console.log(`   Size: ${result.metadata.size.input} -> ${result.metadata.size.output}`);
    console.log(`   Compression: ${result.metadata.size.compression}`);
    
  } catch (error) {
    console.error(`❌ Compilation failed: ${error.message}`);
    process.exit(1);
  }
}

if (options.input && options.output) {
  compileFile(options.input, options.output);
  
  if (options.watch) {
    console.log(`👀 Watching ${options.input} for changes...`);
    fs.watch(options.input, (eventType) => {
      if (eventType === 'change') {
        console.log(`🔄 File changed, recompiling...`);
        compileFile(options.input, options.output);
      }
    });
  }
} else {
  program.help();
}
