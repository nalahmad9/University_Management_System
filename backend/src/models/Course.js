import mongoose from 'mongoose'
const { Schema } = mongoose

const courseSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    credits: { type: Number, default: 3, min: 1, max: 6 },
    capacity: { type: Number, default: 30, min: 1 },
    professorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    semester: { type: String, default: 'Fall 2026' },
    schedule: { type: String, default: '' },
    room: { type: String, default: '' },
    prerequisites: [{ type: Schema.Types.ObjectId, ref: 'Course', default: [] }],
    color: { type: String, default: 'bg-brand-500' },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
  },
  { timestamps: true }
)

courseSchema.index({ status: 1 })
courseSchema.index({ professorId: 1 })

courseSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) { delete ret.__v; return ret },
})

export default mongoose.model('Course', courseSchema)
