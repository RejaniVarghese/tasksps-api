import express, { response } from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";
import cookieParser from 'cookie-parser';
import path from "path";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from './model/user.js';
import Task from './model/task.js';

mongoose.connect(process.env.MONGODB_CONNECTION_STRING);

const app = express();
//const jwtSecret = 'faserljlkjkljlwerewsf';
const jwtSecret = process.env.JWT_SECRET_KEY;

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ["https://tasksps-client.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE","OPTIONS"],
  credentials: true,
}));

app.get("/test", async (req, res) => {

  res.json("listening to home page");
});


app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userDoc = await User.create({
      name,
      email,
      password,
    });
    res.status(200).json(userDoc);
  } catch (error) {
    res.status(422).json(error);
  }
})

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userDoc = await User.findOne({ email });
    if (userDoc) {
      const passOk = await bcrypt.compare(password, userDoc.password);
      if (passOk) {
        jwt.sign({
          email: userDoc.email, id: userDoc._id
        }, jwtSecret, {}, (err, token) => {
          if (err) throw err;
          res.cookie('token', token).json(userDoc);
        });
      } else {
        res.status(422).json('something went wrong');
      }
    } else {
      res.status(422).json('not found');
    }
  } catch (error) {
    res.status(422).json(error);
  }
})

app.get('/remove-cookie', (req, res) => {
  res.cookie('token', '', { expires: new Date(0) });
  res.send('Cookie removed');
});

app.get('/profile', (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const { name, email, _id } = await User.findById(userData.id);
      res.json({ name, email, _id });

    })
  }
});

app.get("/events", async (req, res) => {

  const token = req.cookies.token;

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const tasksWithUser = await Task.findOne({ 'user': decoded.id });
    if (tasksWithUser) {
      return res.status(200).send(tasksWithUser.tasks)
    } else {
      return res.status(200).send([{}])
    }
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token', error: err });
  }

})

app.post("/events", async (req, res) => {

  const { tasks, user } = req.body;
  try {
    const tasksWithUser = await Task.findOne({ 'user': user });
    if (tasksWithUser) {
      const taskDoc = await Task.findOneAndUpdate({ 'user': user }, { 'tasks': tasks }, { new: true })
    } else {
      const taskDoc = await Task.create({
        tasks,
        user,
      });
    }

    res.status(200).json(taskDoc);
  } catch (error) {
    res.status(422).json(error);
  }
});

if (process.env.API_PORT) {
  app.listen(process.env.API_PORT, () => {
    console.log("listening to port 7000");
  })
}
