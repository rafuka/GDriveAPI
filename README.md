# Google Drive API demo

## Functionality

Upload a file or some text from the HTML form to google drive.

If both a file and text input are provided, only the file will be uploaded.

The app will upload files into a folder called `gdapidemo`. If the folder doesn't exist, it will be created.

## Usage instructions

Get your google account's credentials at https://console.cloud.google.com/apis/credentials (You might have to create a new project). Download your credentials (it should be a file named `credentials.json`)

1. Clone repo
2. Copy the `credentials.json` file into the GDriveAPI directory you just cloned.
2. Run `npm install` 
3. Run `npm run start`
4. The first time the app is started, it will output on the console an URL that you must follow, and then copy the code provided.
5. Input the code copied into the console.
6. Navigate to http://localhost:3030
7. Select a file or write some text and submit the form.