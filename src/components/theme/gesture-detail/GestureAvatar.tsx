import React from 'react';
import { getCommentInitials } from '../../../lib/comment-client';

const AVATAR_TONE_COUNT = 6;

function resolveAvatarTone(name: string): number {
  const str = name || '访';
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % AVATAR_TONE_COUNT;
}

interface GestureAvatarProps {
  name: string;
  avatar?: string;
  size?: 42 | 40 | 36 | 34 | 32 | 26 | 24 | 20 | 18 | 16;
  isOwner?: boolean;
  className?: string;
}

export function GestureAvatar({
  name,
  avatar,
  size = 36,
  isOwner = false,
  className = '',
}: GestureAvatarProps) {
  const toneClass = avatar ? '' : `gd-avatar--tone-${resolveAvatarTone(name)}`;

  return (
    <span
      className={`gd-avatar gd-avatar--${size} ${toneClass} ${isOwner ? 'is-owner-avatar' : ''} ${className}`}
      style={{ borderRadius: '50%' }}
      title={name}
    >
      {avatar ? (
        <img src={avatar} alt={name} loading="lazy" />
      ) : (
        <span>{getCommentInitials(name || '访')}</span>
      )}
    </span>
  );
}
