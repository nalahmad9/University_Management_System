import mongoose from 'mongoose'
const { Schema } = mongoose

const submissionSchema = new Schema(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileUrl: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    grade: String,
    feedback: String,
  },
  { timestamps: true }
)

submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true })
submissionSchema.index({ studentId: 1 })

export default mongoose.model('Submission', submissionSchema)
