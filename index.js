const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
mongoose.set("strictQuery", true);
const auth = require("./routes/auth");
const events = require("./routes/eventsR");

// connect to data base
let mongoPassword = process.env.MONGO_PASS;

mongoose
  .connect(`mongodb+srv://davidkvarts:${process.env.MONGO_PASS}@cluster0.taqcgkj.mongodb.net/?retryWrites=true&w=majority`)
  .then(() => {
    console.log("connected");
  })
  .catch(() => {
    console.log("couldnt connect");
  });

// variable declareition
const app = express();
const port = 3100;

// middleweres///
app.use(express.json({ limit: "20mb" }));
app.use(cors());

//routes//
app.use("/users", auth);
app.use("/events", events);
// open server
app.listen(port, () => console.log(`database active on port: ${port}`));
