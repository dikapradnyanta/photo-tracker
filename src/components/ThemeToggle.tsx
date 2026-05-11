'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isDark = theme === 'dark'

  return (
    <div className="flex items-center gap-3">
      <Sun className={`w-4 h-4 transition-colors ${!isDark ? 'text-amber-primary' : 'text-muted'}`} />
      
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="relative w-12 h-6 rounded-full bg-sand/30 dark:bg-amber-primary transition-colors flex items-center p-1 cursor-pointer"
        aria-label="Toggle theme"
      >
        <motion.div
          animate={{ x: isDark ? 24 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="w-4 h-4 rounded-full bg-white shadow-sm"
        />
      </button>
      
      <Moon className={`w-4 h-4 transition-colors ${isDark ? 'text-amber-primary' : 'text-muted'}`} />
    </div>
  )
}
