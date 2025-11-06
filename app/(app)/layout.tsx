'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, Shuffle, Bell, LogOut } from 'lucide-react'
import { useAuthStore } from '@/lib/zustand'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    if (!token) {
      router.push('/login')
    }
  }, [token, router])

  if (!token) {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b backdrop-blur-sm bg-background/80 sticky top-0 z-50 dark:bg-background/95 dark:border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-2xl font-bold text-primary flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              SlotSwapper
            </Link>
            <nav className="hidden md:flex items-center space-x-3">
              <Button
                variant={pathname === '/dashboard' ? 'default' : 'ghost'}
                asChild
                className="gap-2 px-6 py-2.5 text-base font-medium h-auto"
              >
                <Link href="/dashboard">
                  <Calendar className="h-5 w-5" />
                  Dashboard
                </Link>
              </Button>
              <Button
                variant={pathname === '/marketplace' ? 'default' : 'ghost'}
                asChild
                className="gap-2 px-6 py-2.5 text-base font-medium h-auto"
              >
                <Link href="/marketplace">
                  <Shuffle className="h-5 w-5" />
                  Marketplace
                </Link>
              </Button>
              <Button
                variant={pathname === '/requests' ? 'default' : 'ghost'}
                asChild
                className="gap-2 px-6 py-2.5 text-base font-medium h-auto"
              >
                <Link href="/requests">
                  <Bell className="h-5 w-5" />
                  My Requests
                </Link>
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.name}</span>
            <ModeToggle />
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

