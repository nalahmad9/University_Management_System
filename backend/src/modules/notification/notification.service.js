import Notification from '../../models/Notification.js'

export const listMine = (userId) => Notification.find({ userId }).sort({ createdAt: -1 }).limit(50)
export const markRead = (id, userId) => Notification.findOneAndUpdate({ _id: id, userId }, { read: true }, { new: true })
export const markAllRead = (userId) => Notification.updateMany({ userId, read: false }, { read: true })
