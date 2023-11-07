const express = require("express");
const Course = require("../models/courseModel");
const User = require("../models/user");
const RegistrationForm = require("../models/registrationForm");

const router = express.Router();

const { ensureAuthenticated } = require("../middleware/authMiddleware");
const {
  calculateInstructorHierarchy,
} = require("../utils/calculateInstructorHierarchy");
const { sortInstructors } = require("../utils/calculateInstructorHierarchy");

// Registering to a course

// Register for a course and create a registration form
router.post("/register/:courseId", ensureAuthenticated, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user._id; // Assuming you have a user ID in the session
    const formData = req.body.fields;

    // Create a new registration form associated with the user
    const registrationForm = new RegistrationForm({
      courseId,
      userId,
      fields: formData,
    });

    // Save the form to the database
    const savedForm = await registrationForm.save();

    // Update the enrolledCourses in the User model
    await User.findByIdAndUpdate(userId, {
      $addToSet: { enrolledCourses: courseId },
    });

    // Update the enrolledStudents in the Course model
    await Course.findByIdAndUpdate(courseId, {
      $addToSet: { enrolledStudents: userId },
    });

    res.status(201).json(savedForm);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unregister from a course
router.delete(
  "/unregister/:courseId",
  ensureAuthenticated,
  async (req, res) => {
    try {
      const courseId = req.params.courseId;
      const userId = req.user._id; // Assuming you have a user ID in the session

      // Find the registration form for the user and course
      const registrationForm = await RegistrationForm.findOne({
        courseId,
        userId,
      });

      if (!registrationForm) {
        return res.status(404).json({ error: "Registration form not found." });
      }

      // Delete the registration form entry to unregister from the course
      await RegistrationForm.findByIdAndDelete(registrationForm._id);

      // Remove the course from enrolledCourses in the User model
      await User.findByIdAndUpdate(userId, {
        $pull: { enrolledCourses: courseId },
      });

      // Remove the user from enrolledStudents in the Course model
      await Course.findByIdAndUpdate(courseId, {
        $pull: { enrolledStudents: userId },
      });

      res.json({ message: "Unregistered from the course" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get all registration forms for the logged-in user
router.get("/registration-forms", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id; // Assuming you have a user ID in the session

    // Find all registration forms associated with the user
    const forms = await RegistrationForm.find({ userId });

    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get and edit user profile data
router.get("/user-profile", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id; // Assuming you have a user ID in the session

    // Find the user by ID and exclude sensitive information (e.g., password)
    const user = await User.findById(userId).select("-password");

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch a specific user by ID
router.get("/users-profile/:userId", async (req, res) => {
  try {
    const userId = req.params.userId; // Get the user ID from the URL parameter

    // Find the user by ID and exclude sensitive information (e.g., password)
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user data
router.put("/user-profile", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id; // Assuming you have a user ID in the session
    const updatedData = req.body;

    // Find and update the user's data
    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get(
  "/user-registration-forms",
  ensureAuthenticated,
  async (req, res) => {
    try {
      const userId = req.user._id; // Assuming you have a user ID in the session

      // Find the user's registration data for all courses
      const registrationForms = await RegistrationForm.find({
        userId,
      });

      res.json(registrationForms);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update user's registration data for a course
router.put(
  "/form-registration/:courseId",
  ensureAuthenticated,
  async (req, res) => {
    try {
      const courseId = req.params.courseId;
      const userId = req.user._id; // Assuming you have a user ID in the session
      const formData = req.body.fields;

      // Check if the registration form exists for the specified courseId and userId
      const existingForm = await RegistrationForm.findOne({ courseId, userId });

      if (!existingForm) {
        return res.status(404).json({ error: "Registration form not found." });
      }

      // Update the user's registration form for the course
      existingForm.fields = formData;
      await existingForm.save();

      res.json({ message: "Registration data updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Enroll an instructor in a course
router.post(
  "/instructors/enroll/:courseId",
  ensureAuthenticated,
  async (req, res) => {
    try {
      const courseId = req.params.courseId;
      const userId = req.user._id; // Assuming you have a user ID in the session

      // Find the course and check if the user is an instructor
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found." });
      }

      // Check if the user is an instructor
      if (req.user.role !== "instructor") {
        return res
          .status(403)
          .json({ error: "Only instructors can enroll in courses." });
      }
      // Push the enrolled instructor into the course
      course.instructorOfTheCourse.push(userId);

      // Fetch user documents for sorting
      const instructors = await User.find({
        _id: { $in: course.instructorOfTheCourse },
      });

      // Sort the instructors based on hierarchy
      instructors.sort((a, b) => {
        // Compare certification level
        const certificationOrder = [
          "Instructor Lecturer of the Polish Sailing Association",
          "PZŻ Sailing Instructor",
          "PZŻ Sailing Teacher (formerly Junior Sailing Instructor of PZŻ)",
          "None",
          // You can add other certifications here
        ];
        const certificationLevelA = certificationOrder.indexOf(
          a.qualifications
        );
        const certificationLevelB = certificationOrder.indexOf(
          b.qualifications
        );
        if (certificationLevelA !== certificationLevelB) {
          return certificationLevelA - certificationLevelB;
        }

        // Compare number of training courses conducted in Iława
        if (a.numberOfCoursesInIlawa !== b.numberOfCoursesInIlawa) {
          return a.numberOfCoursesInIlawa - b.numberOfCoursesInIlawa;
        }

        // Compare sailing rank
        const sailingRankOrder = [
          "Yacht Captain",
          "Yacht Coastal Skipper / (formerly Yacht Skipper)",
          "Yacht Sailor",
        ];
        const sailingRankA = sailingRankOrder.indexOf(a.sailingRank);
        const sailingRankB = sailingRankOrder.indexOf(b.sailingRank);
        if (sailingRankA !== sailingRankB) {
          return sailingRankA - sailingRankB;
        }

        // Compare number of training courses conducted outside Iława
        return a.numberOfCoursesOutsideIlawa - b.numberOfCoursesOutsideIlawa;
      });

      // Update the course's instructorOfTheCourse with the sorted instructors
      course.instructorOfTheCourse = instructors.map(
        (instructor) => instructor._id
      );
      // Save the course with the updated instructors and hierarchy
      await course.save();

      res.json({ message: "Instructor enrolled in the course." });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Enroll an instructor in half of a 2-day course
router.post(
  "/instructors/enroll-half/:courseId",
  ensureAuthenticated,
  async (req, res) => {
    try {
      const courseId = req.params.courseId;
      const userId = req.user._id; // Assuming you have a user ID in the session

      // Find the course and check if the user is an instructor
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found." });
      }

      // Check if the user is an instructor
      if (req.user.role !== "instructor") {
        return res
          .status(403)
          .json({ error: "Only instructors can enroll in courses." });
      }

      // Check if the course is a 2-day course
      if (course.courseDurationDays !== 2) {
        return res
          .status(400)
          .json({ error: "This course is not a 2-day course." });
      }

      // Enroll the instructor in the course
      course.instructorOfTheCourse.push(userId);

      // Fetch user documents for sorting
      const instructors = await User.find({
        _id: { $in: course.instructorOfTheCourse },
      });

      // Sort the instructors based on hierarchy
      instructors.sort((a, b) => {
        // Compare certification level
        const certificationOrder = [
          "Instructor Lecturer of the Polish Sailing Association",
          "PZŻ Sailing Instructor",
          "PZŻ Sailing Teacher (formerly Junior Sailing Instructor of PZŻ)",
          "None",
          // You can add other certifications here
        ];
        const certificationLevelA = certificationOrder.indexOf(
          a.qualifications
        );
        const certificationLevelB = certificationOrder.indexOf(
          b.qualifications
        );
        if (certificationLevelA !== certificationLevelB) {
          return certificationLevelA - certificationLevelB;
        }

        // Compare number of training courses conducted in Iława
        if (a.numberOfCoursesInIlawa !== b.numberOfCoursesInIlawa) {
          return a.numberOfCoursesInIlawa - b.numberOfCoursesInIlawa;
        }

        // Compare sailing rank
        const sailingRankOrder = [
          "Yacht Captain",
          "Yacht Coastal Skipper / (formerly Yacht Skipper)",
          "Yacht Sailor",
        ];
        const sailingRankA = sailingRankOrder.indexOf(a.sailingRank);
        const sailingRankB = sailingRankOrder.indexOf(b.sailingRank);
        if (sailingRankA !== sailingRankB) {
          return sailingRankA - sailingRankB;
        }

        // Compare number of training courses conducted outside Iława
        return a.numberOfCoursesOutsideIlawa - b.numberOfCoursesOutsideIlawa;
      });

      // Update the course's instructorOfTheCourse with the sorted instructors
      course.instructorOfTheCourse = instructors.map(
        (instructor) => instructor._id
      );

      await course.save();

      res.json({
        message: "Instructor enrolled in the first day of the 2-day course.",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
