import mongoose from 'mongoose'
const { Schema } = mongoose

const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: ['create', 'update', 'delete'], required: true },
    entity: { type: String, required: true },
    detail: { type: String, default: '' },
  },
  { timestamps: true }
)

auditLogSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) { delete ret._id; delete ret.__v; return ret },
})

export default mongoose.model('AuditLog', auditLogSchema)
