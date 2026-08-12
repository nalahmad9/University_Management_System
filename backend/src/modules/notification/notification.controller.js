import { asyncHandler } from '../../utils/asyncHandler.js'
import * as svc from './notification.service.js'

export const list = asyncHandler(async (req, res) => {
  const notifications = await svc.listMine(req.user._id)
  res.json({ notifications })
})
export const read = asyncHandler(async (req, res) => {
  const notification = await svc.markRead(req.params.id, req.user._id)
  res.json({ notification })
})
export const readAll = asyncHandler(async (req, res) => { await svc.markAllRead(req.user._id); res.json({ message: 'ok' }) })
