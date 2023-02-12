const mongoose = require("mongoose");
const Joi = require("joi");

const schema = new mongoose.Schema({
  resName: {
    type: String,
    required: true,
    maxlength: 50,
    minlength: 2,
  },
  rating: {
    type: String,
    required: true,
    maxlength: 50,
    minlength: 2,
  },
  roomID: {
    type: String,
    required: true,
    maxlength: 100,
    minlength: 2,
    unique: true,
  },
  resLink: {
    type: String,
    required: true,
    maxlength: 1024,
    minlength: 5,
  },
  resImageUrl: {
    type: String,
    required: true,
    maxlength: 1024,
    minlength: 2,
  },
  resLat: {
    type: Number,
    default: 32.080157,
  },
  resLng: {
    type: Number,
    default: 34.780984,
  },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
  usersStatus: { type: [String], enum: ["pending", "approved", "disapproved"], default: "pending" },
  cuisine: {
    type: [String],
    default: ["foodi", "goodi"],
  },
  address: {
    type: String,
    default: "NO ADRESS PROVIDED",
  },
});

function validateEvent(event) {
  const schema = {
    resName: Joi.string().min(2).max(50).required(),
    rating: Joi.string().min(2).max(255).required(),
    resLink: Joi.string().min(2).max(255).required(),
    resLng: Joi.number().min(-150).max(150).required(),
    resLat: Joi.number().min(-150).max(150).required(),
    resImageUrl: Joi.string().min(2).max(255).required(),
    users: Joi.array().items(Joi.string()),
    usersStatus: Joi.array(),
    cuisine: Joi.array(),
    address: Joi.string(),
  };
  return Joi.validate(event, schema);
}
const Event = new mongoose.model("Events", schema);

module.exports.Event = Event;
module.exports.validateEvent = validateEvent;
