import mongoose from 'mongoose'
const { Schema } = mongoose

// Final grade per student per course. status 'final' + letter !== 'F' means
// the student passed the course (used for prerequisite checks).
const gradeSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    score: { type: Number, min: 0, max: 100, default: null },
    letter: { type: String, default: null },
    points: { type: Number, min: 0, max: 4, default: null },
    status: { type: String, enum: ['in-progress', 'final'], default: 'in-progress' },
  },
  { timestamps: true }
)

gradeSchema.index({ studentId: 1, courseId: 1 }, { unique: true })
gradeSchema.index({ studentId: 1, status: 1 })
gradeSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) { delete ret._id; delete ret.__v; return ret },
})

export default mongoose.model('Grade', gradeSchema)
