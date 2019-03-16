const fs = require('fs');
const path = require('path');
const express = require('express');
const formidable = require('formidable');
const Dropbox = require('dropbox').Dropbox;
const fetch = require('isomorphic-fetch');
const dotenv = require('dotenv').config();

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

let dbx = new Dropbox({ accessToken: ACCESS_TOKEN, fetch: fetch });

const app = express();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.post('/submitfile', (req, res) => {
  const form = new formidable.IncomingForm();

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error('Error submitting file', err);
      return res.end('Error submitting file');
    }

    let userText = fields.text;
    let userFile = files.file;

    if (userFile.size == 0 && userText.length == 0) {
      console.log('No input');
      return res.end('Please provide your resume via file or text input.');
    }

    // TODO: check file size, type, etc.. before submitting

    let date = new Date();

    dbx.filesUpload({
      contents: userFile.size > 0 ? fs.createReadStream(userFile.path) : userText,
      path: userFile.size > 0 ? `/${userFile.name}` : `/typed-submit-${date.getTime()}.txt`,
    }).then(data => {
      console.log('File uploaded successfully');
      res.end('File uploaded successfully');
    }).catch(err => {
      console.error(err)
      res.end('There was an error uploading the file.');
    });
  });
});

let port = process.env.PORT || 5050;
app.listen(port);
console.log('listening at port ' + port);