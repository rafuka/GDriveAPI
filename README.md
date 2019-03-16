# Google Drive and Dropbox API demo

## Functionality

Upload a file to Dropbox or Google Drive.

If both a file and text input are provided, only the file will be uploaded.

## Usage instructions

### First steps

1. Clone repo
2. Run `npm install` 

### Dropbox Setup
1. Navigate to [Dropbox's Developers page](https://www.dropbox.com/developers).
2. Under the side menu, navigate to 'My Apps'.
3. Create a new app and generate the access token.
4. Copy the file named `.env.example` in this project repo and create a new one named `.env`.
5. Add your newly generated access token as the value for the `ACCESS_TOKEN` key in the `.env` file. **DO NOT PLACE THE `.env` FILE IN A PUBLICLY ACCESSIBLE REPOSITORY**
6. Run `npm run start-db`
7. Navigate to http://localhost:5050 and enter some text or a file to be uploaded.

### Google Drive Setup
1. Follow [these instructions](https://www.iperiusbackup.net/en/how-to-enable-google-drive-api-and-get-client-credentials/) to download your credentials as a json file. Make sure when you are creating the OAuth Client ID that you select the option "Other" under the "Application Type" options. Place the file in this project's folder and name it `credentials.json`. **DO NOT PLACE THE `credentials.json` FILE IN A PUBLICLY ACCESSIBLE REPOSITORY**
2. Run `npm run start-gd`
3. Follow the instructions on the console to authorize.
4. Navigate to http://localhost:3030 and enter some text or a file to be uploaded.
