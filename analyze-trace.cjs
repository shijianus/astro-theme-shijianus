const fs = require('fs');

function analyzeTrace(filename) {
  const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
  const events = data.traceEvents;

  let paintTime = 0;
  let rafTime = 0;
  let rafCount = 0;
  let longTasksCount = 0;
  let maxTaskTime = 0;
  let totalTaskTime = 0;
  
  for (const event of events) {
    if (event.ph === 'X') {
      const dur = event.dur / 1000; // ms
      if (event.name === 'Paint') paintTime += dur;
      if (event.name === 'FireAnimationFrame') {
        rafTime += dur;
        rafCount++;
      }
      if (event.name === 'RunTask') {
        totalTaskTime += dur;
        if (dur > 50) {
          longTasksCount++;
          if (dur > maxTaskTime) maxTaskTime = dur;
        }
      }
    }
  }

  console.log(`--- ${filename} ---`);
  console.log(`Paint Time: ${paintTime.toFixed(2)} ms`);
  console.log(`FireAnimationFrame calls: ${rafCount}, Total time: ${rafTime.toFixed(2)} ms`);
  console.log(`Long Tasks (>50ms): ${longTasksCount} 💥`);
  console.log(`Max Task Duration: ${maxTaskTime.toFixed(2)} ms`);
}

analyzeTrace('trace-light.json');
analyzeTrace('trace-dark.json');
if (fs.existsSync('trace-aurora.json')) {
  analyzeTrace('trace-aurora.json');
}
