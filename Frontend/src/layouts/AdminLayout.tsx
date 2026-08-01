import { motion } from 'framer-motion'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen items-stretch bg-slate-50">
      <Sidebar />
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1 min-h-screen"
      >
        <Outlet />
      </motion.main>
    </div>
  )
}
