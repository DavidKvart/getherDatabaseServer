const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
mongoose.set("strictQuery", true);
const auth = require("./routes/auth");
const events = require("./routes/eventsR");
// connect to data base
mongoose
  .connect("mongodb+srv://davidkvarts:1136896@cluster0.taqcgkj.mongodb.net/?retryWrites=true&w=majority")
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
