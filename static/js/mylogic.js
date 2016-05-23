function my_init() {
  easyrtc.setRoomOccupantListener(loggedInListener);
  var key = prompt("Please enter the API key", "");
  easyrtc.setCredential({
    "apikey": key
  });
  easyrtc.easyApp("Daydream-Interactive-Present", "self", ["caller"],
    function (myId) {
      console.log("My easyrtcid is " + myId);
    }
  );
}


function loggedInListener(roomName, otherPeers) {
  var otherClientDiv = document.getElementById('otherClients');
  while (otherClientDiv.hasChildNodes()) {
    otherClientDiv.removeChild(otherClientDiv.lastChild);
  }
  for (var i in otherPeers) {
    var button = document.createElement('button');
    button.onclick = function (easyrtcid) {
      return function () {
        performCall(easyrtcid);
      }
    }(i);

    label = document.createTextNode(i);
    button.appendChild(label);
    otherClientDiv.appendChild(button);
  }
}

function performCall(easyrtcid) {
  easyrtc.call(
    easyrtcid,
    function (easyrtcid) {
      console.log("completed call to " + easyrtcid);
    },
    function (errorMessage) {
      console.log("err:" + errorMessage);
    },
    function (accepted, bywho) {
      console.log((accepted ? "accepted" : "rejected") + " by " + bywho);
    }
  );
}
