const bcrypt = require("bcrypt");
const express = require("express");
const router = express.Router();
const { Event, validateEvent } = require("../modules/events/eventsM");

//? decleraition
// generate random roomID for socket
const generateRoomID = async () => {
  let randomString = "";
  const possibleNumbers = "0123456789";
  const possibleLetters = "abcdefghijklmnopqrstuvwxyz";

  for (let i = 0; i < 3; i++) {
    randomString += possibleNumbers.charAt(Math.floor(Math.random() * possibleNumbers.length));
  }

  for (let i = 0; i < 3; i++) {
    randomString += possibleLetters.charAt(Math.floor(Math.random() * possibleLetters.length));
  }

  let result = await Event.findOne({ roomID: randomString });

  if (result) {
    generateRoomID();
  } else return randomString;
  return;
};
//?--------

// * CREATE AN EVENT
router.post("/", async (req, res) => {
  try {
    //! errors vartificaition
    const { error } = validateEvent(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    //?setup
    let roomID = await generateRoomID();
    let event = req.body;

    //*saving to mongo
    event = new Event({
      resName: event.resName,
      rating: event.rating,
      roomID: roomID,
      resLink: event.resLink,
      resLng: event.resLng,
      resLat: event.resLat,
      resImageUrl: event.resImageUrl,
      users: event.users,
      usersStatus: event.usersStatus,
      cuisine: event.cuisine,
      address: event.address,
    });

    let result = await event.save();
    result = await result.populate("users");

    let body = "Join : ";
    result.users.map((user) => {
      body = body + user.name + ", ";
    });
    body = body + "for a wonderful time at: " + result.resName + "! youre room ID is : " + result.roomID;

    result.users.map((user, index) => {
      if (index !== result.users.length - 1) {
        if (user.expoToken != "no token provided") {
          let message = {
            to: user.expoToken,
            sound: "default",
            title: "You were invited to a meal!",
            body: body, //? here we pot the message
            data: { someData: "goes here" },
          };
          sendPushNotification(message);
        }
      }
    });

    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});
//*DELETE AN EVENT
router.delete("/:id", async (req, res) => {
  try {
    //! errors vartificaition
    //check schema

    if (req.params.id) {
      const event = await Event.findByIdAndRemove(req.params.id).populate("users");

      if (event) {
        let body = "it looks like the event in: " + event.resName + " was canceled";
        event.users.map((user, index) => {
          if (user.expoToken != "no token provided") {
            let message = {
              to: user.expoToken,
              sound: "default",
              title: "OH NO!",
              body: body,
              data: { someData: "goes here" },
            };
            sendPushNotification(message);
          }
        });
        res.send("event was deleted");
      } else res.status(404).send("event does not exist bro");
    }
  } catch (error) {
    res.status(502).send(error.message);
  }
});
//* GET EVENT BY ROOM ID
router.get("/:roomID", async (req, res) => {
  try {
    //! errors vartificaition
    //check schema
    if (req.params.roomID) {
      const event = await Event.findOne({ roomID: req.params.roomID }).populate({ path: "users", select: "name imageUrl courentLat courentLng phone transportMode expoToken" });
      if (event) res.send(event);
      else res.status(404).send("event does not exist bro ");
    }
  } catch (error) {
    res.status(502).send(error.message);
  }
});
//* CHANGE USER STATUS
router.put("/status", async (req, res) => {
  try {
    // userid, status, eventid
    const event = await Event.findById(req.body.eventId);
    let index = event.users.indexOf(req.body.userId);
    if (index === -1) {
      throw new Error("User not found in event");
    }
    event.usersStatus[index] = req.body.status;
    let result = await event.save();
    result = await result.populate({ path: "users", select: "name imageUrl courentLat courentLng phone transportMode expoToken" });
    res.send(result);
  } catch (error) {
    res.status(502).send(error.message);
  }
});
//* REMOVE USER FROM EVENT
router.post("/remove/:roomID", async (req, res) => {
  try {
    const event = await Event.findOne({ roomID: req.params.roomID });
    if (event) {
      let index = event.users.findIndex((user) => user._id == req.body.userID);

      if (index !== -1) {
        event.users.splice(index, 1);
        event.usersStatus.splice(index, 1);
        let result = await event.save();
        result = await result.populate({ path: "users", select: "name imageUrl courentLat courentLng phone transportMode expoToken" });
        res.send(result);
      } else res.status(502).send("couldnt find user");
    } else {
      res.status(502).send("couldnt find event");
    }
  } catch (error) {
    res.status(502).send(error.message);
  }
});
//* ADD USERS TO EXISTING EVENT
router.put("/:eventID", async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventID);

    if (req.body.length > 0 && event) {
      for (let i = 0; i < req.body.length; i++) {
        event.users.push(req.body[i]);
        event.usersStatus.push("pending");
      }

      let result = await event.save();
      result = await result.populate({ path: "users", select: "name imageUrl courentLat courentLng phone transportMode expoToken" });

      let body = "Join : ";
      result.users.map((user) => {
        body = body + user.name + ", ";
      });
      body = body + "for a wonderful time at: " + result.resName + "! youre room ID is : " + result.roomID;

      result.users.map((user, index) => {
        if (req.body.includes(user._id) && user.expoToken != "no token provided") {
          let message = {
            to: user.expoToken,
            sound: "default",
            title: "You were invited to a meal!",
            body: body, //? here we pot the message
            data: { someData: "goes here" },
          };
          sendPushNotification(message);
        }
      });

      res.send(result);
    } else res.status(502).send("couldnt find users or event");
  } catch (error) {
    res.status(502).send(error.message);
  }
});

module.exports = router;

const sendPushNotification = async (message) => {
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
};
