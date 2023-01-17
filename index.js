var express = require('express');
var cors = require('cors');
var mongoose = require('mongoose');
var multer = require('multer');
var fs = require('fs');
var path = require('path');
const { format } = require('path');
require('dotenv').config();
var app = express();

//build schema and model
const fileSchema = new mongoose.Schema({
  data: Buffer,
  name: String,
  type: String,
  size: Number,
});
const File = mongoose.model('File', fileSchema);

//connect to mongoDB
mongoose.set({ strictQuery: false });
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log('connect to mongoDB SUCCESS');
  })
  .catch((err) => {
    console.log('connect to mongoDB FAIL');
    console.log(err);
  });

//set multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function (req, file, cb) {
    cb(null, 'uploadFile_' + Date.now());
  },
});
const upload = multer({ storage: storage });

//middleware
app.use(cors());
app.use('/public', express.static(process.cwd() + '/public'));

//get index
app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//post a file to mongoDB
app.post('/api/fileanalyse', upload.single('upfile'), async (req, res) => {
  try {
    const newFile = await File.create({
      data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
    });
    return res.json({
      _id: newFile._id,
      name: newFile.name,
      type: newFile.type,
      size: newFile.size,
    });
  } catch (err) {
    console.log(err);
  }
});

//get the uploaded File
app.get('/api/fileanalyse/:_id', async (req, res) => {
  try {
    const FoundFile = await File.findById(req.params);
    if (!FoundFile) return res.send('Not Found File,Please check file _id');
    if (FoundFile.data.toString('base64')) {
      res.contentType(FoundFile.type);
      return res.send(Buffer.from(FoundFile.data, 'binary'));
    }
  } catch (err) {
    console.log(err);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log(`http://localhost:${port}`);
});
