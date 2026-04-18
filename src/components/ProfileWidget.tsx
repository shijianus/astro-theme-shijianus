import React, { type CSSProperties } from 'react';
import { Github, Mail, MapPin } from 'lucide-react';

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
        <div className="author-info-avatar">
          <img src={avatar} alt={name} className="avatar-img" />
          <span className="author-status" aria-hidden="true">
            <span />
          </span>
        </div>

        <div id="author-info__sayhi">{statusLabel}</div>
        <h2 className="author-info__name">{name}</h2>
        <p className="author-info__desc">{role}</p>
        <p className="author-info__description">{motto}</p>

        <div className="site-data is-center">
          <a href="/archives/">
            <div className="headline">Articles</div>
            <div className="length-num">{stats.posts}</div>
          </a>
          <a href="/tags/">
            <div className="headline">Tags</div>
            <div className="length-num">{stats.tags}</div>
          </a>
          <a href="/categories/">
            <div className="headline">Categories</div>
            <div className="length-num">{stats.categories}</div>
          </a>
        </div>

        <p className="profile-card__bio">{bio}</p>

        <div className="profile-card__meta">
          <span>
            <MapPin className="profile-card__icon" aria-hidden="true" />
            {location}
          </span>
          <a href={`mailto:${email}`}>
            <Mail className="profile-card__icon" aria-hidden="true" />
            {email}
          </a>
        </div>

        <div className="card-info-social-icons" aria-label="Author links">
          <a className="social-icon" href="https://github.com/shijianus" target="_blank" rel="noreferrer" title="GitHub">
            <Github aria-hidden="true" />
          </a>
          <a className="social-icon" href={`mailto:${email}`} title="Email">
            <Mail aria-hidden="true" />
          </a>
        </div>

        <div className="profile-card__stack">
          {stack.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
