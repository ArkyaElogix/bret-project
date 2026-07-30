import Sidebar from './Sidebar'
import { ThemeToggle } from './ThemeToggle'

interface AdminLayoutProps {
  title: string
  children: React.ReactNode
}

export default function AdminLayout({
  title,
  children,
}: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-[#211E1E]">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            {title}
          </h1>
          <ThemeToggle />
        </div>

        {children}
      </main>
    </div>
  )
}