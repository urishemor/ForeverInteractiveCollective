import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

import bodyParser from 'body-parser';
import axios from 'axios';
import connectDB from './mongodb/connect.js';
import User from './mongodb/models/user.js';
import Showcase from './mongodb/models/showcase.js';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

dotenv.config();


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const upload = multer({ dest: 'uploads/' });

const app = express();

app.use(cors());
app.use(bodyParser.json());


app.get('/showcases/:areaId', async (req, res) => {
  const { areaId } = req.params;
  const showcases = await Showcase.find({ area: areaId });
  res.send(showcases);
});

app.get('/showcases', async (req, res) => {
  const showcases = await Showcase.find();
  res.send(showcases);
});


app.post('/signup', async (req, res) => {
  const { userName, firstName, lastName, email, password } = req.body;
  try {
    const user = await User.create({
      userName,
      email,
      firstName,
      lastName,
      password
    });
    console.log('added user ' + user.id);
    res.send(user);
  } catch (e) {
    console.log(e);
    res.status(400).send('failed to create user');
  }
});

app.post('/signin', async (req, res) => {

  const { email, password } = req.body;
  console.log(email, password);
  const user = await User.findOne({ email, password });
  console.log(user);
  if (user) {
    res.json('logined');
  } else {
    res.json('no such user');
  }
});

app.post('/create-showcase', async (req, res) => {
  const { user, area, originalPhoto, improvedPhoto, name } = req.body;
  const users = await User.find({});
  console.log(users[ 0 ]);
  try {
    const showcase = await Showcase.create({
      user: users[ 0 ].id,
      area,
      originalPhoto,
      improvedPhoto,
      name,
    });
    res.json(showcase);
    console.log(showcase);
  } catch (e) {
    console.log(e);
    res.status(400).json('failed to create showcase');
  }
});

app.post('/upload-photo', upload.single('image'), async (req, res) => {
  const image = req.file.path;
  try {
    const url = await uploadPhoto(image);
    res.send(url);

  } catch (e) {
    res.send('error');
  }
});


const improvePhoto = async (photo) => {
  return await axios.post('http://localhost:5000/improve-photo', photo);
};

const uploadPhoto = async (photo) => {
  const photoUrl = await cloudinary.uploader.upload(photo);
  return photoUrl.url;
};

const startServer = async (port) => {
  try {
    await connectDB(process.env.MONGODB_URL);
    app.listen(port, () => console.log('listening on port ' + port));
  } catch (err) {
    console.error(err);

  }
};

startServer(4000);