const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  cost: Number,
  dates: [Date],
});

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
