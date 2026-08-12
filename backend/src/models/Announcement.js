import mongoose from 'mongoose'
const { Schema } = mongoose

const announcementSchema = new Schema(
  {
    scope: { type: String, enum: ['system', 'course'], default: 'system' },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', default: null },
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
)

announcementSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) { delete ret._id; delete ret.__v; return ret },
})

export default mongoose.model('Announcement', announcementSchema)
