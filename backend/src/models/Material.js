import mongoose from 'mongoose'
const { Schema } = mongoose

const materialSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    week: { type: String, default: 'Week 1' },
    title: { type: String, required: true },
    type: { type: String, enum: ['pdf', 'pptx', 'docx', 'mp4', 'link', 'file'], default: 'file' },
    fileName: String,
    fileUrl: String,
    link: String,
    size: String,
  },
  { timestamps: true }
)

export default mongoose.model('Material', materialSchema)
