import React, { type CSSProperties, useState } from 'react';

const renderMarkdown = (text: string) => {
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
            <p style={{ marginBottom: '0.8rem' }}>{renderMarkdown("分享系统重构、Zero Trust 架构与数字边境的探索指南。")}</p>
            <p>{renderMarkdown("游走于碳基生命与硅基代码的交界，**提炼极客向的折腾日记与实用技巧**。")}</p>
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
            <a className="social-icon" href="https://youtube.com/@techshijian" target="_blank" rel="noreferrer" title="YouTube">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77.42-1.56.42-4.81.42-4.81s0-3.25-.42-4.81zM9.75 15.02V8.98L15.25 12l-5.5 3.02z" fill="currentColor"/></svg>
            </a>
            <a className="social-icon" href="https://b23.tv/OKblMqS" target="_blank" rel="noreferrer" title="Bilibili">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76V14.85c-.036 1.51-.556 2.769-1.56 3.765-1.004.995-2.263 1.519-3.773 1.573H5.187c-1.51-.054-2.769-.578-3.773-1.573-1.004-.996-1.524-2.254-1.56-3.765V10.01c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.263-1.52 3.773-1.574h.774L4.39 2.193a.6.6 0 01.209-.825.6.6 0 01.822.209l2.76 4.074h7.639l2.76-4.074a.6.6 0 01.822-.209.6.6 0 01.209.825l-1.632 2.459zm0 2.479H6.187c-1.035.05-1.888.41-2.563 1.08-.675.67-1.042 1.52-1.085 2.564V14.85c.043 1.035.41 1.888 1.085 2.564.675.67 1.528 1.03 2.563 1.08h11.626c1.035-.05 1.888-.41 2.563-1.08.675-.676 1.042-1.529 1.085-2.564V10.776c-.043-1.035-.41-1.888-1.085-2.564-.675-.67-1.528-1.03-2.563-1.08zM8.5 9.508c.69 0 1.25.56 1.25 1.25v2c0 .69-.56 1.25-1.25 1.25s-1.25-.56-1.25-1.25v-2c0-.69.56-1.25 1.25-1.25zm7 0c.69 0 1.25.56 1.25 1.25v2c0 .69-.56 1.25-1.25s-1.25-.56-1.25-1.25v-2c0-.69.56-1.25 1.25-1.25z" fill="currentColor"/></svg>
            </a>
            <a className="social-icon" href="https://t.me/shijianus" target="_blank" rel="noreferrer" title="Telegram">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" fill="currentColor"/></svg>
            </a>
            <a className="social-icon" href="https://github.com/shijianus" target="_blank" rel="noreferrer" title="GitHub">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="currentColor"/></svg>
            </a>
            <a className="social-icon" href="mailto:shijianus@epocanvas.com" title="Email">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/></svg>
            </a>
            <a className="social-icon" href="https://instagram.com/techshijian" target="_blank" rel="noreferrer" title="Instagram">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.074 4.771 4.771.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.148 3.252-1.074 4.771-4.771 4.771-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.074-4.771-4.771-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.148-3.252 1.074-4.771 4.771-4.771 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.67.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.337 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.337-.2 6.78-2.618 6.98-6.98.058-1.28.072-1.689.072-4.948s-.014-3.667-.072-4.947c-.2-4.338-2.617-6.78-6.98-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="currentColor"/></svg>
            </a>
            <a className="social-icon" href="https://discord.com/users/techshijian" target="_blank" rel="noreferrer" title="Discord">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.072 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z" fill="currentColor"/></svg>
            </a>
            <a className="social-icon" href="https://threads.net/@techshijian" target="_blank" rel="noreferrer" title="Threads">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z" fill="currentColor"/></svg>
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
          justify-content: flex-start;
          align-items: flex-start;
          padding: 3rem 1.5rem 0 1.5rem;
          opacity: 0;
          transition: 0.3s;
          pointer-events: none;
          position: absolute;
          top: 0;
          bottom: 6rem;
          left: 0;
          right: 0;
          text-align: left;
          overflow: hidden;
        }
        .profile-card:hover .author-info__description {
          opacity: 1;
        }
        .author-info__description-text {
          font-size: 0.92rem;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.95);
          font-weight: 500;
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
          display: flex;
          flex-direction: row-reverse;
          flex-wrap: wrap-reverse;
          justify-content: flex-start;
          align-content: flex-end;
          width: 106px;
          gap: 8px;
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
