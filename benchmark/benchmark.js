// benchmark/benchmark.js
'use strict';

const { createApp, createElement } = require('../index.js');
const { performance } = require('perf_hooks');

async function runBenchmarks() {
  console.log('🚀 DolphinJS Benchmark Suite\n');
  
  // 1. App Creation Benchmark
  console.log('1. App Creation Benchmark');
  const appCreationTimes = [];
  
  for (let i = 0; i < 100; i++) {
    const start = performance.now();
    createApp({ platform: 'web' });
    const end = performance.now();
    appCreationTimes.push(end - start);
  }
  
  const avgAppCreation = appCreationTimes.reduce((a, b) => a + b) / appCreationTimes.length;
  console.log(`   Average: ${avgAppCreation.toFixed(2)}ms\n`);
  
  // 2. Element Creation Benchmark
  console.log('2. Element Creation Benchmark');
  const elementCreationTimes = [];
  
  for (let i = 0; i < 1000; i++) {
    const start = performance.now();
    createElement('div', { className: 'test' }, `Element ${i}`);
    const end = performance.now();
    elementCreationTimes.push(end - start);
  }
  
  const avgElementCreation = elementCreationTimes.reduce((a, b) => a + b) / elementCreationTimes.length;
  console.log(`   Average: ${avgElementCreation.toFixed(3)}ms per element\n`);
  
  // 3. Component Rendering Benchmark
  console.log('3. Component Rendering Benchmark');
  
  const ComplexComponent = () => {
    return createElement('div', { className: 'container' },
      createElement('h1', null, 'Benchmark Test'),
      createElement('p', null, 'This is a performance test'),
      createElement('ul', null,
        ...Array.from({ length: 100 }, (_, i) =>
          createElement('li', { key: i }, `Item ${i}`)
        )
      )
    );
  };
  
  const renderingTimes = [];
  
  for (let i = 0; i < 50; i++) {
    const start = performance.now();
    ComplexComponent();
    const end = performance.now();
    renderingTimes.push(end - start);
  }
  
  const avgRendering = renderingTimes.reduce((a, b) => a + b) / renderingTimes.length;
  console.log(`   Average: ${avgRendering.toFixed(2)}ms for 100-item list\n`);
  
  // 4. Memory Usage
  console.log('4. Memory Usage');
  const initialMemory = process.memoryUsage();
  
  // Create many components
  const components = [];
  for (let i = 0; i < 10000; i++) {
    components.push(createElement('div', { id: `div-${i}` }, `Content ${i}`));
  }
  
  const finalMemory = process.memoryUsage();
  const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
  
  console.log(`   Memory used: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB for 10,000 elements\n`);
  
  // 5. Stress Test
  console.log('5. Stress Test - Nested Components');
  const startStress = performance.now();
  
  const createNestedTree = (depth, width) => {
    if (depth === 0) {
      return createElement('span', null, 'Leaf');
    }
    
    const children = [];
    for (let i = 0; i < width; i++) {
      children.push(createNestedTree(depth - 1, width));
    }
    
    return createElement('div', { className: `depth-${depth}` }, ...children);
  };
  
  const deepTree = createNestedTree(5, 3); // 3^5 = 243 elements
  const endStress = performance.now();
  
  console.log(`   Deep tree (243 elements): ${(endStress - startStress).toFixed(2)}ms\n`);
  
  // Summary
  console.log('📊 Benchmark Summary');
  console.log('====================');
  console.log(`App Creation: ${avgAppCreation.toFixed(2)}ms`);
  console.log(`Element Creation: ${avgElementCreation.toFixed(3)}ms`);
  console.log(`Component Rendering: ${avgRendering.toFixed(2)}ms`);
  console.log(`Memory per 10k elements: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Deep Tree Creation: ${(endStress - startStress).toFixed(2)}ms`);
}

if (require.main === module) {
  runBenchmarks().catch(console.error);
}

module.exports = { runBenchmarks };