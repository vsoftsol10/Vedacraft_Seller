import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, CircleAlert, LogIn, PackageCheck, Ticket } from "lucide-react";
import { fetchNotifications, markNotificationsRead } from "../../api/notificationapi";

const icons = { order: PackageCheck, login: LogIn, offer_active: Ticket, offer_starts_tomorrow: Ticket, offer_ended: CircleAlert };

const relativeTime = (value) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default function NotificationMenu({ bellRef }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try { const response = await fetchNotifications(); setNotifications(response.data ?? []); } catch { /* Notification loading is non-critical. */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); const intervalId = window.setInterval(load, 60_000); return () => window.clearInterval(intervalId); }, []);
  useEffect(() => {
    const close = (event) => {
      if (event.type === "keydown" && event.key === "Escape") setOpen(false);
      if (event.type === "pointerdown" && menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", close);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", close); };
  }, []);

  const unread = notifications.filter((item) => !item.is_read).length;
  const markAllRead = async () => {
    const unreadIds = notifications.filter((item) => !item.is_read).map((item) => item.id);
    if (!unreadIds.length) return;
    setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
    try { await markNotificationsRead(unreadIds); } catch { load(); }
  };
  const markRead = async (id) => {
    const target = notifications.find((item) => item.id === id);
    if (!target || target.is_read) return;
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, is_read: true } : item));
    try { await markNotificationsRead([id]); } catch { load(); }
  };

  return <div ref={menuRef} className="relative z-10">
    <button ref={bellRef} type="button" onClick={() => { setOpen((visible) => !visible); if (!open) load(); }} className="relative flex cursor-pointer rounded-full border-0 bg-transparent p-1 text-[#444] hover:bg-gray-100" aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`} aria-expanded={open}>
      <Bell size={20} />
      {unread > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
    </button>
    {open && <section className="absolute right-0 top-[calc(100%+10px)] w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl" aria-label="Notifications">
      <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3"><div><h2 className="m-0 text-sm font-semibold text-gray-900">Notifications</h2><p className="m-0 mt-0.5 text-xs text-gray-500">{unread ? `${unread} unread` : "You’re all caught up"}</p></div><button type="button" disabled={!unread} onClick={markAllRead} className="flex cursor-pointer items-center gap-1 border-0 bg-transparent p-1 text-xs font-medium text-green-700 disabled:cursor-default disabled:text-gray-400"><CheckCheck size={15} /> Mark all read</button></header>
      <div className="max-h-[420px] overflow-y-auto">{loading && notifications.length === 0 ? <p className="m-0 px-4 py-6 text-center text-sm text-gray-500">Loading notifications…</p> : notifications.length === 0 ? <p className="m-0 px-4 py-8 text-center text-sm text-gray-500">No notifications yet.</p> : notifications.map((notification) => { const Icon = icons[notification.type] || Bell; return <button type="button" key={notification.id} onClick={() => markRead(notification.id)} className={`flex w-full cursor-pointer gap-3 border-0 border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-gray-50 ${notification.is_read ? "bg-white" : "bg-green-50/60"}`}><span className="mt-0.5 text-green-700"><Icon size={18} /></span><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><strong className="text-sm text-gray-900">{notification.title}</strong><time className="shrink-0 text-[11px] text-gray-500">{relativeTime(notification.created_at)}</time></span><span className="mt-0.5 block text-xs leading-5 text-gray-600">{notification.message}</span></span>{!notification.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-600" aria-label="Unread" />}</button>; })}</div>
    </section>}
  </div>;
}
