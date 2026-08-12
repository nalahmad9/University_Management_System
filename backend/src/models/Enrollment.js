import mongoose from 'mongoose'
const { Schema } = mongoose

const enrollmentSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    status: { type: String, enum: ['enrolled', 'waitlisted', 'dropped'], default: 'enrolled' },
    waitlistedAt: { type: Date, default: null },
    enrolledAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true })
enrollmentSchema.index({ studentId: 1, status: 1 })
enrollmentSchema.index({ courseId: 1, status: 1 })
enrollmentSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) { delete ret._id; delete ret.__v; return ret },
})

export default mongoose.model('Enrollment', enrollmentSchema)
