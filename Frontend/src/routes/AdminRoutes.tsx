import { Route } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout'
import AdminDashboard from '../pages/AdminDashboard'
import AdminDocuments from '../pages/AdminDocuments'
import KnowledgeGraph from '../pages/KnowledgeGraph'
import AdminSettings from '../pages/AdminSettings'

export default function AdminRoutes() {
  return (
    <Route element={<AdminLayout />}>
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/knowledge-graph" element={<KnowledgeGraph />} />
      <Route path="/admin/documents" element={<AdminDocuments />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
    </Route>
  )
}
