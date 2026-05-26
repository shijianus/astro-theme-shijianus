import React, { type CSSProperties, useState } from 'react';

const renderMarkdown = (text: string) => {
  // Support bold and italic, but output plain text for brackets/links naturally
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong style={{ fontWeight: 'bold' }} key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em style={{ fontStyle: 'italic' }} key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
};

type ProfileWidgetProps = {
  name: string;
  role: string;
  motto: string;
  bio?: string;
  avatar: string;
  cover: string;
  statusLabel: string;
  location: string;
  email: string;
  stats: {
    posts: number;
    categories: number;
    tags: number;
  };
  stack: string[];
  variant?: 'glass' | 'solid';
};

export function ProfileWidget({
  name,
  role,
  motto,
  bio,
  avatar,
  cover,
  email,
  variant,
}: ProfileWidgetProps) {
  const [sayHiIndex, setSayHiIndex] = useState(0);

  const sayHiPhrases = [
    "✨ 欢迎探索 💡",
    "💡 技术干货 ✖️ 避坑指南",
    "🚀 拓展数字边境 🛡️",
    "🧬 跨界折腾记录 🐧",
    "☕ 愿对你有启发",
  ];

  // Bio logic
  const rawBio = `🛠️ 沉迷架构与网络工程的日常折腾，热衷将抽象概念转化为落地实践。拒绝空泛大词，这里仅分享**真实的避坑指南与硬核干货**。\n🌌 游走于硅基代码边缘，持续构筑数字知识库。期冀这些带有温度的碎片化随笔，能为探索者提供些许**灵感启迪与实战参考**。`;

  let paragraphs = rawBio.split('\n').map(p => p.trim()).filter(Boolean);

  // Warnings and limits logic
  const rawLen = paragraphs.join('').replace(/(\*\*|\*|\[|\]|\(.*?\))/g, '').length;
  if (paragraphs.length !== 2) {
    console.warn('⚠️ [ProfileWidget] 推荐使用两段文字进行介绍，当前段落数：', paragraphs.length);
  }
  if (rawLen > 80 && rawLen <= 120) {
    console.info(`ℹ️ [ProfileWidget] 简介字数为 ${rawLen} 字 (软性建议不超过 80 字)`);
  }
  if (rawLen > 120) {
    console.error(`🚨 [ProfileWidget] 简介字数 (${rawLen}) 超过 120 字硬性限制，将被强制截断！`);
    paragraphs = [paragraphs.join(' ').substring(0, 117) + '...'];
  } else {
    paragraphs = paragraphs.slice(0, 2);
  }

  const style = {
    '--profile-cover': `url(${cover})`,
  } as CSSProperties;

  const variantClass = variant === 'glass' ? 'is-glass' : (variant === 'solid' ? 'is-solid' : '');

  return (
    <section className={`card-widget card-info profile-card ${variantClass}`} style={style}>
      <div className="card-content">
        <div className="author-info__sayhi-wrap">
          <div 
            id="author-info__sayhi" 
            onClick={() => setSayHiIndex((prev) => (prev + 1) % sayHiPhrases.length)}
            className="author-info__sayhi"
          >
            <span className="sayhi-inner">
              <span className="sayhi-text">{sayHiPhrases[sayHiIndex]}</span>
            </span>
          </div>
        </div>
        
        <div className="author-info-avatar">
          <img src={avatar} alt={name} className="avatar-img" />
          <div className="author-status" aria-hidden="true">
            <span className="status-emoji">💻</span>
          </div>
        </div>

        <div className="author-info__description">
          <div className="author-info__description-text">
            {paragraphs.map((p, i) => (
              <p key={i}>{renderMarkdown(p)}</p>
            ))}
          </div>
        </div>

        <div className="author-info__bottom-group">
          <a className="author-info__bottom-group-left" href="/about/" title={name}>
            <div className="author-info__name">{name}</div>
            <div className="author-info__desc">
              <div className="desc-motto">{motto}</div>
              <div className="desc-role">{role}</div>
            </div>
          </a>
          <div className="card-info-social-icons" aria-label="作者链接">
            <a className="social-icon" href={`mailto:${email}`} title="Email: shijianus@epocanvas.com">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/></svg>
            </a>
            <a className="social-icon" href="https://github.com/shijianus" target="_blank" rel="noreferrer" title="GitHub: shijianus">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="currentColor"/></svg>
            </a>
            <a className="social-icon" href="https://t.me/shijianus" target="_blank" rel="noreferrer" title="Telegram: shijianus">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" fill="currentColor"/></svg>
            </a>
            <a className="social-icon" href="https://b23.tv/OKblMqS" target="_blank" rel="noreferrer" title="Bilibili: KevinSparks">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373Z" fill="currentColor"/></svg>
            </a>
            <a className="social-icon" href="https://youtube.com/@techshijian" target="_blank" rel="noreferrer" title="YouTube: techshijian">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77.42-1.56.42-4.81.42-4.81s0-3.25-.42-4.81zM9.75 15.02V8.98L15.25 12l-5.5 3.02z" fill="currentColor"/></svg>
            </a>
            <a className="social-icon" href="https://instagram.com/techshijian" target="_blank" rel="noreferrer" title="Instagram: techshijian">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.074 4.771 4.771.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.148 3.252-1.074 4.771-4.771 4.771-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.074-4.771-4.771-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.148-3.252 1.074-4.771 4.771-4.771 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.67.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.337 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.337-.2 6.78-2.618 6.98-6.98.058-1.28.072-1.689.072-4.948s-.014-3.667-.072-4.947c-.2-4.338-2.617-6.78-6.98-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="currentColor"/></svg>
            </a>
            <a className="social-icon" href="https://discord.com/users/techshijian" target="_blank" rel="noreferrer" title="Discord: techshijian">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.072 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z" fill="currentColor"/></svg>
            </a>
            <a className="social-icon" href="https://threads.net/@techshijian" target="_blank" rel="noreferrer" title="Threads: techshijian">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z" fill="currentColor"/></svg>
            </a>
            <a className="social-icon" href="https://line.me/ti/p/kd-GMazFE9" target="_blank" rel="noreferrer" title="Line: exine">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" fill="currentColor"/></svg>
            </a>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .author-info-avatar {
          position: absolute;
          top: 42%;
          left: 50%;
          transform: translate(-50%, -50%);
          margin: 0;
          transition: cubic-bezier(.69,.39,0,1.21) .3s;
          pointer-events: none;
        }
        .profile-card:hover .author-info-avatar {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0);
        }
        .author-status {
          background: var(--white);
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          right: 0;
          bottom: 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .status-emoji {
          font-size: 14px;
          line-height: 1;
        }
        .author-info__description {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          padding: 0 1.5rem;
          opacity: 0;
          transition: 0.3s;
          pointer-events: none;
          position: absolute;
          top: 3.5rem;
          bottom: 8rem;
          left: 0;
          right: 0;
          overflow: hidden;
        }
        .profile-card:hover .author-info__description {
          opacity: 1;
        }
        .author-info__description-text {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          font-size: 0.9rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.95);
          font-weight: 500;
          text-align: left;
          width: 100%;
        }
        .author-info__description-text p {
          margin: 0;
          white-space: normal;
        }
        .author-info__sayhi-wrap {
          position: absolute;
          top: 1.2rem;
          left: 0;
          width: 100%;
          display: flex;
          justify-content: center;
          z-index: 30;
          pointer-events: none;
        }
        .author-info__sayhi {
          pointer-events: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 2px 12px;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          backdrop-filter: blur(4px);
          transition: transform 0.3s, background 0.3s;
          user-select: none;
          white-space: nowrap;
          transform: translateY(0);
        }
        .sayhi-inner {
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        .author-info__sayhi:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-3px);
        }
        .sayhi-text {
          font-size: 12px;
          color: var(--white);
        }
        .sayhi-hint {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }
        .author-info__bottom-group {
          position: absolute;
          bottom: 1rem;
          left: 1rem;
          right: 1rem;
          z-index: 20;
          pointer-events: auto;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 12px;
        }
        .author-info__bottom-group-left {
          flex: 1;
          max-width: 60%;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .author-info__name {
          font-size: 1.3rem;
          font-weight: 900;
          color: var(--white);
          line-height: 1.1;
          white-space: normal;
        }
        .author-info__desc {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.85);
          position: relative;
          min-height: 2.8em;
          width: 100%;
          white-space: normal;
        }
        .desc-motto, .desc-role {
          transition: opacity 0.3s, transform 0.3s;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          line-height: 1.3;
          white-space: normal;
          overflow: visible;
          text-overflow: clip;
        }
        .desc-role {
          opacity: 0;
          transform: translateY(10px);
          font-weight: 500;
        }
        .profile-card:hover .desc-motto {
          opacity: 0;
          transform: translateY(-10px);
        }
        .profile-card:hover .desc-role {
          opacity: 1;
          transform: translateY(0);
        }
        .card-info-social-icons {
          display: grid;
          grid-template-columns: repeat(3, 30px);
          grid-template-rows: repeat(3, 30px);
          gap: 6px;
          width: 102px;
          flex-shrink: 0;
        }
        .card-info-social-icons .social-icon:nth-child(1) { grid-area: 3 / 3 / 4 / 4; }
        .card-info-social-icons .social-icon:nth-child(2) { grid-area: 2 / 3 / 3 / 4; }
        .card-info-social-icons .social-icon:nth-child(3) { grid-area: 3 / 2 / 4 / 3; }
        .card-info-social-icons .social-icon:nth-child(4) { grid-area: 2 / 2 / 3 / 3; }
        .card-info-social-icons .social-icon:nth-child(5) { grid-area: 1 / 3 / 2 / 4; }
        .card-info-social-icons .social-icon:nth-child(6) { grid-area: 1 / 2 / 2 / 3; }
        .card-info-social-icons .social-icon:nth-child(7) { grid-area: 3 / 1 / 4 / 2; }
        .card-info-social-icons .social-icon:nth-child(8) { grid-area: 2 / 1 / 3 / 2; }
        .card-info-social-icons .social-icon:nth-child(9) { grid-area: 1 / 1 / 2 / 2; }

        .card-info-social-icons .social-icon svg {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          padding: 6px;
          transition: 0.3s;
          color: var(--white);
        }
        .card-info-social-icons .social-icon:hover svg {
          background: var(--white);
          color: var(--theme-main);
          transform: translateY(-3px);
        }
        .profile-card.is-glass {
          background: rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(10px);
        }
        .profile-card.is-solid {
          background: var(--card-bg) !important;
        }
      `}} />
    </section>
  );
}
