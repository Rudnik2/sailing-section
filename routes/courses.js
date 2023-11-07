const express = require("express");
const Course = require("../models/courseModel");
const User = require("../models/user");
const RegistrationForm = require("../models/registrationForm");

const upload = require("../middleware/upload");
const pdf = require("pdf-parse");
require("dotenv").config();
const { checkInstructor } = require("../middleware/authMiddleware");

const router = express.Router();

// Create a new course
router.post("/", checkInstructor, async (req, res) => {
  try {
    const newCourse = new Course(req.body);
    const savedCourse = await newCourse.save();
    res.status(201).json(savedCourse);
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(400).json({ error: error.message });
  }
});

// Get all courses
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific course by ID
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found." });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a course by ID
router.put("/:id", checkInstructor, async (req, res) => {
  try {
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );
    res.json(updatedCourse);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a course by ID
router.delete("/:id", checkInstructor, async (req, res) => {
  try {
    await Course.findByIdAndRemove(req.params.id);
    res.sendStatus(204); // No content
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create a new form template for a course
router.post("/:courseId/form-templates", checkInstructor, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const formData = req.body; // Form template data

    // Create or update the form template for the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found." });
    }

    course.registrationFormTemplate = formData;
    await course.save();

    res.status(201).json(course.registrationFormTemplate);
  } catch (error) {
    console.error("Error creating/updating form template:", error);
    res.status(400).json({ error: error.message });
  }
});

// Create a route for uploading payment confirmation files
router.post(
  "/:courseId/upload-payment-confirmation",
  upload.single("paymentConfirmation"),
  async (req, res) => {
    try {
      // Check if the file is uploaded
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
      }

      // Extract text content from the PDF
      const dataBuffer = req.file.buffer;
      const data = await pdf(dataBuffer);

      // Process the extracted text to validate its content
      const pdfText = data.text.toLowerCase(); //make this data not case sensitive

      // Get the courseId from the URL parameters
      const courseId = req.params.courseId;

      // Ensure the user is authenticated (add your authentication logic here)
      const user = req.user;

      // Check if the user is enrolled in the specified course
      const isEnrolled = user.enrolledCourses.some((course) =>
        course.equals(courseId)
      );

      if (!isEnrolled) {
        return res
          .status(400)
          .json({ error: "User is not enrolled in the specified course." });
      }

      // Find the registration form for the specified course and user
      const registrationForm = await RegistrationForm.findOne({
        courseId,
        userId: user._id,
      });

      if (!registrationForm) {
        return res.status(400).json({
          error:
            "No registration form found for the specified course and user.",
        });
      }

      // Extract relevant information from the registration form
      const { firstName, lastName, cost } = registrationForm.fields[0];

      // Implement custom validation logic based on the extracted text
      if (
        pdfText.includes(firstName.toLowerCase()) &&
        pdfText.includes(lastName.toLowerCase()) &&
        pdfText.includes(cost) &&
        pdfText.includes(process.env.RACHUNEK_PG)
      ) {
        res.json({ message: "Payment confirmation file is valid." });
      } else {
        res.status(400).json({ error: "Invalid payment confirmation file." });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
