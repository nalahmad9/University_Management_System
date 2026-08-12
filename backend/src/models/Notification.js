import mongoose from 'mongoose'
const { Schema } = mongoose

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['material', 'announcement', 'assignment', 'submission', 'grade', 'request', 'activation', 'deactivation', 'enrollment', 'exam', 'system'], default: 'system' },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
)

notificationSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) { delete ret.id; delete ret.__v; return ret },
})

export default mongoose.model('Notification', notificationSchema)
