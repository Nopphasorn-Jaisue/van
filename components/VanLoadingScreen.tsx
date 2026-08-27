'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface VanLoadingScreenProps {
  fullScreen?: boolean;
  message?: string;
  subMessage?: string;
}

export default function VanLoadingScreen({
  fullScreen = true,
  message = "LOADING",
  subMessage = "ระบบจองรถตู้มหาวิทยาลัยพะเยา"
}: VanLoadingScreenProps) {
  return (
    <div className={`${
      fullScreen ? 'fixed inset-0 z-[99999]' : 'w-full h-full min-h-[400px]'
    } bg-white flex flex-col items-center justify-center p-4 select-none overflow-hidden`}>
      
      {/* Background soft ambient glow */}
      <div className="absolute w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Container */}
      <div className="flex flex-col items-center justify-center relative">
        
        {/* Animated Van Wrapper */}
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, -0.5, 0.5, 0]
          }}
          transition={{ 
            duration: 1.6, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="relative flex flex-col items-center"
        >
          {/* Sparkles / Stars behind/around van */}
          <motion.img
            src="/loading-stars.png"
            alt="Sparkles"
            animate={{ 
              opacity: [0.5, 1, 0.5],
              scale: [0.95, 1.05, 0.95]
            }}
            transition={{ 
              duration: 2.2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute -inset-4 w-[115%] h-[115%] object-contain pointer-events-none z-0"
          />

          {/* Cute UP Van */}
          <img
            src="/loading-van.png"
            alt="University of Phayao Van Loading"
            className="w-64 sm:w-76 md:w-88 h-auto object-contain relative z-10 drop-shadow-sm"
          />

          {/* Animated Ground Shadow */}
          <motion.div
            animate={{ 
              scaleX: [1, 0.82, 1],
              scaleY: [1, 0.75, 1],
              opacity: [0.35, 0.18, 0.35]
            }}
            transition={{ 
              duration: 1.6, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="w-48 sm:w-56 h-3.5 bg-[#311171]/25 rounded-full blur-[3px] -mt-3.5 z-0"
          />
        </motion.div>

        {/* Text Area */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 flex flex-col items-center gap-1.5"
        >
          {/* LOADING... text matching the font & style */}
          <div className="flex items-center text-[#311171] font-black text-xl sm:text-2xl tracking-[0.25em] font-sans">
            <span>{message}</span>
            <span className="inline-flex tracking-normal ml-0.5">
              <motion.span
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.25, 0.75, 1] }}
              >.</motion.span>
              <motion.span
                animate={{ opacity: [0, 0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 0.75, 1] }}
              >.</motion.span>
              <motion.span
                animate={{ opacity: [0, 0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.75, 0.9, 1] }}
              >.</motion.span>
            </span>
          </div>

          {subMessage && (
            <p className="text-xs sm:text-[13px] font-bold text-[#311171]/50 tracking-wider mt-0.5">
              {subMessage}
            </p>
          )}
        </motion.div>

      </div>

    </div>
  );
}
