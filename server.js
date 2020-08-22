const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const MessagingResponse = require('twilio').twiml.MessagingResponse;
var firebase = require('firebase');
var yahooStockPrices = require('yahoo-stock-prices');
const { stringify } = require('querystring');
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

app.use(bodyParser.urlencoded({extended: false}));

app.post('/sms', async (req, res) => {
  let numberFrom = req.body.From;
  const db = firestore.collection('members').doc(numberFrom);
  const bankRef = firestore.collection('members').doc(numberFrom);
  const doc = await bankRef.get();
  const twiml = new MessagingResponse();
  if(req.body.Body == "check balance"){
    twiml.message("Your current balance is: " + doc.data().balance);
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString()); 
    return;
  }
  
  let tempArr = req.body.Body.split(' ');
  let commandName = tempArr[0];
  console.log(doc.data());
  if(commandName == "stock"){
    let stock = tempArr[1]; 
    yahooStockPrices.getCurrentPrice(stock, function(err, price){
      twiml.message('Current ' + stock + ' price: ' + price);
      res.writeHead(200, {'Content-Type': 'text/xml'});
      res.end(twiml.toString());
    }); 
  }
  else if(tempArr[3] == "chequing"){
    amount = tempArr[1];
    db.update({
        chequing: Number(doc.data().chequing) - Number(amount)
    })
    db.update({
      saving: Number(doc.data().saving) + Number(amount)
    })
    twiml.message('Chequing account balance is: ' +(Number(doc.data().chequing) - Number(amount)) + ' and saving account balance is: ' + (Number(doc.data().saving) + Number(amount)));
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
  }
  else if(tempArr[3] == "saving"){
    amount = tempArr[1];
    db.update({
        chequing: Number(doc.data().chequing) + Number(amount)
    })
    db.update({
      saving: Number(doc.data().saving) - Number(amount)
    })
    twiml.message('Chequing account balance is: ' +(Number(doc.data().chequing) + Number(amount)) + ' and saving account balance is: ' + (Number(doc.data().saving) - Number(amount)));
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
    twiml.message('Transferred ' + amount + " to "  + to + "! Your new balance is: " + (Number(doc.data().balance) - Number(amount)));
  
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());  
  }

  else if(commandName == "conversion"){
    
  }

});

http.createServer(app).listen(1337, () => {
  console.log('Express server listening on port 1337');
});
