function arcPath(cx, cy, r, startDeg, endDeg) {
  const startRad = (startDeg * Math.PI) / 180;
  const endRad = (endDeg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  const sweep = endDeg > startDeg ? 1 : 0;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 ${largeArc} ${sweep} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

function diffractionStar(cx, cy, size, opacity = 1, color = '#ffffff') {
  const arm = size;
  const sub = size * 0.28;
  return `<g transform="translate(${cx}, ${cy})" opacity="${opacity}">
    <path d="M 0 ${-arm} Q 0 0 ${arm} 0 Q 0 0 0 ${arm} Q 0 0 ${-arm} 0 Q 0 0 0 ${-arm} Z" fill="${color}" />
    <circle cx="0" cy="0" r="${sub}" fill="#ffffff" />
    <circle cx="0" cy="0" r="${arm * 1.6}" fill="${color}" opacity="0.35" filter="blur(1px)" />
  </g>`;
}

// 真实长曝光天文星轨系统
// 天极位于 (340, -40)，横跨 0~320 x 0~114
function generateFrontStarTrails() {
  const cx = 340;
  const cy = -40;
  const count = 32;
  let lines = [];
  
  lines.push(`<!-- 天文长曝光同心星轨群 (Long Exposure Star Trails) -->`);
  
  for (let i = 0; i < count; i++) {
    const r = 50 + i * (380 / count);
    const s = 100 + ((i * 17) % 24);
    const e = 188 + ((i * 23) % 36);
    
    // 星等阶梯: 0等主星(纯白发光)、1-2等中星(冰蓝)、3-5等暗星(细青)
    const isMajor = (i % 7 === 0);
    const isMedium = (i % 3 === 0 && !isMajor);
    
    let strokeWidth = 0.5;
    let opacity = 0.18;
    let color = '#7dd3fc';
    
    if (isMajor) {
      strokeWidth = 1.35;
      opacity = 0.65;
      color = '#ffffff';
    } else if (isMedium) {
      strokeWidth = 0.85;
      opacity = 0.4;
      color = '#bae6fd';
    } else if (i % 2 === 0) {
      strokeWidth = 0.6;
      opacity = 0.26;
      color = '#38bdf8';
    }
    
    const d = arcPath(cx, cy, r, s, e);
    const isDashed = (i % 5 === 2);
    const dashAttr = isDashed ? ` stroke-dasharray="36 9 18 6"` : '';
    
    if (isMajor) {
      lines.push(`  <path d="${d}" fill="none" stroke="${color}" stroke-width="${(strokeWidth * 2.2).toFixed(1)}" opacity="${(opacity * 0.28).toFixed(2)}" stroke-linecap="round" filter="blur(1px)"/>`);
    }
    lines.push(`  <path d="${d}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity="${opacity}" stroke-linecap="round"${dashAttr}/>`);
    
    // 亮星轨上的星核点
    if (isMajor || i === 11 || i === 19 || i === 27) {
      const angle = s + (e - s) * 0.62;
      const rad = (angle * Math.PI) / 180;
      const sx = cx + r * Math.cos(rad);
      const sy = cy + r * Math.sin(rad);
      if (sx >= 5 && sx <= 315 && sy >= 5 && sy <= 109) {
        lines.push(`  <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${(strokeWidth * 0.9).toFixed(1)}" fill="#ffffff" opacity="${Math.min(1, opacity + 0.35)}" />`);
      }
    }
  }

  // 衍射星芒 (Diffraction Spikes)
  lines.push(`<!-- 天文望远镜四角十字衍射星芒 -->`);
  lines.push(diffractionStar(188, 76, 7.0, 0.92, '#ffffff'));
  lines.push(diffractionStar(136, 24, 4.6, 0.8, '#bae6fd'));
  lines.push(diffractionStar(270, 86, 4.0, 0.72, '#e0f2fe'));
  lines.push(diffractionStar(218, 98, 3.2, 0.58, '#7dd3fc'));

  // 彗星流光划痕 (Shooting Meteor Trail)
  lines.push(`<!-- 彗星流光划痕 -->`);
  lines.push(`  <path d="M 125 14 L 182 50" stroke="url(#promo-meteor-grad)" stroke-width="1.6" stroke-linecap="round" />`);
  lines.push(`  <circle cx="182" cy="50" r="1.6" fill="#ffffff" />`);
  lines.push(`  <circle cx="182" cy="50" r="4.2" fill="#38bdf8" opacity="0.6" filter="blur(1px)" />`);

  // 飞机破空切线喷气微流光
  lines.push(`<!-- 纸飞机破空切线航迹 -->`);
  lines.push(`  <path d="M 170 66 C 198 48, 222 34, 236 25" fill="none" stroke="rgba(255, 255, 255, 0.55)" stroke-width="1.2" stroke-dasharray="3 3" stroke-linecap="round" />`);

  return lines.join('\n');
}

// 背面长曝光星轨（更柔和通透，烘托中央二维码）
function generateBackStarTrails() {
  const cx = 340;
  const cy = -40;
  const count = 16;
  let lines = [];
  
  lines.push(`<!-- 背面长曝光星轨微光底纹 -->`);
  for (let i = 0; i < count; i++) {
    const r = 70 + i * (350 / count);
    const s = 105 + ((i * 15) % 20);
    const e = 180 + ((i * 20) % 30);
    const isBright = (i % 4 === 0);
    const w = isBright ? 1.0 : 0.6;
    const op = isBright ? 0.32 : 0.16;
    const color = isBright ? '#e0f2fe' : '#7dd3fc';
    const d = arcPath(cx, cy, r, s, e);
    lines.push(`  <path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" opacity="${op}" stroke-linecap="round"/>`);
  }
  
  lines.push(diffractionStar(120, 26, 4.0, 0.65, '#bae6fd'));
  lines.push(diffractionStar(285, 82, 3.5, 0.55, '#e0f2fe'));

  return lines.join('\n');
}

console.log('=== FRONT TRAILS ===');
console.log(generateFrontStarTrails());
console.log('\n=== BACK TRAILS ===');
console.log(generateBackStarTrails());
