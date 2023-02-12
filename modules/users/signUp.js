const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 50,
    minlength: 2,
  },
  password: {
    type: String,
    required: true,
    maxlength: 1024,
    minlength: 5,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    maxlength: 50,
    minlength: 2,
    unique: true,
  },
  imageUrl: {
    type: String,
    required: true,
    maxlength: 1024,
    minlength: 2,
  },
  phone: {
    type: Number,
    required: true,
  },
  courentLat: {
    type: Number,
    default: 32.080157,
  },
  courentLng: {
    type: Number,
    default: 34.780984,
  },
  homeLat: {
    type: Number,
    default: 32.08772,
  },
  homeLng: {
    type: Number,
    default: 34.791112,
  },
  expoToken: {
    type: String,
    default: "no token provided",
  },
  transportMode: {
    type: String,
    enum: ["DRIVING", "WALKING", "BICYCLING", "TRANSIT"],
    default: "WALKING",
  },
});
schema.methods.generateJWT = function () {
  const token = jwt.sign({ _id: this._id }, "oded_and_david");
  return token;
};
function validateUser(user) {
  const schema = {
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().min(4).max(255).required().email(),
    courentLat: Joi.number().min(-150).max(150),
    courentLng: Joi.number().min(-150).max(150),
    homeLat: Joi.number().min(-150).max(150),
    phone: Joi.number().required(),
    homeLng: Joi.number().min(-150).max(150),
    password: Joi.string().min(5).max(255).required(),
    fileStr: Joi.string(),
    expoToken: Joi.string(),
    transportMode: Joi.string(),
  };
  return Joi.validate(user, schema);
}
const User = new mongoose.model("Users", schema);

module.exports.User = User;
module.exports.validate = validateUser;

//   return Joi.validate(user, schema);
// }

//
