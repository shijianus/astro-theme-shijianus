const fs = require('fs');

function analyzeTrace(filename) {
  const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
  const events = data.traceEvents;

  let paintTime = 0;
  let compositeTime = 0;
  let layerTreeTime = 0;
  let rafTime = 0;
  let rafCount = 0;
  
  for (const event of events) {
    if (event.ph === 'X') {
      const dur = event.dur / 1000; // ms
      if (event.name === 'Paint') paintTime += dur;
      if (event.name === 'CompositeLayers') compositeTime += dur;
      if (event.name === 'UpdateLayerTree') layerTreeTime += dur;
      if (event.name === 'requestAnimationFrame') {
        rafTime += dur;
        rafCount++;
      }
      if (event.name === 'FireAnimationFrame') {
        rafTime += dur;
        rafCount++;
      }
    }
  }

  console.log(`--- ${filename} ---`);
  console.log(`Paint Time: ${paintTime.toFixed(2)} ms`);
  console.log(`UpdateLayerTree Time: ${layerTreeTime.toFixed(2)} ms`);
  console.log(`CompositeLayers Time: ${compositeTime.toFixed(2)} ms`);
  console.log(`requestAnimationFrame/FireAnimationFrame calls: ${rafCount}, Total time: ${rafTime.toFixed(2)} ms`);
}

analyzeTrace('trace-light.json');
analyzeTrace('trace-dark.json');
