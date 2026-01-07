"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function HeroNetworkBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // 6x4 Grid of dots
  const dots = Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    x: (i % 6) * 60 + 30, // Spread nicely
    y: Math.floor(i / 6) * 60 + 30,
    delay: Math.random() * 2 // Random start for organic feel
  }))

  return (
    <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
      {/* Soft Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-10" />
      
      <svg className="absolute inset-0 w-full h-full opacity-20 dark:opacity-40" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        {/* SCENE 1: DOT GRID (Always visible, but animated) */}
        {dots.map((dot) => (
          <motion.circle
            key={dot.id}
            cx={dot.x}
            cy={dot.y}
            r="2"
            fill="currentColor"
            className="text-primary"
            initial={{ opacity: 0.3, scale: 1 }}
            animate={{ 
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: dot.delay
            }}
          />
        ))}

        {/* SCENE 2: PRIVACY SHIELD (Cycles every 12s) */}
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: [0, 1, 1, 0], 
            scale: [0.8, 1, 1, 1.1] 
          }}
          transition={{
            duration: 4,
            times: [0, 0.1, 0.8, 1],
            repeat: Infinity,
            repeatDelay: 8, // Wait for other scenes
            delay: 2 // Start after initial dots
          }}
          className="text-primary"
        >
          {/* Hexagon Shield */}
          <path 
            d="M200 100 L240 125 L240 175 L200 200 L160 175 L160 125 Z" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          />
          {/* Epsilon Glyph (ε) */}
          <text 
            x="200" 
            y="160" 
            fontSize="40" 
            fill="currentColor" 
            textAnchor="middle" 
            fontFamily="serif"
            style={{ fontWeight: 'bold' }}
          >
            ε
          </text>
        </motion.g>

        {/* SCENE 3: INDUSTRY ICONS (Cycles every 12s, offset) */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 9,
            delay: 6 // Start after Shield
          }}
          className="text-primary"
        >
          {/* Chart Icon */}
          <path 
            d="M100 150 L120 120 L140 160 L180 100" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            opacity="0.6"
          />
          {/* Pulse Circle */}
          <circle cx="200" cy="150" r="60" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.2" />
        </motion.g>
      </svg>
    </div>
  )
}
