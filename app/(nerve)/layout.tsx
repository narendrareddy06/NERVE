"use client"

import { useState } from "react"
import { Menu, Zap } from "lucide-react"
import { NerveSidebar } from "@/components/nerve/sidebar"
import { NerveStoreProvider } from "@/lib/nerve-store"

export default function NerveLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <NerveStoreProvider>
      <div className="flex h-screen bg-[#F7F9FC] overflow-hidden">
        <NerveSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <div className="flex-1 flex flex-col md:ml-[220px] min-w-0 overflow-hidden">
          {/* Mobile Top Header */}
          <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200 md:hidden z-30 shrink-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-[#64748B]" />
            </button>
            <div className="flex items-center gap-1.5 font-bold tracking-widest text-[#0F172A] text-sm">
              <Zap className="w-4 h-4 text-[#2563EB]" />
              NERVE
            </div>
            <div className="w-8 h-8" />
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="min-h-screen p-4 md:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </NerveStoreProvider>
  )
}
