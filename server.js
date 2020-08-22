const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
var firebase = require('firebase');
const { stringify } = require('querystring');

const firebaseConfig = {
    apiKey: "AIzaSyCvhl7W3jMuxVDHOelESIDZ4aq8kZEUwrw",
    authDomain: "hackthesix-70c79.firebaseapp.com",
    databaseURL: "https://hackthesix-70c79.firebaseio.com",
    projectId: "hackthesix-70c79",
    storageBucket: "hackthesix-70c79.appspot.com",
    messagingSenderId: "852044057982",
    appId: "1:852044057982:web:b1c535a414699297df772f",
    measurementId: "G-VM4Y596EFN"
  };

firebase.initializeApp(firebaseConfig);
var firestore = firebase.firestore();

const app = express();

app.use(bodyParser.urlencoded({extended: false}));

app.post('/sms', async (req, res) => {
  let numberFrom = req.body.From;
  let tempArr = req.body.Body.split(':');
  let commandName = tempArr[0];
  const twiml = new MessagingResponse();
  const db = firestore.collection('members').doc(numberFrom);
  const bankRef = firestore.collection('members').doc(numberFrom);
  const doc = await bankRef.get();
  console.log(doc.data());
  if(commandName == "deposit"){
    let amount = tempArr[1];
    db.update({
        balance: Number(doc.data().balance) + Number(amount)
    });
    twiml.message('Deposited ' + amount + "! New balance is: " + (Number(doc.data().balance) + Number(amount)));
  
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
  }
  else if(commandName == "transfer"){
    let tempArr = req.body.Body.split(" ");
    let amount = tempArr[1];
    let to = tempArr[3];
    db.update({
        balance: Number(doc.data().balance) - Number(amount)
    })
    const dbTo = firestore.collection('members').doc(to);
    const bankRefTo = firestore.collection('members').doc(to);
    const docTo = await bankRefTo.get();
    dbTo.update({
        balance: Number(docTo.data().balance) + Number(amount)
    }) 
    twiml.message('Transferred ' + amount + "to "  + to + "! Your new balance is: " + Number(doc.data().balance) - Number(amount));
  
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());  
  }

});

http.createServer(app).listen(1337, () => {
  console.log('Express server listening on port 1337');
});