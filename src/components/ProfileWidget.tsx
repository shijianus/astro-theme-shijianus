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
  avatar,
  cover,
  email,
  variant,
  stats,
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
  const rawBio = `深耕系统重构与网络工程领域的**真实折腾记录**。拒绝宏大叙事，致力于提炼底层的硬核逻辑与避坑指南。\n持续构筑*外脑知识库*，期冀这些极客向的碎片随笔，能提供些许实战参考。`;

  let paragraphs = rawBio.split('\n').map(p => p.trim()).filter(Boolean);

  paragraphs = paragraphs.slice(0, 2);

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
              <p key={i} style={{ marginBottom: i !== paragraphs.length - 1 ? '0.4rem' : '0' }}>
                {renderMarkdown(p)}
              </p>
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
            <a className="social-icon" href={`mailto:${email}`} title={`Email: ${email}`}>
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/></svg>
            </a>
            <a className="social-icon" href="https://github.com/shijianus" target="_blank" rel="noreferrer" title="GitHub: shijianus">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="currentColor"/></svg>
            </a>
          </div>
        </div>

        <div className="site-data">
          <a href="/archives/" title="归档">
            <div className="headline">文章</div>
            <div className="length-num">{stats.posts}</div>
          </a>
          <a href="/tags/" title="标签">
            <div className="headline">标签</div>
            <div className="length-num">{stats.tags}</div>
          </a>
          <a href="/categories/" title="分类">
            <div className="headline">分类</div>
            <div className="length-num">{stats.categories}</div>
          </a>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .profile-card {
          position: relative;
          overflow: hidden;
          background-color: #111 !important;
          z-index: 1;
          border: none !important;
        }

        /* 第一层：底图 */
        .profile-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: var(--profile-cover);
          background-size: cover;
          background-position: center;
          z-index: 0;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* 第二层：动态渐变遮罩 - 修改为安知鱼绿 */
        .profile-card::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image: linear-gradient(-45deg, 
            rgba(87, 189, 106, 0.4), 
            rgba(29, 201, 138, 0.4), 
            rgba(66, 90, 239, 0.3), 
            rgba(87, 189, 106, 0.4)
          );
          background-size: 400% 400%;
          animation: profile-gradient-pan 15s ease infinite !important;
          z-index: 1;
          pointer-events: none;
          opacity: 0.8;
        }

        @keyframes profile-gradient-pan {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        /* 第三层：磨砂玻璃内容层 */
        .profile-card .card-content {
          position: relative;
          z-index: 2; /* 确保在所有伪元素之上 */
          overflow: hidden;
          background: rgba(255, 255, 255, 0.02) !important;
          backdrop-filter: blur(18px) saturate(180%) brightness(1.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          min-height: 340px;
          display: flex;
          flex-direction: column;
        }
        
        .profile-card:hover .card-content {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.05);
        }

        .author-info-avatar {
          position: absolute;
          top: 38%;
          left: 50%;
          transform: translate(-50%, -50%);
          margin: 0;
          transition: cubic-bezier(.69,.39,0,1.21) .3s;
          pointer-events: none;
          z-index: 2;
        }

        .profile-card:hover .author-info-avatar {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0);
        }

        .author-info__description {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          padding: 3.2rem 1.5rem 0 1.5rem;
          opacity: 0;
          transition: 0.3s;
          pointer-events: none;
          position: absolute;
          top: 0;
          bottom: 120px;
          left: 0;
          right: 0;
          overflow: hidden;
        }
        .profile-card:hover .author-info__description {
          opacity: 1;
        }

        .author-info__bottom-group {
          margin-top: auto;
          padding: 1rem;
          padding-bottom: 0.5rem;
          z-index: 20;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 12px;
        }

        .site-data {
          display: flex;
          width: 100%;
          padding: 0.8rem 1rem 1.2rem;
          justify-content: space-around;
          text-align: center;
          z-index: 20;
        }
        .site-data a {
          text-decoration: none;
          color: var(--white);
          flex: 1;
        }
        .site-data .headline {
          font-size: 0.8rem;
          opacity: 0.7;
        }
        .site-data .length-num {
          font-size: 1.2rem;
          font-weight: 700;
          margin-top: 4px;
        }
      `}} />
    </section>
  );
}
