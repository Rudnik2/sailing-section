const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportConfig = require("./passport-config");

const Course = require("./models/courseModel");
const RegistrationForm = require("./models/registrationForm");
const authRoutes = require("./routes/auth");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(
  session({ secret: "MY-SECRET-KEY", resave: false, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(
  "mongodb+srv://sailingProjectAdmin:baCjwqyiimBLoA2y@sailingproject.ibuzldl.mongodb.net/?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Server is running properly.");
});

// Create a new course
app.post("/courses", async (req, res) => {
  try {
    const newCourse = new Course(req.body);
    const savedCourse = await newCourse.save();
    res.status(201).json(savedCourse);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all courses
app.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific course by ID
app.get("/courses/:id", async (req, res) => {
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
app.put("/courses/:id", async (req, res) => {
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
app.delete("/courses/:id", async (req, res) => {
  try {
    await Course.findByIdAndRemove(req.params.id);
    res.sendStatus(204); // No content
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Registration forms:

app.post("/registration-forms", async (req, res) => {
  try {
    const { userId, ...formData } = req.body;
    const newForm = new RegistrationForm({
      userId,
      ...formData,
    });
    const savedForm = await newForm.save();
    res.status(201).json(savedForm);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/registration-forms/:userId", async (req, res) => {
  try {
    const forms = await RegistrationForm.find({
      userId: req.params.userId,
    });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/registration-forms/:courseId", async (req, res) => {
  try {
    const forms = await RegistrationForm.find({
      courseId: req.params.courseId,
    });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific registration form template by ID
app.get("/registration-forms/template/:id", async (req, res) => {
  try {
    const form = await RegistrationForm.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ error: "Form template not found." });
    }
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
