import { Outlet, Link } from 'react-router-dom'

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-orange-600">
                당근마켓 릴리즈 대시보드
              </Link>
            </div>
            <nav className="flex space-x-4">
              <Link
                to="/"
                className="text-gray-600 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                대시보드
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} 당근마켓 릴리즈 대시보드. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default MainLayout
