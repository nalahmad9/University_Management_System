import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell, ChevronDown, User, LogOut, CheckCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../ui'
import { ROLE_LABEL, PROFILE_LINK } from './navConfig'
import { fullName, timeAgo, classNames } from '../../utils/helpers'
import * as notifApi from '../../api/notifications'

function useOutsideClick(ref, onClose) {
  useEffect(() => {
    const handler = (e) => ref.current && !ref.current.contains(e.target) && onClose()
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, onClose])
}

export default function Topbar({ onMenu }) {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const notifRef = useRef(null)
  const menuRef = useRef(null)
  useOutsideClick(notifRef, () => setNotifOpen(false))
  useOutsideClick(menuRef, () => setMenuOpen(false))

  useEffect(() => {
    let cancelled = false
    let interval
    const load = () => notifApi.listMine().then((res) => {
      if (!cancelled) setNotifications(Array.isArray(res) ? res : res.notifications || [])
    }).catch(() => {})
    load()
    interval = setInterval(load, 30000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  const myNotifs = notifications.filter((n) => n.userId === currentUser.id || !n.userId)
  const unread = myNotifs.filter((n) => !n.read).length

  const openNotif = async (n) => {
    setNotifOpen(false)
    setNotifications((list) => list.map((x) => (x._id || x.id) === (n._id || n.id) ? { ...x, read: true } : x))
    if (!n.read) { try { await notifApi.markRead(n._id || n.id) } catch { /* ignore */ } }
    if (n.link) navigate(n.link)
  }

  const markAll = async () => {
    setNotifications((list) => list.map((x) => ({ ...x, read: true })))
    try { await notifApi.markAllRead() } catch { /* ignore */ }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-surface-border/60 bg-surface-card/90 px-4 backdrop-blur sm:px-6">
      <button className="rounded-xl p-2 text-ink-muted hover:bg-surface-hover lg:hidden" onClick={onMenu}>
        <Menu size={22} />
      </button>

      <div className="hidden sm:block">
        <p className="text-sm font-semibold text-ink">Welcome back, {currentUser.firstName}</p>
        <p className="text-xs text-ink-muted">{ROLE_LABEL[currentUser.role]} · Fall 2026</p>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <div className="relative" ref={notifRef}>
          <button onClick={() => setNotifOpen((v) => !v)} className="relative rounded-xl p-2 text-ink-muted transition hover:bg-surface-hover">
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gradient-to-r from-red-500 to-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">{unread}</span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] origin-top-right animate-fade-in rounded-2xl border border-surface-border bg-surface-card shadow-elevated sm:w-96">
              <div className="flex items-center justify-between border-b border-surface-border/60 px-4 py-3">
                <p className="font-semibold text-ink">Notifications</p>
                {unread > 0 && (
                  <button
                    onClick={markAll}
                    className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700"
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {myNotifs.length === 0 && (
                  <p className="px-4 py-10 text-center text-sm text-ink-muted">You're all caught up.</p>
                )}
                {myNotifs.map((n) => (
                  <button
                    key={n._id || n.id}
                    onClick={() => openNotif(n)}
                    className={classNames(
                      'flex w-full items-start gap-3 border-b border-surface-border/40 px-4 py-3 text-left transition hover:bg-surface-hover',
                      !n.read && 'bg-violet-50/40'
                    )}
                  >
                    <span className={classNames('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-surface-border' : 'bg-violet-500')} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink">{n.title}</span>
                      <span className="block truncate text-xs text-ink-muted">{n.body}</span>
                      <span className="mt-0.5 block text-[11px] text-ink-faint">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-2 transition hover:bg-surface-hover">
            <Avatar user={currentUser} size="sm" />
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold leading-tight text-ink">{fullName(currentUser)}</span>
              <span className="block text-xs leading-tight text-ink-muted">{ROLE_LABEL[currentUser.role]}</span>
            </span>
            <ChevronDown size={16} className="text-ink-muted" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right animate-fade-in rounded-2xl border border-surface-border bg-surface-card py-1.5 shadow-elevated">
              <div className="border-b border-surface-border/60 px-4 py-3">
                <p className="text-sm font-semibold text-ink">{fullName(currentUser)}</p>
                <p className="truncate text-xs text-ink-muted">{currentUser.email}</p>
              </div>
              <button onClick={() => { setMenuOpen(false); navigate(PROFILE_LINK[currentUser.role]) }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-ink-muted transition hover:bg-surface-hover hover:text-ink">
                <User size={17} /> My Profile
              </button>
              <button onClick={logout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50">
                <LogOut size={17} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
