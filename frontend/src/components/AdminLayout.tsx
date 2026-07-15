import Sidebar from './Sidebar'

interface AdminLayoutProps {
  title: string
  children: React.ReactNode
}

export default function AdminLayout({
  title,
  children,
}: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {title}
          </h1>
        </div>

        {children}
      </main>
    </div>
  )
}