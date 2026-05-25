import React, { useState } from 'react';

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

const GREETINGS = [
  '你好，我是 shijianus 👋',
  '时间是唯一的真相',
  '在秩序中寻找自由',
  '代码与文字的共鸣',
  '记录是最好的对话',
  '让每一个像素都拥有温度',
  '敬畏规律，享受创造',
];

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
  const [greetingIndex, setGreetingIndex] = useState(0);

  const cycleGreeting = (e: React.MouseEvent) => {
    e.stopPropagation();
    setGreetingIndex((prev) => (prev + 1) % GREETINGS.length);
  };

  return (
    <section className="card-widget card-info profile-card group relative overflow-hidden transition-all duration-300">
      <div className="card-content relative z-10">
        <div 
          id="author-info__sayhi" 
          className="author-info__sayhi text-[12px] text-white bg-white/20 px-2 py-0.5 rounded-xl w-fit mx-auto cursor-pointer transition-all hover:bg-white hover:text-black hover:scale-110 active:scale-95 select-none"
          onClick={cycleGreeting}
        >
          {GREETINGS[greetingIndex]}
        </div>
        
        <div className="author-info-avatar mt-11 mx-auto flex justify-center w-[118px] h-[118px] transition-all duration-300 origin-bottom group-hover:scale-0 group-hover:opacity-0 relative">
          <img src={avatar} alt={name} className="avatar-img w-full h-full rounded-full object-cover border-[5px] border-white shadow-lg" />
          <div className="author-status absolute bottom-0.5 right-0.5 w-[33px] h-[33px] rounded-full bg-white flex items-center justify-center transition-all duration-300 delay-200 group-hover:scale-0 group-hover:opacity-0">
             <img src="/favicon.ico" className="g-status w-[26px] h-[26px]" alt="status" />
          </div>
        </div>

        <div className="author-info__description absolute top-12 left-0 w-full px-5 py-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 text-white z-20 pointer-events-none group-hover:pointer-events-auto flex flex-col h-[calc(100%-80px)]">
          <div className="text-sm leading-relaxed text-justify mb-4">
            {bio}
          </div>
          <div className="banner-button-group mt-auto flex justify-center">
            <a 
              className="banner-button flex items-center justify-center px-4 py-2 bg-white/20 text-white rounded-[35px] backdrop-blur-md transition-all hover:bg-white hover:text-black no-underline group/btn"
              href="/about/"
              title="了解更多"
            >
              <i className="shijianusfont shijianus-icon-user text-[1.2rem] mr-2 transition-transform group-hover/btn:translate-x-1" aria-hidden="true" />
              <span className="banner-button-text font-bold">了解更多</span>
            </a>
          </div>
        </div>

        <div className="author-info__bottom-group mt-4 flex justify-between items-center w-full transition-all duration-300">
          <a className="author-info__bottom-group-left no-underline flex flex-col" href="/about/" title={name}>
            <h1 className="author-info__name text-white text-xl font-bold m-0 leading-none mb-1">{name}</h1>
            <div className="author-info__desc text-white/60 text-[12px] leading-none">{role}</div>
          </a>
          <div className="card-info-social-icons flex items-center" aria-label="作者链接">
            <a className="social-icon w-10 h-10 ml-2.5 flex items-center justify-center bg-white/20 text-white rounded-full transition-all hover:bg-white hover:text-black hover:scale-110" href="https://github.com/shijianus" target="_blank" rel="noreferrer" title="GitHub">
              <i className="shijianusfont shijianus-icon-github text-base" aria-hidden="true" />
            </a>
            <a className="social-icon w-10 h-10 ml-2.5 flex items-center justify-center bg-white/20 text-white rounded-full transition-all hover:bg-white hover:text-black hover:scale-110" href={`mailto:${email}`} title="邮箱">
              <i className="shijianusfont shijianus-icon-envelope text-base" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
