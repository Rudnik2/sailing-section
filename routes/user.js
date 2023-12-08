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

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API for managing user-related operations
 */

/**
 * @swagger
 * /user/register/{courseId}:
 *   post:
 *     summary: Register for a course and create a registration form
 *     description: Endpoint to register a user for a course and create a registration form.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             fields:
 *               firstName: "Jane"
 *               lastName: "Smith"
 *               pesel: "9876543210"
 *               phoneNumber: "987-564-321"
 *               cost: 150
 *               date: "2023-12-01"
 *               email: "jane@example.com"
 *
 *     responses:
 *       201:
 *         description: Registration form created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /user/unregister/{courseId}:
 *   delete:
 *     summary: Unregister from a course
 *     description: Endpoint to unregister a user from a course.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unregistered from the course
 *       404:
 *         description: Registration form not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /user/user-profile:
 *   get:
 *     summary: Get user profile data
 *     description: Endpoint to get user profile data for the logged-in user.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /user/users-profile/{userId}:
 *   get:
 *     summary: Fetch a specific user by ID
 *     description: Endpoint to fetch details of a specific user by their ID.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /user/user-profile:
 *   put:
 *     summary: Update user data
 *     description: Endpoint to update user data for the logged-in user.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             username: "updatedUser"
 *             email: "updateduser@example.com"
 *     responses:
 *       200:
 *         description: User data updated successfully
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /user/user-registration-forms:
 *   get:
 *     summary: Get user's registration forms for all courses
 *     description: Endpoint to get all registration forms for courses the logged-in user is registered for.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RegistrationForm'
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /user/form-registration/{courseId}:
 *   put:
 *     summary: Update user's registration data for a course
 *     description: Endpoint to update user's registration data for a specific course.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             fields:
 *               exampleField: "updatedValue"
 *     responses:
 *       200:
 *         description: Registration data updated successfully
 *       404:
 *         description: Registration form not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /user/instructors/enroll/{courseId}:
 *   post:
 *     summary: Enroll an instructor in a course
 *     description: Endpoint to enroll an instructor in a course.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Instructor enrolled in the course
 *       403:
 *         description: Only instructors can enroll in courses
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
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

        // Set index to "None" if the certification is not in the order
        const certificationLevelAValue =
          certificationLevelA !== -1
            ? certificationLevelA
            : certificationOrder.indexOf("None");
        const certificationLevelBValue =
          certificationLevelB !== -1
            ? certificationLevelB
            : certificationOrder.indexOf("None");

        if (certificationLevelAValue !== certificationLevelBValue) {
          return certificationLevelAValue - certificationLevelBValue;
        }

        const numberOfCoursesInIlawaA = a.numberOfCoursesInIlawa || 0;
        const numberOfCoursesInIlawaB = b.numberOfCoursesInIlawa || 0;

        if (numberOfCoursesInIlawaA !== numberOfCoursesInIlawaB) {
          return numberOfCoursesInIlawaB - numberOfCoursesInIlawaA;
        }

        // Compare sailing rank
        const sailingRankOrder = [
          "Yacht Captain",
          "Yacht Coastal Skipper / (formerly Yacht Skipper)",
          "Yacht Sailor",
        ];
        const sailingRankA = sailingRankOrder.indexOf(a.sailingRank);
        const sailingRankB = sailingRankOrder.indexOf(b.sailingRank);
        const sailingRankAValue =
          sailingRankA !== -1
            ? sailingRankA
            : sailingRankOrder.indexOf("Yacht Sailor");
        const sailingRankBValue =
          sailingRankB !== -1
            ? sailingRankB
            : sailingRankOrder.indexOf("Yacht Sailor");

        if (sailingRankAValue !== sailingRankBValue) {
          return sailingRankAValue - sailingRankBValue;
        }

        // Compare number of training courses conducted outside Iława
        const numberOfCoursesOutsideIlawaA = a.numberOfCoursesOutsideIlawa || 0;
        const numberOfCoursesOutsideIlawaB = b.numberOfCoursesOutsideIlawa || 0;
        return numberOfCoursesOutsideIlawaB - numberOfCoursesOutsideIlawaA;
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

/**
 * @swagger
 * /user/instructors/enroll-half/{courseId}:
 *   post:
 *     summary: Enroll an instructor in half of a 2-day course
 *     description: Endpoint to enroll an instructor in the first day of a 2-day course.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Instructor enrolled in the first day of the 2-day course
 *       400:
 *         description: This course is not a 2-day course
 *       403:
 *         description: Only instructors can enroll in courses
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
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

        // Set index to "None" if the certification is not in the order
        const certificationLevelAValue =
          certificationLevelA !== -1
            ? certificationLevelA
            : certificationOrder.indexOf("None");
        const certificationLevelBValue =
          certificationLevelB !== -1
            ? certificationLevelB
            : certificationOrder.indexOf("None");

        if (certificationLevelAValue !== certificationLevelBValue) {
          return certificationLevelAValue - certificationLevelBValue;
        }

        const numberOfCoursesInIlawaA = a.numberOfCoursesInIlawa || 0;
        const numberOfCoursesInIlawaB = b.numberOfCoursesInIlawa || 0;

        if (numberOfCoursesInIlawaA !== numberOfCoursesInIlawaB) {
          return numberOfCoursesInIlawaB - numberOfCoursesInIlawaA;
        }

        // Compare sailing rank
        const sailingRankOrder = [
          "Yacht Captain",
          "Yacht Coastal Skipper / (formerly Yacht Skipper)",
          "Yacht Sailor",
        ];
        const sailingRankA = sailingRankOrder.indexOf(a.sailingRank);
        const sailingRankB = sailingRankOrder.indexOf(b.sailingRank);
        const sailingRankAValue =
          sailingRankA !== -1
            ? sailingRankA
            : sailingRankOrder.indexOf("Yacht Sailor");
        const sailingRankBValue =
          sailingRankB !== -1
            ? sailingRankB
            : sailingRankOrder.indexOf("Yacht Sailor");

        if (sailingRankAValue !== sailingRankBValue) {
          return sailingRankAValue - sailingRankBValue;
        }

        // Compare number of training courses conducted outside Iława
        const numberOfCoursesOutsideIlawaA = a.numberOfCoursesOutsideIlawa || 0;
        const numberOfCoursesOutsideIlawaB = b.numberOfCoursesOutsideIlawa || 0;
        return numberOfCoursesOutsideIlawaB - numberOfCoursesOutsideIlawaA;
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
