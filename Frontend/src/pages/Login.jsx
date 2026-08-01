import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState('user')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (role === 'admin') {
      navigate('/admin/dashboard')
      return
    }
    navigate('/user/dashboard')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 p-4 sm:p-6">
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-slate-200/60 blur-3xl" />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/90 bg-white px-6 py-7 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.5)] sm:px-8 sm:py-9"
      >
        <div className="mb-7 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">PolicyMind</h1>
          <p className="mt-2 text-sm text-slate-500">Welcome back! Please sign in to continue.</p>
        </div>

        <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-1">
          <div className="grid grid-cols-2 gap-1">
            {[
              { value: 'user', label: 'User' },
              { value: 'admin', label: 'Admin' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  role === option.value ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-600">Email</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 transition duration-200 focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]">
              <Mail className="h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="h-11 w-full border-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-600">Password</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 transition duration-200 focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]">
              <Lock className="h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                className="h-11 w-full border-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="rounded-md p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
            />
            Remember Me
          </label>

          <Link to="/login" className="text-sm font-medium text-blue-600 transition hover:text-blue-500">
            Forgot Password
          </Link>
        </div>

        <button
          type="submit"
          className="mt-6 h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
        >
          Sign In
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-semibold tracking-[0.18em] text-slate-400">OR</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm transition duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
        >
          <span className="text-base font-semibold text-[#DB4437]">G</span>
          Continue with Google
        </button>
      </form>
    </div>
  )
}