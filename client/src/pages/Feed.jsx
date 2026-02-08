
import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import FeedComponent from '../components/Feed';
import Rightbar from '../components/Rightbar';

const Feed = () => {
  return (
    <div className="bg-[#F1F5F9] min-h-screen text-slate-900">
      <Navbar />
      <div className="max-w-[1600px] mx-auto flex justify-center pt-4 px-0 lg:px-4 pb-4 gap-4">
        <Sidebar />
        <FeedComponent />
        <Rightbar />
      </div>
    </div>
  );
};

export default Feed;
