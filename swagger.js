const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const courseSchema = require("./models/courseModel"); // Reference to your Course model
const registrationFormSchema = require("./models/registrationForm"); // Reference to your RegistrationForm model
const userSchema = require("./models/user"); // Reference to your User model

const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Your API Documentation",
      version: "1.0.0",
      description: "Documentation for your API",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
    components: {
      schemas: {
        Course: {
          type: "object",
          properties: courseSchema.obj, // Use .obj to access the properties of the mongoose schema
        },
        RegistrationForm: {
          type: "object",
          properties: registrationFormSchema.obj,
        },
        User: {
          type: "object",
          properties: userSchema.obj,
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
