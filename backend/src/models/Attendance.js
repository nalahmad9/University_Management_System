import mongoose from 'mongoose'
const { Schema } = mongoose

const attendanceRecordSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['present', 'absent'], required: true },
}, { _id: false })

const attendanceSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    sessionDate: { type: Date, required: true },
    topic: { type: String, default: 'Lecture' },
    records: [attendanceRecordSchema],
  },
  { timestamps: true }
)

attendanceSchema.index({ courseId: 1, sessionDate: 1 }, { unique: true })

export default mongoose.model('Attendance', attendanceSchema)
