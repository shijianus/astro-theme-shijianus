import React, { type CSSProperties, useState, useEffect } from 'react';

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
  bio,
  avatar,
  cover,
  statusLabel,
  location,
  email,
  stats,
  stack,
  variant,
}: ProfileWidgetProps) {
  const [sayHiIndex, setSayHiIndex] = useState(0);

  const sayHiPhrases = [
    "✨ 欢迎探索 ➔",
    "💡 纯粹技术干货",
    "🚀 拓展数字边境",
    "🧬 跨界折腾记录",
    "☕ 愿对你有启发",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSayHiIndex((prev) => (prev + 1) % sayHiPhrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [sayHiPhrases.length]);

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
          {sayHiPhrases[sayHiIndex]}
        </div>
        
        <div className="author-info-avatar">
          <img src={avatar} alt={name} className="avatar-img" />
          <div className="author-status" aria-hidden="true">
            <span>🟢</span>
          </div>
        </div>

        <div className="author-info__description">
          <div className="author-info__description-text">
            这里分享系统重构与数字边境的探索指南，希望能为你提供一些跨界折腾的实用技巧。
          </div>
          <div className="profile-card__stack">
            {stack.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <div className="author-info__bottom-group">
          <a className="author-info__bottom-group-left" href="/about/" title={name}>
            <div className="author-info__name">{name}</div>
            <div className="author-info__desc">{motto}</div>
          </a>
          <div className="card-info-social-icons is-center" aria-label="作者链接">
            <a className="social-icon" href={`mailto:${email}`} title="Email">
              <i className="shijianusfont shijianus-icon-envelope" aria-hidden="true" />
            </a>
            <a className="social-icon" href="https://github.com/shijianus" target="_blank" rel="noreferrer" title="GitHub">
              <i className="shijianusfont shijianus-icon-github" aria-hidden="true" />
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
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          margin: 0;
          transition: cubic-bezier(.69,.39,0,1.21) .3s;
        }
        .profile-card:hover .author-info-avatar {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0);
        }
        .author-status {
          font-size: 14px;
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
        }
        .author-status span {
          background: transparent !important;
          box-shadow: none !important;
          width: auto !important;
          height: auto !important;
        }
        .author-info__description {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          height: 100%;
          padding: 2rem 1.2rem;
        }
        .author-info__description-text {
          font-size: 1rem;
          line-height: 1.8;
          margin-bottom: 1.5rem;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
        }
        .author-info__name {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--white);
        }
        .author-info__desc {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.8);
          margin-top: 2px;
        }
        .card-info-social-icons .social-icon i,
        .card-info-social-icons .social-icon svg {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          padding: 6px;
          transition: 0.3s;
        }
        .card-info-social-icons .social-icon:hover i,
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
