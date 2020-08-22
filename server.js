const http = require('http');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const MessagingResponse = require('twilio').twiml.MessagingResponse;
var firebase = require('firebase');
const request = require('request');
var yahooStockPrices = require('yahoo-stock-prices');
const {
  stringify
} = require('querystring');
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  databaseURL: process.env.DATABASE_URL,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID,
  measurementId: process.env.MEASUREMENT_ID
};

firebase.initializeApp(firebaseConfig);
var firestore = firebase.firestore();

const app = express();

app.use(bodyParser.urlencoded());

async function addTransactionHistory(msg, numberFrom, numberTo) {
  const db = firestore.collection('members').doc(numberFrom);
  const bankRef = firestore.collection('members').doc(numberFrom);
  const doc = await bankRef.get();
  await db.update({
    transactionHistory: firebase.firestore.FieldValue.arrayUnion(msg)
  });
  if(numberTo != null){
    const db2 = firestore.collection('members').doc(numberTo);
    const bankRef2 = firestore.collection('members').doc(numberTo);
    const doc2 = await bankRef2.get();
  await db2.update({
    transactionHistory: firebase.firestore.FieldValue.arrayUnion(numberFrom + ' deposited money!' + ' Your new balance is ' + doc2.data().balance)
  });
  }
}

async function addChequingHistory(chequing, saving, numberFrom){
  const db = firestore.collection('members').doc(numberFrom);
  const bankRef = firestore.collection('members').doc(numberFrom);
  const doc = await bankRef.get();
  await db.update({
    chequingHistory: firebase.firestore.FieldValue.arrayUnion(chequing),
    savingHistory: firebase.firestore.FieldValue.arrayUnion(saving)
  })
}

app.post('/sms', async (req, res) => {
  let numberFrom = req.body.From;
  const db = firestore.collection('members').doc(numberFrom);
  const bankRef = firestore.collection('members').doc(numberFrom);
  const doc = await bankRef.get();
  const twiml = new MessagingResponse();
  if(req.body.NumMedia !== '0') {
    const filename = `${req.body.MessageSid}.png`;
    const url = req.body.MediaUrl0;
    await db.update({
      images: firebase.firestore.FieldValue.arrayUnion({[filename]: url})
    });
    twiml.message('Thanks for the image!');
    return;
  }
  if (req.body.Body == "check balance") {
    twiml.message("Your current balance is: " + doc.data().balance);
    res.writeHead(200, {
      'Content-Type': 'text/xml'
    });
    res.end(twiml.toString());
    return;
  }

  let tempArr = req.body.Body.split(' ');
  let commandName = tempArr[0];
  console.log(doc.data());
  if (commandName == "stock") {
    let stock = tempArr[1];
    yahooStockPrices.getCurrentPrice(stock, function (err, price) {
      twiml.message('Current ' + stock + ' price: ' + price);
      res.writeHead(200, {
        'Content-Type': 'text/xml'
      });
      res.end(twiml.toString());
    });
  } else if (tempArr[3] == "chequing") {
    amount = tempArr[1];
    await db.update({
      chequing: Number(doc.data().chequing) - Number(amount)
    })
    await db.update({
      saving: Number(doc.data().saving) + Number(amount)
    })
    addChequingHistory(doc.data().chequing, doc.data().saving, numberFrom);
    addTransactionHistory('Chequing account balance is: ' + (Number(doc.data().chequing) - Number(amount)) + ' and saving account balance is: ' + (Number(doc.data().saving) + Number(amount)), numberFrom, null);
    twiml.message('Chequing account balance is: ' + (Number(doc.data().chequing) - Number(amount)) + ' and saving account balance is: ' + (Number(doc.data().saving) + Number(amount)));
    res.writeHead(200, {
      'Content-Type': 'text/xml'
    });
    res.end(twiml.toString());
  } else if (tempArr[3] == "saving") {
    amount = tempArr[1];
    await db.update({
      chequing: Number(doc.data().chequing) + Number(amount)
    })
    await db.update({
      saving: Number(doc.data().saving) - Number(amount)
    })
    addChequingHistory(doc.data().chequing, doc.data().saving, numberFrom);
    addTransactionHistory('Chequing account balance is: ' + (Number(doc.data().chequing) + Number(amount)) + ' and saving account balance is: ' + (Number(doc.data().saving) - Number(amount)), numberFrom, null)
    twiml.message('Chequing account balance is: ' + (Number(doc.data().chequing) + Number(amount)) + ' and saving account balance is: ' + (Number(doc.data().saving) - Number(amount)));
    res.writeHead(200, {
      'Content-Type': 'text/xml'
    });
    res.end(twiml.toString());
  } else if (commandName == "transfer") {
    let tempArr = req.body.Body.split(" ");
    let amount = tempArr[1];
    let to = tempArr[3];
    await db.update({
      balance: Number(doc.data().balance) - Number(amount)
    })
    const dbTo = firestore.collection('members').doc(to);
    const bankRefTo = firestore.collection('members').doc(to);
    const docTo = await bankRefTo.get();
    await dbTo.update({
      balance: Number(docTo.data().balance) + Number(amount)
    })
    addTransactionHistory('Transferred ' + amount + " to " + to + "! Your new balance is: " + (Number(doc.data().balance) - Number(amount)), numberFrom, to);
    twiml.message('Transferred ' + amount + " to " + to + "! Your new balance is: " + (Number(doc.data().balance) - Number(amount)));

    res.writeHead(200, {
      'Content-Type': 'text/xml'
    });
    res.end(twiml.toString());
  } else if (commandName == "conversion") {

  }

});

http.createServer(app).listen(1337, () => {
  console.log('Express server listening on port 1337');
});


// [START speech_quickstart]
function SpeechConverter() {
  // <code>
  "use strict";
  
  // pull in the required packages.
  var sdk = require("microsoft-cognitiveservices-speech-sdk");
  var fs = require("fs");
  
  // replace with your own subscription key,
  // service region (e.g., "westus"), and
  // the name of the file you want to run
  // through the speech recognizer.
  var subscriptionKey = "process.env.SUBSCRIPTION_KEY";
  var serviceRegion = "eastus"; // e.g., "westus"
  var filename = "./Record (online-voice-recorder.com) (1).wav"; // 16000 Hz, Mono
  
  // create the push stream we need for the speech sdk.
  var pushStream = sdk.AudioInputStream.createPushStream();
  
  // open the file and push it to the push stream.
  fs.createReadStream(filename).on('data', function(arrayBuffer) {
    pushStream.write(arrayBuffer.slice());
  }).on('end', function() {
    pushStream.close();
  });
  
  // we are done with the setup
  console.log("Now recognizing from: " + filename);
  
  // now create the audio-config pointing to our stream and
  // the speech config specifying the language.
  var audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
  var speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
  
  // setting the recognition language to English.
  speechConfig.speechRecognitionLanguage = "en-US";
  
  // create the speech recognizer.
  var recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
  
  // start the recognizer and wait for a result.
  recognizer.recognizeOnceAsync(
    function (result) {
      console.log(result);
  
      recognizer.close();
      recognizer = undefined;
    },
    function (err) {
      console.trace("err - " + err);
  
      recognizer.close();
      recognizer = undefined;
    });
  // </code>
  
};

//speechConverter();
