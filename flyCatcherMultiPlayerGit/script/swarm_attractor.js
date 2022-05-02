
// setup varibles for PubNub
let dataServer;
let pubKey = "pub-c-a89113e6-3093-4b43-8f4a-e1dce36bb107";
let subKey = "sub-c-7f74413c-3b65-11ec-8182-fea14ba1eb2b";
let channelName = "fireflySocial";
const newUUID = "host";

let totalflies = 5;
const localPlayer = {
  name: '',
  score: 0,
  uuid: '',
  type: ''
};

let scoreTable;
let gameoverFlash;

//-----------------------------------------------------------
let playersAvatar = [];
let flyAvatars = [];
let flyimg;
//--------------------------------------------------------------

function preload() {
  //score table to store player scores
  scoreTable = loadTable('script/score.csv', 'csv', 'header');
  //game over flashscreen
  gameoverFlash = loadImage('/assets/gameover_screen.png');
  flyimg = loadImage('/assets/img/flyingBee-1.gif');
}


function setup() {

  createCanvas(windowWidth, windowHeight);
  //console.log(scoreTable.getRowCount() + ' total rows in table');

  //generate flyies from Particle class and push to flyAvatars array
  for (i = 1; i <= totalflies; i++) {
    flyAvatars.push(new Particle(random(width), random(height)));
  }


  // establish communication with PubNub
  dataServer = new PubNub({
    publish_key: pubKey,
    subscribe_key: subKey,
    ssl: true,
    uuid: newUUID
  });

  // subscribe to the channel and listen to callbacks
  dataServer.subscribe({ channels: [channelName], withPresence: true, withUUID: true });
  dataServer.addListener({ message: readIncoming });
  dataServer.addListener({ presence: readPresence });

}//end of setup

//Check the presence of a players - PubNub
function readPresence(response) {
  var action = response.action;
  var occupancy = response.occupancy;
  var uuid = response.uuid;

  //extract the player name from the uuid
  var uuidName = uuid.split("-")[0];


  if (action == "join") {
    console.log(uuidName + " has joined the game");


    if (uuidName == 'host' && scoreTable.getRowCount() == 0) {
      console.log("host joined, waiting for players");
    }


    else if (uuidName !== "host" && occupancy > 0) {

      // Add new player data to the the table
      let newRow = scoreTable.addRow();
      newRow.setString("uuid", uuid);
      newRow.setString("name", uuidName);
      newRow.setString("score", 0);

      //call createplayer function to create player avatar, take in player count and uuid
      createplayer(scoreTable.getRowCount(), uuid);
      
    }
  }//end of if action join


  //check if player left
  if (action == "leave") {
    console.log(uuidName + " has left the game");
   

    // Remove player from the table
    if (scoreTable.findRow(uuidName, 'name') !== null) {
      scoreTable.removeRow(scoreTable.findRow(uuidName, 'name'));
      //console.log("removed " + uuid + " from the table");

    }

  }//end of if action leave

}//end of readPresence



//Check the incoming messages from each phone - PubNub
function readIncoming(inMessage) {

  localPlayer.uuid = inMessage.message.uuidM;
  localPlayer.name = inMessage.message.playerName;
  localPlayer.score = inMessage.message.score;


  // update score table with new score, if any
  let updateScore = scoreTable.findRow(localPlayer.uuid, 'uuid');

  if (updateScore !== null) {
    updateScore.setString('score', localPlayer.score);
  }

  //console.log("New Score of " + localPlayer.name + " : " + localPlayer.score);

}//end of readIncoming



// function to create player avatar
function createplayer(playercount, uuid) {

//if there this is the first player, create the host avatar in the center of the screen
  if (playercount < 2) {
    playersAvatar.push(createVector(width / 2, height / 2));
  } 

  // if it is not the first player, create the player avatar in a random location
  else
  {
    playersAvatar.push(createVector(random(100, width - 100), random(100, height - 100)));
  }


}// end of createplayer


//P5 draw function
function draw() {
  background(51);
  strokeWeight(4);


  let totalPlayerScore = 0;
  //let playerUUID = scoreTable.getColumn('uuid');

  // store Player Names and Scores in an array from the table
  let playerName = scoreTable.getColumn('name');
  let playerScore = scoreTable.getColumn('score');

  // loop through the player table and render player avatars and scores
  for (let i = 0; i < scoreTable.getRowCount(); i++) {
    
    push();
    stroke(255, 204, 0);
    fill(0,0,0);
    textSize(18);
    text(playerName[i], playersAvatar[i].x, playersAvatar[i].y);
    stroke(12, 220, 54);
    textSize(14);
    text(playerScore[i], playersAvatar[i].x, playersAvatar[i].y + 10);
    pop();

    //calculate total score of all players to remove flies 
    totalPlayerScore = totalPlayerScore + parseInt(playerScore[i]);


  }

  //total remaining flies on screen
  var totalRemaningflies = flyAvatars.length - totalPlayerScore;

  //generate fly avatars of total flies on screen and attract them to the player
  // 
  for (let i = 0; i < totalRemaningflies; i++) {
    var particle = flyAvatars[i];
    // attract the fly to the player avatar
    for (let j = 0; j < scoreTable.getRowCount(); j++) {
      particle.attracted(playersAvatar[j]);
    }
    //display the fly - (code in Particle class)
    particle.update();
    particle.show();
  }



// if all flies are gone

  if (totalRemaningflies == 0) {

    //console.log(scoreTable.getColumn('name'));

    // take score column and store in an array
    let scorecol = scoreTable.getColumn('score');

    let maxScore = scorecol[0];
    let maxIndex;
    let maxPlayer;

    // find the player with the highest score
    for (i = 1; i < scorecol.length; i++) {
      if (scorecol[i] > maxScore)
        maxScore = scorecol[i];

      // find the array index of highest score value
      maxIndex = scorecol.indexOf(maxScore);

    }

    //take name column and store in an array
    let scoreRow = scoreTable.getColumn('name');

    // if there is only one player it is the local player
    if (scoreTable.getRowCount() < 2) {
      maxPlayer = localPlayer.name;
    }
    // if there are more than one player,
    // find them from the name column using the same index value as of the highest score
    else 
    {
      maxPlayer = scoreRow[maxIndex];
    }

  // display a game over flash screen
    image(gameoverFlash, 0, 0, windowWidth, windowHeight);

// publish the winner name and score to the channel
    dataServer.publish({
      channel: channelName,
      message: {
        messageType: "gameover",
        winnerName: maxPlayer,
        winnerScore: maxScore,
        uuid: 'host'

      }
    });
    // unsubscribe from the channel
    dataServer.unsubscribe({ channels: [channelName] });

    // redirect the screen to the gameover page
    window.location.href = "gameover.html?winnerName=" + maxPlayer + "&winnerScore=" + maxScore;

  }
  strokeWeight(0);
  fill(0,255,0);
  text('Total Remaining Flies ' + totalRemaningflies, 20, 30);
  


}
