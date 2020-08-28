function speechToText() {
  var message = document.querySelector("#message");

  var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
  var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;

  var grammar = "#JSGF V1.0;";

  var recognition = new SpeechRecognition();
  var speechRecognitionList = new SpeechGrammarList();
  speechRecognitionList.addFromString(grammar, 1);
  recognition.grammars = speechRecognitionList;
  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.onresult = function (event) {
    var current = event.results.length - 1;
    var command = event.results[current][0].transcript;
    //'command' contains the string inputted by the user
    message.textContent = "Voice Input: " + command;

    setTimeout(function () {
      var request = new XMLHttpRequest();
      request.open("POST", "http://localhost:1337/sms");
      request.setRequestHeader("phone", window.localStorage.getItem('phoneNumber'));
      request.setRequestHeader("voice", "voice");
      request.setRequestHeader("command", command);
      request.send();

      request.onreadystatechange = function () {
        if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
          console.log("Request was successful.");
        } else {
          console.log("Request was unsuccessful." + request.responseText);
        }
      };
      console.log(command);
    }, 6000);

  };

  recognition.onspeechend = function () {
    recognition.stop();
  };

  recognition.onerror = function (event) {
    message.textContent = "Error occurred in recognition: " + event.error;
  };

  document.querySelector("#btnCommand").addEventListener("click", function () {
    recognition.start();
  });

}
speechToText();