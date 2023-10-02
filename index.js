const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

mongoose.connect(
  "mongodb+srv://sailingProjectAdmin:baCjwqyiimBLoA2y@sailingproject.ibuzldl.mongodb.net/?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

app.get("/", (req, res) => {
  res.send("Server is running properly.");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
