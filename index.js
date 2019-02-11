const fs = require('fs');
const path = require('path');
const express = require('express');
const formidable = require('formidable');

const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

const MIN_TEXT_LEN = 20; // Minimum length for form's input text (textarea value)

// Load client secrets from a local file.
let credentials = JSON.parse(fs.readFileSync('credentials.json'));

//authorize(credentials, listFiles);

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
  const drive = google.drive({version: 'v3', auth});

  drive.about.get({fields: 'user'}, (err, res) => {
      console.log(res.data);
  });

  drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log('No files found.');
    }
  });
}


const app = express();


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname+'/index.html'));
});

app.post('/submitfile', (req, res) => {
    let form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {
        if (err) {
            console.error('Error submitting file', err);
            res.end('Error submitting file');
        }

        let userText = fields.text;
        console.log('Textarea input text:');
        console.log('Text length: ' + userText.length);
        console.log("\"" + userText + "\"");
        let userFile = files.file;
        console.log('File input:');
        console.log('File size: ' + userFile.size);
        console.log('File name: ' + userFile.name);
        console.log('File type: ' + userFile.type);

        if (userFile.size == 0 && userText.length < MIN_TEXT_LEN) {
          console.log('No input');
          return res.end('Please provide your resume via file or text input.');
        }
          
        authorize(credentials, function(auth) {
          const drive = google.drive({version: 'v3', auth});

          drive.files.list({
            q: "name='gdapitest' and mimeType='application/vnd.google-apps.folder'",
            fields: 'files(id, name)',
          }, (err, res) => {
            if (err) {
              return console.log('The API returned an error: ' + err);
            }
            const files = res.data.files;
            if (files.length) {
              console.log('File:');
              console.log(`${files[0].name} (${files[0].id})`);
              // TODO: upload file into folder with file.id
            } else {
              console.log('No files found.');
              // TODO create folder and upload file into it
            }
          });

              let folderId = '1QpBtdRE0Hts5ZN4MLm709qZT42kQ0zjg';
              var fileMetadata = {
                  'name': userFile.name,
                  parents: [folderId]
              };
              var media = {
                  mimeType: userFile.type,
                  body: fs.createReadStream(userFile.path)
              };
              drive.files.create({
                  resource: fileMetadata,
                  media: media,
                  fields: 'id'
              }, function (err, file) {

                  if (err) {
                    // Handle error
                    console.error(err);
                    res.end('Couldn\'t create google drive file');
                  }
                  else {
                    console.log('File Created');
                    console.log(file.data.id);
                    res.end('File sent.')
                  }
              });
          });
        

        // response to browser
        //res.send('file sent')
    });
});

let port = 3030;
app.listen(port);
console.log('listening at port ' + port);