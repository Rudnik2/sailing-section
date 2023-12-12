const mongoose = require("mongoose");

const registrationFormSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  fields: [
    {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      pesel: {
        type: String,
        required: true,
      },
      phoneNumber: {
        type: String,
        required: true,
      },
      cost: {
        type: Number,
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      studentIdNumber: String,
      azsPgMembershipCardNumber: String,
      tShirtSize: String,
      meals: String,
      referringSource: String,
    },
  ],
});

const RegistrationForm = mongoose.model(
  "RegistrationForm",
  registrationFormSchema
);

module.exports = RegistrationForm;
