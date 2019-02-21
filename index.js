const fs = require('fs');
const path = require('path');
const express = require('express');
const formidable = require('formidable');
const Dropbox = require('dropbox').Dropbox;
const fetch = require('isomorphic-fetch');

const ACCESS_TOKEN = process.env.ACCESS_TOKEN || '2jO3qLvMgjMAAAAAAAAJDjG57p6stdPt6etsyS_tPZU2n67PMDnyICASvoc7OytH';

let dbx = new Dropbox({ accessToken: ACCESS_TOKEN, fetch: fetch });

const app = express();

app.get('/', (req, res) => {
  //res.render('index', { submitUrl: `${req.url}/submitfile` });
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
   /* console.log('Textarea input text:');
    console.log("\"" + userText + "\"");
    console.log('Text length: ' + userText.length);
    console.log(' ====================== '); */

    let userFile = files.file;
   /* console.log('File input:');
    console.log(userFile);
    console.log('- name: ' + userFile.name);
    console.log('- size: ' + userFile.size);
    console.log('- type: ' + userFile.type);
    console.log(' ====================== '); */

    if (userFile.size == 0 && userText.length == 0) {
      console.log('No input');
      return res.end('Please provide your resume via file or text input.');
    }

    let date = new Date();

    dbx.filesUpload({
      contents: userFile.size > 0 ? fs.createReadStream(userFile.path) : userText,
      path: userFile.size > 0 ? `/${userFile.name}` : `/typed-submit-${date.getTime()}.txt`,
    }).then(data => {
      console.log('File uploaded successfully');
      console.log(data);
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