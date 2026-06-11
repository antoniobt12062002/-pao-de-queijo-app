import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import SideNav from './SideNav'
import NotificationPrompt from './NotificationPrompt'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SideNav />
      <div className="lg:pl-60">
        <main className="min-h-screen pb-24 lg:pb-8">
          <div className="max-w-2xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
      <NotificationPrompt />
    </div>
  )
}
