const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  enrolledStudents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  description: {
    type: String,
    required: true,
  },
  costForStudents: {
    type: Number,
    required: true,
  },
  costForWorkers: {
    type: Number,
    required: true,
  },
  costForAWSMembers: {
    type: Number,
    required: true,
  },
  regularCost: {
    type: Number,
    required: true,
  },
  dates: [Date],
  courseDurationDays: {
    type: Number,
    required: true,
  },
  instructorOfTheCourse: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  registrationFormTemplate: mongoose.Schema.Types.Mixed,
  isArchived: {
    type: Boolean,
    default: false,
  },
});

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
