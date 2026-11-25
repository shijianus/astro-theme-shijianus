import React from 'react';
import { getCommentInitials } from '../../../lib/comment-client';

const MATTE_MORANDI_PALETTE = [
  '#334155',
  '#3b4252',
  '#2e3a4e',
  '#38443f',
  '#423b42',
  '#3c4048',
] as const;

function resolveMorandiBg(name: string): string {
  const str = name || '访';
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return MATTE_MORANDI_PALETTE[Math.abs(hash) % MATTE_MORANDI_PALETTE.length];
}

interface GestureAvatarProps {
  name: string;
  avatar?: string;
  size?: 42 | 40 | 36 | 34 | 32 | 26 | 24 | 20 | 18;
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
  const fallbackBg = avatar ? undefined : resolveMorandiBg(name);

  return (
    <span
      className={`gd-avatar gd-avatar--${size} ${isOwner ? 'is-owner-avatar' : ''} ${className}`}
      style={{
        borderRadius: '50%',
        backgroundColor: fallbackBg,
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
