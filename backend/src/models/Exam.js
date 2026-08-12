import mongoose from 'mongoose'
const { Schema } = mongoose

const examSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ['Quiz', 'Midterm', 'Final'], default: 'Midterm' },
    date: { type: Date, required: true },
    startTime: { type: String, default: '09:00' },
    endTime: { type: String, default: '11:00' },
    room: { type: String, default: '' },
  },
  { timestamps: true }
)

examSchema.index({ courseId: 1 })
examSchema.index({ date: 1 })

examSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) { delete ret.id; delete ret.__v; return ret },
})

export default mongoose.model('Exam', examSchema)
