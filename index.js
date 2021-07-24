const express = require("express");
const {
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_IP,
  MONGO_PORT,
  REDIS_URL,
  REDIS_PORT,
  SESSION_SECRET,
} = require("./config/config");
const mongoose = require("mongoose");
const session = require("express-session");
const redis = require("redis");
const RedisStore = require("connect-redis")(session);
const postRouter = require("./routes/postRoutes");
const userRouter = require("./routes/userRoutes");
const cors = require("cors");

const app = express();

const mongoURL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/database?authSource=admin`;
const connectWithRetry = () => {
  mongoose
    .connect(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: true,
    })
    .then(() => console.log("successfully connected to DB"))
    .catch((e) => {
      console.log("error", e);
      setTimeout(connectWithRetry, 5000);
    });
};

app.use(express.json());

const redisClient = redis.createClient({
  host: REDIS_URL,
  port: REDIS_PORT,
});
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: SESSION_SECRET,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 30000, //ms
    },
    resave: false,
    saveUninitialized: true,
  })
);

connectWithRetry();
app.enable("trust proxy");
app.use(cors({}));
app.get("/api/v1", (req, res) => {
  res.send("<h2>hello world samuel<h2>");
  console.log("yeah it ran");
});

app.use("/api/v1/posts", postRouter);
app.use("/api/v1/users", userRouter);

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`listening on port ${port}`));
