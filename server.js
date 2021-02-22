const express = require("express");
const cors = require("cors");
const { Expo } = require("expo-server-sdk");

const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

let expo = new Expo();

app.post("/", async (req, res) => {
  if (!Expo.isExpoPushToken(req.body.token)) {
    return res.status(400).send({
      message: `Push token ${req.body.token} is not a valid Expo push token`,
    });
  }

  const chunks = expo.chunkPushNotifications([
    {
      to: req.body.token,
      title: req.body.title,
      body: req.body.message,
      data: req.body.data,
      priority: "high",
      sound: "default",
      channelId: "default",
    },
  ]);

  const sendChunks = async () => {
    chunks.forEach(async (chunk) => {
      try {
        const ticket = await expo.sendPushNotificationsAsync(chunk);
        res.status(200).send({ ticket, message: "Push notification sent!" });
      } catch (error) {
        res.status(400).send({ error });
      }
    });
  };

  await sendChunks();
});

app.post("/broadcast", async (req, res) => {
  let messages = [];
  for (let pushToken of req.body.tokens) {
    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken.token)) {
      console.error(
        `Push token ${pushToken.token} is not a valid Expo push token`
      );
      continue;
    }

    messages.push({
      to: pushToken.token,
      title: req.body.title,
      body: req.body.message,
      priority: "high",
      sound: "default",
      channelId: "default",
    });
  }

  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  (async () => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(ticketChunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error(error);
      }
    }
  })();
  res.status(200).send({ message: "Push notification sent!" });
  return;
});

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);
