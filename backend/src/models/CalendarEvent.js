import mongoose from 'mongoose'
const { Schema } = mongoose

const calendarEventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    type: { type: String, enum: ['semester', 'deadline', 'exam', 'holiday'], default: 'deadline' },
  },
  { timestamps: true }
)

calendarEventSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) { delete ret._id; delete ret.__v; return ret },
})

export default mongoose.model('CalendarEvent', calendarEventSchema)
