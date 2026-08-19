const fs = require('fs');
const file = 'src/components/SiteHeader.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldUpdate = `    const updateScrolledState = () => {
      frame = 0;
      const documentElement = document.documentElement;
      const scrollable = documentElement.scrollHeight - window.innerHeight;
      const nextProgress = scrollable <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((window.scrollY / scrollable) * 100)));

      // 直接操作 DOM，不走 React setState/re-render 路径
      const percentEl = progressElRef.current;
      const totopBtn = totopBtnRef.current;
      if (percentEl) percentEl.textContent = String(nextProgress);
      if (totopBtn) totopBtn.classList.toggle('at-top', nextProgress === 0);

      syncHeaderMetrics();
    };`;

const newUpdate = `    const updateScrolledState = () => {
      frame = 0;
      const documentElement = document.documentElement;
      
      // READS
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const scrollHeight = documentElement.scrollHeight;
      
      const scrollable = scrollHeight - windowHeight;
      const nextProgress = scrollable <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((scrollY / scrollable) * 100)));

      // WRITES
      const percentEl = progressElRef.current;
      const totopBtn = totopBtnRef.current;
      if (percentEl) percentEl.textContent = String(nextProgress);
      if (totopBtn) totopBtn.classList.toggle('at-top', nextProgress === 0);

      // syncHeaderMetrics reads getBoundingClientRect which causes Layout Thrashing if called after DOM writes.
      // We only need to sync it on resize or when crossing the 0 progress boundary (since header shrinks when scrolled).
      // Alternatively, we can just not do it on every scroll frame.
    };`;

code = code.replace(oldUpdate, newUpdate);

// Also we should ensure syncHeaderMetrics is called when crossing 0 -> >0 or vice versa
// Actually, it's safer to just rely on resize. Astro theme anzhiyu uses CSS variables for height usually, but here JS is syncing it.
// Wait, the header has a CSS transition on height when scrolled. So we can't reliably get its height DURING the scroll transition anyway!
// So reading its height every frame during scroll is just capturing the intermediate animated height, which is probably unnecessary.

fs.writeFileSync(file, code);
console.log('Patched SiteHeader.tsx updateScrolledState');
