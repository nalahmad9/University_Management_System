import { NavLink } from 'react-router-dom'
import { X, LogOut, Sparkles } from 'lucide-react'
import { NAV, ROLE_LABEL } from './navConfig'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../ui'
import { fullName } from '../../utils/helpers'
import { classNames } from '../../utils/helpers'

export default function Sidebar({ open, onClose }) {
  const { currentUser, logout } = useAuth()
  if (!currentUser) return null
  const items = NAV[currentUser.role] || []

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-sm lg:hidden animate-fade-in" onClick={onClose} />}

      <aside
        className={classNames(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-[#1a1a2e] transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0 shadow-elevated' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-white/[0.06] px-5">
          <div className="flex items-center gap-2.5">
            <span className="relative grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20">
              <Sparkles size={18} />
              <span className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/20" />
            </span>
            <div className="leading-tight">
              <p className="text-base font-extrabold tracking-tight text-white">UniHub</p>
              <p className="text-[11px] font-medium text-white/30">University Management</p>
            </div>
          </div>
          <button className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/[0.06] lg:hidden" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-white/30">
            {ROLE_LABEL[currentUser.role]}
          </p>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => classNames(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80'
              )}
            >
              <item.icon size={19} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar user={currentUser} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white/80">{fullName(currentUser)}</p>
              <p className="truncate text-xs text-white/40">{currentUser.email}</p>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="rounded-lg p-2 text-white/40 transition hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
