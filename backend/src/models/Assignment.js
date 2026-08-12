import mongoose from 'mongoose'
const { Schema } = mongoose

const assignmentSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    deadline: { type: Date, required: true },
    maxScore: { type: Number, default: 100 },
    attachedFileUrl: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

assignmentSchema.index({ courseId: 1 })

export default mongoose.model('Assignment', assignmentSchema)
