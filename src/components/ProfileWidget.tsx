import React, { type CSSProperties, useState } from 'react';

type ProfileWidgetProps = {
  name: string;
  role: string;
  motto: string;
  bio: string;
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

  const style = {
    '--profile-cover': `url(${cover})`,
  } as CSSProperties;

  const variantClass = variant === 'glass' ? 'is-glass' : (variant === 'solid' ? 'is-solid' : '');

  return (
    <section className={`card-widget card-info profile-card ${variantClass}`} style={style}>
      <div className="card-content">
        <div 
          id="author-info__sayhi" 
          onClick={() => setSayHiIndex((prev) => (prev + 1) % sayHiPhrases.length)}
          className="author-info__sayhi"
        >
          <span className="sayhi-text">{sayHiPhrases[sayHiIndex]}</span>
          <span className="sayhi-hint">➔</span>
        </div>
        
        <div className="author-info-avatar">
          <img src={avatar} alt={name} className="avatar-img" />
          <div className="author-status" aria-hidden="true">
            <span className="status-emoji">💻</span>
          </div>
        </div>

        <div className="author-info__description">
          <div className="author-info__description-text">
            这里分享系统重构与数字边境的探索指南，希望能为你提供一些跨界折腾的实用技巧。
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
            <a className="social-icon" href={`mailto:${email}`} title="Email">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/></svg>
            </a>
            <a className="social-icon" href="https://github.com/shijianus" target="_blank" rel="noreferrer" title="GitHub">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="currentColor"/></svg>
            </a>
            <a className="social-icon" href="https://t.me/shijianus" target="_blank" rel="noreferrer" title="Telegram">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" fill="currentColor"/></svg>
            </a>
            <a className="social-icon" href="https://b23.tv/OKblMqS" target="_blank" rel="noreferrer" title="KevinSparks">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76V14.85c-.036 1.51-.556 2.769-1.56 3.765-1.004.995-2.263 1.519-3.773 1.573H5.187c-1.51-.054-2.769-.578-3.773-1.573-1.004-.996-1.524-2.254-1.56-3.765V10.01c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.263-1.52 3.773-1.574h.774L4.39 2.193a.6.6 0 01.209-.825.6.6 0 01.822.209l2.76 4.074h7.639l2.76-4.074a.6.6 0 01.822-.209.6.6 0 01.209.825l-1.632 2.459zm0 2.479H6.187c-1.035.05-1.888.41-2.563 1.08-.675.67-1.042 1.52-1.085 2.564V14.85c.043 1.035.41 1.888 1.085 2.564.675.67 1.528 1.03 2.563 1.08h11.626c1.035-.05 1.888-.41 2.563-1.08.675-.676 1.042-1.529 1.085-2.564V10.776c-.043-1.035-.41-1.888-1.085-2.564-.675-.67-1.528-1.03-2.563-1.08zM8.5 9.508c.69 0 1.25.56 1.25 1.25v2c0 .69-.56 1.25-1.25 1.25s-1.25-.56-1.25-1.25v-2c0-.69.56-1.25 1.25-1.25zm7 0c.69 0 1.25.56 1.25 1.25v2c0 .69-.56 1.25-1.25 1.25s-1.25-.56-1.25-1.25v-2c0-.69.56-1.25 1.25-1.25z" fill="currentColor"/></svg>
            </a>
            <a className="social-icon" href="https://youtube.com/@techshijian" target="_blank" rel="noreferrer" title="YouTube">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77.42-1.56.42-4.81.42-4.81s0-3.25-.42-4.81zM9.75 15.02V8.98L15.25 12l-5.5 3.02z" fill="currentColor"/></svg>
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
          align-items: center;
          height: 100%;
          padding: 2rem 1.2rem;
          opacity: 0;
          transition: 0.3s;
          pointer-events: none;
          text-align: center;
          position: absolute;
          inset: 0;
        }
        .profile-card:hover .author-info__description {
          opacity: 1;
        }
        .author-info__description-text {
          font-size: 1rem;
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
        }
        .author-info__sayhi {
          z-index: 10;
          position: absolute;
          top: 1.2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          width: fit-content;
          padding: 2px 12px;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          backdrop-filter: blur(4px);
          transition: 0.3s;
          user-select: none;
        }
        .author-info__sayhi:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateX(-50%) scale(1.05);
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
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .author-info__name {
          font-size: 1.4rem;
          font-weight: 900;
          color: var(--white);
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .author-info__desc {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.85);
          position: relative;
          min-height: 2.8em; /* Allow 2 lines */
        }
        .desc-motto, .desc-role {
          transition: opacity 0.3s, transform 0.3s;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          line-height: 1.3;
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
          gap: 6px;
          direction: rtl;
          flex-shrink: 0;
        }
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
