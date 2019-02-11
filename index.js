const fs = require('fs');
const path = require('path');
const express = require('express');
const formidable = require('formidable');

const readline = require('readline');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
let credentials = JSON.parse(fs.readFileSync('credentials.json'));

authorize(credentials, getUser);

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
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
 * Prints authorized user's info on the console
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function getUser(auth) {
  const drive = google.drive({ version: 'v3', auth });

  drive.about.get({ fields: 'user' }, (err, res) => {
    console.log(res.data);
    console.log('===============')
  });
}


const app = express();


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.post('/submitfile', (req, res) => {
  const form = new formidable.IncomingForm();
  const gdFolderName = 'gdapidemo';

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error('Error submitting file', err);
      return res.end('Error submitting file');
    }

    let userText = fields.text;
    console.log('Textarea input text:');
    console.log("\"" + userText + "\"");
    console.log('Text length: ' + userText.length);
    console.log(' ====================== ');

    let userFile = files.file;
    console.log('File input:');
    console.log('- name: ' + userFile.name);
    console.log('- size: ' + userFile.size);
    console.log('- type: ' + userFile.type);
    console.log(' ====================== ');

    if (userFile.size == 0 && userText.length == 0) {
      console.log('No input');
      return res.end('Please provide your resume via file or text input.');
    }

    authorize(credentials, function (auth) {
      const drive = google.drive({ version: 'v3', auth });
      let folderId;

      drive.files.list({
        q: `name='${gdFolderName}' and mimeType='application/vnd.google-apps.folder'`,
        fields: 'files(id, name)',
      }, (err, result) => {
        if (err) {
          return console.error('The API returned an error: ', err);
        }

        const files = result.data.files;

        if (files.length) { // Create file into existing folder
          console.log(`Creating file in folder ${files[0].name}, id: ${files[0].id}`);
          
          folderId = files[0].id;

          // Create user-uploaded file
          if (userFile.size > 0) {
            var fileMetadata = {
              name: userFile.name,
              parents: [folderId]
            };
            var media = {
              mimeType: userFile.type,
              body: fs.createReadStream(userFile.path)
            };
          }
          else {
            let date = new Date();

            var fileMetadata = {
              name: 'text-input-' + date.getTime(),
              parents: [folderId]
            };
            var media = {
              mimeType: 'text/plain',
              body: userText
            };
          }
          drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, name'
          }, (err, file) => {
            if (err) {
              // Handle error
              console.error('Couldn\'t create google drive file', err);
              return res.end('Couldn\'t create google drive file');
            }
            else {
              console.log('File Created');
              console.log('- name: ', file.data.name);
              console.log('- id: ', file.data.id);
              return res.end('File sent.')
            }
          });

          
        }
        else { // Create folder and then create files in folder
          
          console.log(`Folder ${gdFolderName} not found, the folder will be created.`);

          let fileMetadata = {
            name: gdFolderName,
            mimeType: 'application/vnd.google-apps.folder'
          };
          drive.files.create({
            resource: fileMetadata,
            fields: 'id'
          }, (err, folder) => {
            if (err) {
              console.error(`Couldn\'t create ${gdFolderName} folder.`, err);
              return res.end('Couldn\'t upload files to google drive.');
            }
            else {
              let folderId = folder.data.id;
              console.log(`Folder ${gdFolderName} created, creating files...`);

              // Create user-uploaded file
              if (userFile.size > 0) {
                var fileMetadata = {
                  name: userFile.name,
                  parents: [folderId]
                };
                var media = {
                  mimeType: userFile.type,
                  body: fs.createReadStream(userFile.path)
                };
              }
              else {
                let date = new Date();
                var fileMetadata = {
                  name: 'text-input' + date.getTime(),
                  parents: [folderId]
                };
                var media = {
                  mimeType: 'text/plain',
                  body: userText
                };
              }

              drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id, name'
              }, (err, file) => {
                if (err) {
                  // Handle error
                  console.error('Couldn\'t create google drive file', err);
                  return res.end('Couldn\'t create google drive file');
                }
                else {
                  console.log('File Created');
                  console.log('- name: ', file.data.name);
                  console.log('- id: ', file.data.id);
                  return res.end('File sent.');
                }
              }); 
            }
          });
        }
      }); 
    });
  });
});

let port = 3030;
app.listen(port);
console.log('listening at port ' + port);