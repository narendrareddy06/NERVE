import { NerveSidebar } from "@/components/nerve/sidebar"
import { NerveStoreProvider } from "@/lib/nerve-store"

export default function NerveLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NerveStoreProvider>
      <div className="flex h-screen bg-[#F7F9FC] overflow-hidden">
        <NerveSidebar />
        <main className="flex-1 ml-[220px] overflow-y-auto">
          <div className="min-h-screen p-8">
            {children}
          </div>
        </main>
      </div>
    </NerveStoreProvider>
  )
}
