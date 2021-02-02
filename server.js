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

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);
