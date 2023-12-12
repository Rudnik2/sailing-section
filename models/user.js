const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  enrolledCourses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
  role: {
    type: String,
    enum: ["student", "instructor", "admin"],
    default: "student",
  },
  // Fields specific to instructors
  qualifications: {
    type: String,
    enum: [
      "Instructor Lecturer of the Polish Sailing Association",
      "PZŻ Sailing Instructor",
      "PZŻ Sailing Teacher (formerly Junior Sailing Instructor of PZŻ)",
      "None",
    ],
  },
  numberOfCoursesInIlawa: Number,
  sailingRank: {
    type: String,
    enum: [
      "Yacht Captain",
      "Yacht Coastal Skipper / (formerly Yacht Skipper)",
      "Yacht Sailor",
    ],
  },
  numberOfCoursesOutsideIlawa: Number,
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

module.exports = User;
