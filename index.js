const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportConfig = require("./passport-config");
const { swaggerUi, specs } = require("./swagger");

const Course = require("./models/courseModel");
const RegistrationForm = require("./models/registrationForm");
const User = require("./models/user");
const authRoutes = require("./routes/auth");
const coursesRoutes = require("./routes/courses");
const userRoutes = require("./routes/user");

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
app.use("/courses", coursesRoutes);
app.use("/user", userRoutes);

app.get("/", (req, res) => {
  res.send("Server is running properly.");
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
