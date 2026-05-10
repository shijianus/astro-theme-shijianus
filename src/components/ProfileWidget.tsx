import React, { type CSSProperties } from 'react';

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
}: ProfileWidgetProps) {
  const style = {
    '--profile-cover': `url(${cover})`,
  } as CSSProperties;

  return (
    <section className="card-widget card-info profile-card" style={style}>
      <div className="card-content">
        <div id="author-info__sayhi">{statusLabel}</div>
        
        <div className="author-info-avatar">
          <img src={avatar} alt={name} className="avatar-img" />
          <span className="author-status" aria-hidden="true">
            <span />
          </span>
        </div>

        <div className="author-info__description">
          <p>{bio}</p>
          <div className="profile-card__meta">
            <span>{motto}</span>
            <span>{location}</span>
            <span>
              {stats.posts} 篇文章 / {stats.tags} 个标签 / {stats.categories} 个分类
            </span>
          </div>
          <div className="profile-card__stack">
            {stack.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <div className="author-info__bottom-group">
          <a className="author-info__bottom-group-left" href="/about/" title={name}>
            <h1 className="author-info__name">{name}</h1>
            <div className="author-info__desc">{role}</div>
          </a>
          <div className="card-info-social-icons is-center" aria-label="作者链接">
            <a className="social-icon" href="https://github.com/shijianus" target="_blank" rel="noreferrer" title="GitHub">
              <i className="anzhiyufont anzhiyu-icon-github" aria-hidden="true" />
            </a>
            <a className="social-icon" href={`mailto:${email}`} title="邮箱">
              <i className="anzhiyufont anzhiyu-icon-envelope" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
