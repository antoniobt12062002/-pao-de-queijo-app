import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Outlet />
      <BottomNav />
    </div>
  )
}
