import React from 'react';
import { motion } from 'framer-motion';
import { Github, Mail, Twitter, GraduationCap, MapPin } from 'lucide-react';

export const ProfileWidget: React.FC = () => {
  const profile = {
    name: "SmartKevin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=SmartKevin",
    bio: "Passionate about Biological Sciences and Web Engineering. Bridging the gap between life and code.",
    tags: ["Biological Sciences Sophomore", "Fullstack Developer", "Astro Fanatic"],
    stats: {
      posts: 42,
      followers: 128,
      following: 85
    },
    social: [
      { icon: <Github className="h-5 w-5" />, label: "GitHub", href: "https://github.com/shijianus" },
      { icon: <Twitter className="h-5 w-5" />, label: "Twitter", href: "#" },
      { icon: <Mail className="h-5 w-5" />, label: "Email", href: "mailto:hello@shijian.us" }
    ]
  };

  return (
    <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 shadow-xl hover:shadow-primary/10 transition-shadow">
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative mb-4 h-24 w-24 rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-accent p-0.5 shadow-lg shadow-primary/20"
        >
          <img
            src={profile.avatar}
            alt={profile.name}
            className="h-full w-full rounded-2xl bg-white object-cover"
          />
        </motion.div>

        <h3 className="text-xl font-bold text-white mb-1">{profile.name}</h3>
        
        <div className="flex items-center gap-2 mb-4 text-xs text-white/60 font-medium uppercase tracking-widest">
          <GraduationCap className="h-3 w-3" />
          {profile.tags[0]}
        </div>

        <p className="mb-6 text-sm leading-relaxed text-white/80 line-clamp-3 italic">
          "{profile.bio}"
        </p>

        <div className="flex w-full justify-around border-y border-white/10 py-4 mb-6">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white">{profile.stats.posts}</span>
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Posts</span>
          </div>
          <div className="h-8 w-px bg-white/10 self-center" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white">{profile.stats.followers}</span>
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Followers</span>
          </div>
          <div className="h-8 w-px bg-white/10 self-center" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white">{profile.stats.following}</span>
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Following</span>
          </div>
        </div>

        <div className="flex gap-4">
          {profile.social.map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              className="flex items-center justify-center h-10 w-10 rounded-full bg-white/5 text-white/60 transition-all hover:bg-white/10 hover:text-white hover:scale-110 active:scale-95"
              title={item.label}
            >
              {item.icon}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
