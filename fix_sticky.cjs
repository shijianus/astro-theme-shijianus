const fs = require('fs');

let css = fs.readFileSync('src/styles/rebuild.css', 'utf-8');

// Replace any bad sticky overrides
css = css.replace(/body\[data-type='post'\] \.page-aside__sticky\s*\{[\s\S]*?\}/g, `body[data-type='post'] .page-aside__sticky {
  position: sticky;
  top: 78px;
  transition: top 0.3s;
}`);

css = css.replace(/body\[data-type='home'\] \.page-aside__sticky\s*\{[\s\S]*?\}/g, `body[data-type='home'] .page-aside__sticky {
  position: sticky;
  top: 78px;
  transition: top 0.3s;
}`);

// Ensure aside stretches
css = css.replace(/\.page-aside\s*\{[\s\S]*?\}/g, `.page-aside {
  width: 320px;
  align-self: stretch;
}`);

fs.writeFileSync('src/styles/rebuild.css', css);
console.log("Fixed sticky CSS in rebuild.css");
