const express = require("express");
const Course = require("../models/courseModel");
const User = require("../models/user");
const RegistrationForm = require("../models/registrationForm");

const upload = require("../middleware/upload");
const pdf = require("pdf-parse");
require("dotenv").config();
const {
  checkAdmin,
  ensureAuthenticated,
} = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: API for managing courses and registrations
 */

/**
 * @swagger
 * /courses:
 *   post:
 *     summary: Create a new course
 *     description: Endpoint to create a new course.
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               cost:
 *                 type: number
 *               dates:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: date
 *               courseDurationDays:
 *                 type: number
 *             required:
 *               - name
 *               - description
 *               - cost
 *               - dates
 *               - courseDurationDays
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/", checkAdmin, async (req, res) => {
  try {
    const newCourse = new Course(req.body);
    const savedCourse = await newCourse.save();
    res.status(201).json(savedCourse);
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Get all courses
 *     description: Endpoint to get a list of all courses.
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Course'
 *       500:
 *         description: Internal server error
 */
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Get a specific course by ID
 *     description: Endpoint to get details of a specific course by its ID.
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /courses/{id}:
 *   put:
 *     summary: Update a course by ID
 *     description: Endpoint to update details of a specific course by its ID.
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               cost:
 *                 type: number
 *               dates:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: date
 *               courseDurationDays:
 *                 type: number
 *             required:
 *               - name
 *               - description
 *               - cost
 *               - dates
 *               - courseDurationDays
 *     responses:
 *       200:
 *         description: Course updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put("/:id", checkAdmin, async (req, res) => {
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

/**
 * @swagger
 * /courses/{id}:
 *   delete:
 *     summary: Delete a course by ID
 *     description: Endpoint to delete a specific course by its ID.
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: No content
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", checkAdmin, async (req, res) => {
  try {
    await Course.findByIdAndRemove(req.params.id);
    res.sendStatus(204); // No content
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /courses/{courseId}/form-templates:
 *   post:
 *     summary: Create a new form template for a course
 *     description: Endpoint to create or update a form template for a course.
 *     tags: [Courses]
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
 *           schema:
 *             type: object
 *             properties:
 *               fields:
 *                 type: array
 *                 example:
 *                   - fieldName: "string1"
 *                     fieldType: "text"
 *                     isRequired: true
 *                   - fieldName: "string2"
 *                     fieldType: "text"
 *                     isRequired: true
 *                 items:
 *                   type: object
 *                   properties:
 *                     fieldName:
 *                       type: string
 *                     fieldType:
 *                       type: string
 *                       enum: [text, number, date, email]
 *                     isRequired:
 *                       type: boolean
 *                 required:
 *                   - fieldName
 *                   - fieldType
 *                   - isRequired
 *     responses:
 *       201:
 *         description: Form template created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegistrationForm'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
router.post("/:courseId/form-templates", checkAdmin, async (req, res) => {
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

/**
 * @swagger
 * /courses/{courseId}/upload-payment-confirmation:
 *   post:
 *     summary: Upload payment confirmation for a course
 *     description: Endpoint to upload a payment confirmation file for a specific course.
 *     tags: [Courses]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               paymentConfirmation:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Payment confirmation file is valid
 *       400:
 *         description: Bad request or invalid file
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/:courseId/upload-payment-confirmation",
  ensureAuthenticated,
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
