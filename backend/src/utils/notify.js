import Notification from '../models/Notification.js'
import User from '../models/User.js'

// Create a notification for one user (non-fatal on error).
export async function notify(userId, { type = 'system', title, body = '', link = '' }) {
  try {
    await Notification.create({ userId, type, title, body, link })
  } catch (e) { console.error('notify failed:', e.message) }
}

// Notify every admin.
export async function notifyAdmins(payload) {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id')
    await Promise.all(admins.map((a) => notify(a._id, payload)))
  } catch (e) { console.error('notifyAdmins failed:', e.message) }
}
