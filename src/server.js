const express = require('express');
const componentrouter = require('./routes/componentroutes');

const cors = require('cors');
const multer = require('multer');
require('dotenv').config();


const app = express();

app.use(cors());
app.use(multer().single('image'));
app.use(express.json());

app.use('/api', componentrouter);

app.get('/ping', (req, res) => {
  res.status(200).json({ message: 'Server is running'});
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '::',() => {
  console.log(`Server running on port [::]${PORT}`);
});