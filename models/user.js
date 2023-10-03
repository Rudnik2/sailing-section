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
  // Fields specific to instructors
  qualifications: [String],
  sailingLicenses: [String],
  trainingExperience: String,
  trainingInIlawa: {
    courses: Number,
    type: String,
    dates: [Date],
  },
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

module.exports = User;
