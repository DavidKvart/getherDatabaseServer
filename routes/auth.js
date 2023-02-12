const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();
const { User, validate } = require('../modules/users/signUp');
const Joi = require('joi');

// ?setting up env
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dfcmf6gbn',
  api_key: '569295945456765',
  api_secret: 'ZDjY4svXM3DkPMaMxel4ycMqVcM',
});
function validateUser(user) {
  const schema = {
    email: Joi.string().min(4).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
    courentLat: Joi.number().min(-150).max(150),
    courentLng: Joi.number().min(-150).max(150),
  };
  return Joi.validate(user, schema);
}
//? ---------

//* SIGN UP
router.post('/signup', async (req, res) => {
  try {
    //! errors vartificaition

    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    let user = await User.findOne({ email: req.body.email });

    if (user) return res.status(400).send('User already exsist ');

    user = req.body;

    // //* initilaize password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    console.log('-----waiting on cloudinary----');
    // //* initilize image
    const uploadResponse = await cloudinary.uploader.upload(user.fileStr, {
      upload_preset: 'oded_and_david',
    });

    // //*saving to mongo
    let finalUser = new User({
      name: user.name,
      email: user.email,
      courentLat: user.courentLat,
      courentLng: user.courentLng,
      homeLat: user.homeLat,
      homeLng: user.homeLng,
      password: user.password,
      phone: user.phone,
      imageUrl: uploadResponse.secure_url,
      expoToken: user.expoToken,
      transportMode: user.transportMode,
    });

    let result = await finalUser.save();

    res
      .header('x-auth-token', result.generateJWT())
      .header('access-control-expose-headers', 'x-auth-token')
      .send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});
//*LOGIN
router.post('/login', async (req, res) => {
  try {
    //! errors vartificaition
    //check schema

    const { error } = validateUser(req.body.data);
    if (error) return res.status(400).send(error.details[0].message);
    // check user exist

    let user = await User.findOne({ email: req.body.data.email });
    if (!user) return res.status(400).send('Invalid email or password. ');

    //check password
    const valiedPassword = await bcrypt.compare(
      req.body.data.password,
      user.password
    );
    if (!valiedPassword)
      return res.status(400).send('Invalid email or password. ');

    // check same token ?
    if (user.expoToken !== req.body.deviceToken) {
      user.expoToken = req.body.deviceToken;
      user = await user.save();
    }

    //* response
    if (user) {
      res
        .header('x-auth-token', user.generateJWT())
        .header('access-control-expose-headers', 'x-auth-token')
        .send(user);
    } else {
      res.status(500).send(error);
    }
  } catch (error) {
    res.status(502).send(error);
  }
});
//* GET ALL USERS
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select({
      name: 1,
      phone: 1,
      email: 1,
      imageUrl: 1,
      transportMode: 1,
      courentLat: 1,
      courentLng: 1,
    });

    if (users.length > 0) {
      let newList = users.map((person) => {
        let temp = { ...person._doc, imageAvailable: 'user' };
        return temp;
      });
      res.send(newList);
    } else res.status(502).send('cant find users ');
  } catch (err) {
    res.status(502).send(err.message);
  }
});
//* VALIDATE USER BY ID
router.post('/validate/:id', async (req, res) => {
  try {
    const result = await User.findById(req.params.id).select({
      name: 1,
      phone: 1,
      email: 1,
      imageUrl: 1,
      courentLat: 1,
      courentLng: 1,
      expoToken: 1,
      transportMode: 1,
    });

    if (result) {
      if (result.expoToken != req.body.deviceToken) {
        let answer = await User.findByIdAndUpdate(req.params.id, {
          expoToken: req.body.deviceToken,
        }).select({
          name: 1,
          phone: 1,
          email: 1,
          imageUrl: 1,
          courentLat: 1,
          courentLng: 1,
          expoToken: 1,
          transportMode: 1,
        });
        answer = await User.findById(req.params.id).select({
          name: 1,
          phone: 1,
          email: 1,
          imageUrl: 1,
          courentLat: 1,
          courentLng: 1,
          expoToken: 1,
          transportMode: 1,
        });

        res.send(answer);
      } else {
        console.log(' was the same');
        res.send(result);
      }
    } else res.status(502).send('cant find user');
  } catch (err) {
    res.status(502).send(err.message);
  }
});
//* get array of users and return it populated
router.post('/getusers', async (req, res) => {
  let tempArray = [];
  for (i = 0; i < req.body.length; i++) {
    let result = await User.find({ _id: req.body[i] }).select({
      name: 1,
      phone: 1,
      email: 1,
      imageUrl: 1,
      courentLat: 1,
      courentLng: 1,
      transportMode: 1,
      expoToken: 1,
    });
    if (result) {
      tempArray.push(result[0]);
    }
  }

  res.send(tempArray);
});
//* change user courent locaition
router.put('/:id', async (req, res) => {
  try {
    const result = await User.findByIdAndUpdate(req.params.id, {
      courentLat: req.body.latitude,
      courentLng: req.body.longitude,
    });
    console.log(result);
    res
      .header('x-auth-token', result.generateJWT())
      .header('access-control-expose-headers', 'x-auth-token')
      .send(result);
  } catch (error) {
    res.status(502).send(error);
  }
});
//* check if user exist by mail
router.get('/bymail/:mail', async (req, res) => {
  try {
    let result = await User.findOne({ email: req.params.mail }).select({
      _id: 1,
    });
    if (result) {
      res.send(result);
    } else {
      res.send('user does not exist');
    }
  } catch (error) {
    res.status(502).send(error);
  }
});
//* change user passwords
router.put('/password/:id', async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    let newPassword = await bcrypt.hash(req.body.password, salt);
    let result = await User.findByIdAndUpdate(req.params.id, {
      password: newPassword,
    }).select({
      name: 1,
      phone: 1,
      email: 1,
      imageUrl: 1,
      courentLat: 1,
      courentLng: 1,
      expoToken: 1,
      _id: 1,
      transportMode: 1,
      expoToken: 1,
    });
    if (result) {
      res.send('password was changed');
    } else {
      res.send('cant change password');
    }
  } catch (error) {
    res.status(502).send(error);
  }
});
//* change users transport type
router.put('/transport/:id', async (req, res) => {
  try {
    let result = await User.findByIdAndUpdate(req.params.id, {
      transportMode: req.body.transportMode,
    }).select({
      name: 1,
      phone: 1,
      email: 1,
      imageUrl: 1,
      courentLat: 1,
      courentLng: 1,
      expoToken: 1,
      _id: 1,
      transportMode: 1,
      expoToken: 1,
    });

    if (result) {
      result = await User.find({ _id: req.params.id }).select({
        name: 1,
        phone: 1,
        email: 1,
        imageUrl: 1,
        courentLat: 1,
        courentLng: 1,
        transportMode: 1,
        expoToken: 1,
      });
      console.log(result);
      res.send(result[0]);
    } else {
      res.send('cant change type');
    }
  } catch (error) {
    res.status(502).send(error);
  }
});
module.exports = router;
