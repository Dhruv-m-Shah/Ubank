function getInfo() {
    var request = new XMLHttpRequest();
    request.open('POST', 'http://localhost:1337/getInfo')
    request.setRequestHeader("number", window.localStorage.getItem('phoneNumber')) // Change this to local storage.
    request.send();
    request.onreadystatechange = function () {
        if (request.readyState == 4 && request.status == 200) {
            fillFields(JSON.parse(request.responseText));
        } else {
            console.log(request.responseText)
        }
    }
}

getInfo();

function fillFields(data){
    document.getElementById("accountBalance").innerHTML = "$ " + data.chequing;
    document.getElementById("savingBalance").innerHTML = "$ " + data.saving;
    transactionArr = data.transactionHistory.reverse();
    document.getElementById("contactName1").innerHTML = transactionArr[0];
    document.getElementById("contactName2").innerHTML = transactionArr[1];
    document.getElementById("contactName3").innerHTML = transactionArr[2];
    document.getElementById("accountBalance2").innerHTML = "$ " + data.balance;
    document.getElementById("customerNameNav").innerHTML = data.name;
    document.getElementById("customerName").innerHTML =  data.name;
    document.getElementById("customerData").innerHTML = data.name + " • " + data.email + " • " + data.location;
    document.getElementById("navLogo").src = data.profileImage;
    document.getElementById("transferImg").src = data.profileImage;  
    document.getElementById("transferImg1").src = data.profileImage;  
    document.getElementById("transferImg2").src = data.profileImage; 
}

