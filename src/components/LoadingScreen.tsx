import React, { useEffect, useState } from 'react';

type LoadingScreenProps = {
  brandName: string;
  avatar: string;
  durationMs?: number;
};

export function LoadingScreen({ brandName, avatar, durationMs = 680 }: LoadingScreenProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const sessionKey = 'shijianus-loader-seen';
    const hasSeenLoader = window.sessionStorage.getItem(sessionKey) === 'true';

    if (hasSeenLoader) {
      document.documentElement.classList.add('theme-ready');
      return;
    }

    setVisible(true);

    const beginLeave = window.setTimeout(() => {
      setLeaving(true);
      document.documentElement.classList.add('theme-ready');
      window.sessionStorage.setItem(sessionKey, 'true');
    }, durationMs);

    const hide = window.setTimeout(() => {
      setVisible(false);
    }, durationMs + 340);

    return () => {
      window.clearTimeout(beginLeave);
      window.clearTimeout(hide);
    };
  }, [durationMs]);

  if (!visible) return null;

  return (
    <div id="loading-box" className={leaving ? 'loaded' : ''} aria-hidden="true">
      <div className="loading-bg">
        <img className="loading-img" alt={`${brandName} loading avatar`} src={avatar} />
        <div className="loading-image-dot" />
        <p className="loading-title">{brandName}</p>
      </div>
    </div>
  );
}
