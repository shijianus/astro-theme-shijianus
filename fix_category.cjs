const fs = require('fs');

let css = fs.readFileSync('src/styles/rebuild.css', 'utf-8');

// Make sure categoryItem transitions its flex/width property
if (!css.includes('transition: flex')) {
  css += `\n
body[data-type='home'] .categoryItem {
  transition: flex 0.4s ease, width 0.4s ease, background 0.4s ease, transform 0.4s ease, box-shadow 0.4s ease !important;
}
body[data-type='home'] .categoryGroup:hover .categoryItem:not(:hover):not(:focus-within) {
  flex: 1 1 20%;
}
body[data-type='home'] .categoryItem:is(:hover, :focus-within) {
  flex: 1 1 50% !important;
}
body[data-type='home'] .categoryItem:is(:hover, :focus-within) .categoryButtonIcon {
  transform: rotate(0deg) scale(1.1) !important;
  opacity: 0.8 !important;
  right: 15px !important;
  transition: transform 0.4s ease, opacity 0.4s ease, right 0.4s ease !important;
}
body[data-type='home'] .categoryItem .categoryButtonIcon {
  transition: transform 0.4s ease, opacity 0.4s ease, right 0.4s ease !important;
  transform: rotate(15deg) scale(1) !important;
}
`;
}

fs.writeFileSync('src/styles/rebuild.css', css);
console.log("Fixed Category Item Animations");
