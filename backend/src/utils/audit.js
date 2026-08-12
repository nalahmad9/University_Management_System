import AuditLog from '../models/AuditLog.js'

// Records an audit entry. Non-fatal: failures are swallowed so they never break the main action.
export async function logAudit(actorId, action, entity, detail) {
  try {
    await AuditLog.create({ actorId, action, entity, detail })
  } catch (e) {
    console.error('audit log failed:', e.message)
  }
}
