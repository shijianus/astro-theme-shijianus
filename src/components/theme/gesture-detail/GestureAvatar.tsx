import React from 'react';
import { getCommentInitials } from '../../../lib/comment-client';

interface GestureAvatarProps {
  name: string;
  avatar?: string;
  size?: 40 | 36 | 32 | 24 | 20 | 18;
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
  const radius = isOwner ? '8px' : '50%';
  const fontSize = Math.max(10, Math.round(size * 0.38));

  return (
    <span
      className={`gd-avatar gd-avatar--${size} ${isOwner ? 'is-owner-square' : ''} ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: radius,
        fontSize: `${fontSize}px`,
      }}
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
