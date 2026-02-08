import React from 'react';
import { 
  Calendar, Sparkles, TrendingUp, ArrowUpRight, MapPin, Clock 
} from 'lucide-react';
import { motion } from 'framer-motion';

const Rightbar = () => {
  const trendingHashtags = [
    { tag: 'Engineering', posts: '12k', rank: 1, category: 'Academic' },
    { tag: 'Hackathon2026', posts: '8.4k', rank: 2, category: 'Events' },
    { tag: 'BengaluruTech', posts: '5.2k', rank: 3, category: 'Local' },
    { tag: 'OpenSource', posts: '3.1k', rank: 4, category: 'Coding' },
  ];

  return (
    /* FIX: Isolated Scroll 
       Using h-[calc(100vh-theme(spacing.20))] ensures it fits below navbar 
       and scrolls independently without affecting the Feed.
    */
    <aside className="w-[340px] hidden xl:flex flex-col gap-6 h-[calc(100vh-80px)] overflow-y-auto pr-4 pl-2 no-scrollbar py-6 sticky top-20">
      
      {/* 1. Refined Trending Section */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 px-1">
            <h3 className="font-black text-slate-900 text-[13px] uppercase tracking-widest flex items-center gap-2">
              Trending <TrendingUp size={16} className="text-indigo-500" />
            </h3>
          </div>

          <div className="space-y-1">
            {trendingHashtags.map((item, i) => (
              <motion.div 
                key={i}
                whileHover={{ x: 5, backgroundColor: '#F8FAFC' }}
                className="group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border border-transparent"
              >
                <div className="flex items-center gap-4">
                   <span className="text-[10px] font-black text-slate-300 w-4">{item.rank}</span>
                   <div>
                     <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-tighter mb-0.5">{item.category}</p>
                     <p className="font-black text-slate-800 text-sm">#{item.tag}</p>
                     <p className="text-[10px] text-slate-400 font-bold">{item.posts} interactions</p>
                   </div>
                </div>
                <div className="text-slate-200 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all">
                   <ArrowUpRight size={18} />
                </div>
              </motion.div>
            ))}
          </div>

          <button className="w-full mt-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 hover:border-indigo-100 hover:text-indigo-600 rounded-2xl transition-all">
            Show More
          </button>
        </div>
      </section>

      {/* 2. Campus Pulse (Events) */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-4">
          <h3 className="font-black text-slate-900 text-[13px] uppercase tracking-widest flex items-center gap-2">
            Campus Pulse <Sparkles size={14} className="text-amber-500" />
          </h3>
        </div>

        <div className="space-y-3">
          <EventCard 
            title="UI Design Workshop"
            time="4:00 PM"
            location="Auditorium A"
            image="https://images.unsplash.com/photo-1552664730-d307ca884978?w=100"
            date="24 Jan"
          />
          <EventCard 
            title="Tech Stack Meetup"
            time="10:30 AM"
            location="Block 4 Lab"
            image="https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=100"
            date="26 Jan"
          />
          <EventCard 
            title="Career Fair 2026"
            time="9:00 AM"
            location="Main Hall"
            image="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100"
            date="02 Feb"
          />
        </div>
      </section>

      {/* 3. Minimal Footer Info */}
      <div className="px-6 py-4">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {['Privacy', 'Terms', 'Help', 'Advertising'].map(link => (
            <span key={link} className="text-[10px] font-bold text-slate-300 hover:text-indigo-400 cursor-pointer transition-colors uppercase tracking-tight">{link}</span>
          ))}
        </div>
        <p className="text-[10px] font-bold text-slate-200 mt-4 uppercase tracking-widest">© 2026 WeShare Campus</p>
      </div>

    </aside>
  );
};

/* --- Refined Internal Components --- */

const EventCard = ({ title, time, location, image, date }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="bg-white p-4 rounded-[2.2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 cursor-pointer"
  >
    <div className="relative shrink-0">
      <img src={image} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-50" alt="" />
      <div className="absolute -top-2 -left-2 bg-indigo-600 text-[8px] font-black text-white px-2 py-1 rounded-lg shadow-lg">
        {date}
      </div>
    </div>
    
    <div className="flex-1 min-w-0">
      <h4 className="text-[12px] font-black text-slate-900 truncate mb-1">{title}</h4>
      <div className="flex flex-col gap-0.5">
        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
          <Clock size={10} className="text-indigo-400" /> {time}
        </p>
        <p className="text-[10px] font-medium text-slate-400 truncate flex items-center gap-1">
          <MapPin size={10} /> {location}
        </p>
      </div>
    </div>
  </motion.div>
);

export default Rightbar;