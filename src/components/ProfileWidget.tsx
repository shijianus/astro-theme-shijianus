import React from 'react';
import { Github, Mail, MapPin } from 'lucide-react';

type ProfileWidgetProps = {
  name: string;
  role: string;
  bio: string;
  avatar: string;
  location: string;
  email: string;
  stats: {
    posts: number;
    categories: number;
    tags: number;
  };
  stack: string[];
};

export const ProfileWidget: React.FC<ProfileWidgetProps> = ({
  name,
  role,
  bio,
  avatar,
  location,
  email,
  stats,
  stack,
}) => {
  return (
    <section className="surface-panel flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <img
          src={avatar}
          alt={name}
          className="h-16 w-16 rounded-md border border-[var(--line)] object-cover"
        />
        <div className="min-w-0 space-y-2">
          <div>
            <p className="eyebrow">Author Console</p>
            <h2 className="text-xl font-semibold text-[var(--text-strong)]">{name}</h2>
          </div>
          <p className="text-sm text-[var(--text-soft)]">{role}</p>
          <div className="flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {location}
            </span>
            <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--signal)]">
              <Mail className="h-3.5 w-3.5" />
              {email}
            </a>
          </div>
        </div>
      </div>

      <p className="text-sm leading-6 text-[var(--text-soft)]">{bio}</p>

      <div className="grid grid-cols-3 gap-3 border-y border-[var(--line)] py-4">
        <div className="space-y-1">
          <p className="text-2xl font-semibold text-[var(--text-strong)]">{stats.posts}</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Posts</p>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-semibold text-[var(--text-strong)]">{stats.categories}</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Categories</p>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-semibold text-[var(--text-strong)]">{stats.tags}</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Tags</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="eyebrow">Current Stack</p>
        <div className="flex flex-wrap gap-2">
          {stack.map((item) => (
            <span
              key={item}
              className="rounded-md border border-[var(--line)] bg-[var(--surface-muted)] px-2.5 py-1 text-xs text-[var(--text-soft)]"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <a
          href="https://github.com/shijianus"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-[var(--line)] px-3 py-2 text-sm text-[var(--text-soft)] transition-colors hover:border-[var(--signal)] hover:text-[var(--text-strong)]"
        >
          <Github className="h-4 w-4" />
          GitHub
        </a>
        <a
          href={`mailto:${email}`}
          className="inline-flex items-center gap-2 rounded-md border border-[var(--line)] px-3 py-2 text-sm text-[var(--text-soft)] transition-colors hover:border-[var(--teal)] hover:text-[var(--text-strong)]"
        >
          <Mail className="h-4 w-4" />
          Contact
        </a>
      </div>
    </section>
  );
};
