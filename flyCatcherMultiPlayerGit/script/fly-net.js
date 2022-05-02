// Anas Raza
// Multiplayer flycatcher game



// grab player name from url
const urlQuery = window.location.search;
const urlParams = new URLSearchParams(urlQuery);
const playername = urlParams.get('playername')

// setup varibles for PubNub
let dataServer;
let pubKey = "pub-c-a89113e6-3093-4b43-8f4a-e1dce36bb107";
let subKey = "sub-c-7f74413c-3b65-11ec-8182-fea14ba1eb2b";
let channelName = "fireflySocial";
let occupancy = 0;

// player universal ID concatinate with player name
const newUUID = playername + "-" + PubNub.generateUUID();

// local player object with properties 
const player = {
    name: playername,
    score: 0,
    uuid: 'newUUID'
};

// object to receive data from pubnub server
const msg = {
    uuid: '',
    name: '',
    score: 0,
    messageType: ''
};




// fly object
let fly = {
    img: "",
    x: 0,
    y: 0,
    w: 80,
    h: 80*1.34,
    speed: 5,
    buzz: '',
    buzzVolume: '',
    catchAnimation: '',
    catchSound: ''
}
var xoff1 = 0;
var xoff2 = 100;


//Fly net image width to maintain the aspect ratio
let flynetImageWidth = 250;

//fly net object
var flyNet = {
    img: 0,
    x: 0,
    y: 0,
    w: flynetImageWidth,
    h: flynetImageWidth * 1.81,
    angle: 0,
};


let gameoverFlash;


// radius of fly net circular motion
let r = flyNet.h;

// other varibles to caccualte polar to cartesian conversion
let x1, x2, y1, y2, d1, d2, d3, dsum = 0;

// preload assets for the game
function preload() {
    fly.img = loadImage('/assets/img/flyingBee-1.gif');
    flyNet.img = loadImage('/assets/vectorNet.png');
    fly.buzz = loadSound('/assets/beebuzz.mp3');
    fly.catchSound = loadSound('/assets/tada.mp3');
    fly.catchAnimation = loadImage('/assets/flyban.png');
    gameoverFlash = loadImage('/assets/gameover_phone.png');
}//end of preload



// P5 setup function
function setup() {
    createCanvas(windowWidth, windowHeight);
    angleMode(DEGREES);

    // establish communication with PubNub
    dataServer = new PubNub({
        publish_key: pubKey,
        subscribe_key: subKey,
        ssl: true,
        uuid: newUUID
    });


    // subscribe to the channel and listen to callbacks     
    dataServer.subscribe({ channels: [channelName] });
    dataServer.addListener({ message: readIncoming });

}//end of setup


//Check the incoming messages
function readIncoming(inMessage) {

    msg.uuid = inMessage.message.uuid;
    msg.name = inMessage.message.winnerName;
    msg.score = inMessage.message.winnerScore;
    msg.messageType = inMessage.message.messageType;

    // redirection to the game over page
    if (msg.uuid == "host" && msg.messageType == "gameover") {
        window.location.href =  "gameover.html?winnerName=" + msg.name + "&winnerScore=" + msg.score;
    }


}//end of readIncoming







//P5 draw function
function draw() {
    background("black");
    fill(255);

    // move fly on screen with random motion
    fly.x = map(noise(xoff1), 0, 1, 0, width + 100);
    fly.y = map(noise(xoff2), 0, 1, 0, height - 300);
    xoff1 += 0.05;
    xoff2 += 0.05;



    //fly direction 
    fly.speed = fly.speed + 1;

    // if fly is off screen, reset it to the left of the screen
    if (fly.speed > width + 100) {
        fly.speed = random(-200, -500);
    }

    image(fly.img, fly.x + fly.speed, fly.y, fly.w, fly.h);

    //roate fly net image to 88 degree and add mobile phone rotation
    flyNet.angle = 88 + rotationY;





    push();
    //push flynet image to right bottom of the screen 
    translate(windowWidth - flyNet.w, windowHeight);

    //rotate fly net image with mobile phone rotation
    rotate(rotationY);

    //offset fly net image with mobile phone X acceleration
    var flynetOffset = map(accelerationX, 0, 5, 0, 30)
    image(flyNet.img, 0, (-flynetOffset - flyNet.h), flyNet.w, flyNet.h);

    pop();



    // convert polar to cartesian coordinates
    // this is very important to maintain the fly net circular motion
    // it was very tricky to find the correct formula to convert polar to cartesian coordinates
    // the formula is based on the fact that the fly net image is a circle
    // the fly net image is a circle with radius r, which is the height of the fly net image

    push();

    x1 = r * cos(flyNet.angle) + windowWidth - flyNet.w;
    y1 = r * sin(flyNet.angle) + windowHeight;

    x2 = windowWidth - flyNet.w - r * cos(flyNet.angle) + 20;
    y2 = windowHeight - r * sin(flyNet.angle) + 20 - flynetOffset;


    x3 = x2 + flyNet.h * 0.34 * cos(flyNet.angle);
    y3 = y2 + flyNet.h * 0.34 * sin(flyNet.angle);


    // stroke(255);
    // strokeWeight(5);
    // line(x2, y2, x3, y3);

    pop();

    //find the distance between the fly and the fly net
    d1 = dist(fly.x + fly.speed, fly.y, x2, y2);
    d2 = dist(fly.x + fly.speed, fly.y, x3, y3);
    d3 = int(dist(x2, y2, x3, y3)) + 50;
    dsum = int(d1 + d2);



    // if the distance between the fly and the fly net is less than the radius of the flynet head
    // then trigger function caught() ,play buzz sound and stop P5 loop for a while

    if (dsum < 205) {

        caught();
        noLoop();
        setTimeout(loop, 1000);

    }



    // buzz sound volume is based on the distance between the fly and screen width

    let beeXloc = fly.x + fly.speed;
    fly.buzzVolume = map(beeXloc, 0, windowWidth / 2, 0, 1);
    fly.buzz.setVolume(fly.buzzVolume);

    if (!fly.buzz.isPlaying() && beeXloc >= -50 && beeXloc <= windowWidth + 50) {
        fly.buzz.play();
    }

    // fly is off screen, stop buzz sound
    if (beeXloc < -50 || beeXloc > windowWidth) {
        fly.buzz.stop();
    }


    fill(255, 255, 255);
    textSize(12);
    text('Player Score : ' + player.score, 10, windowHeight - 20);
    text('Player nAME : ' + player.name, 10, windowHeight - 40);
    
    //---------------------------------------------------------
    // ------------ some information for debugging ------------


    // text('H ' + windowHeight, 10, 20);
    // text('W ' + windowWidth, 10, 40);    
    // text('X : ' + x1, 10, windowHeight - 40);
    // text('Y : ' + y1, 10, windowHeight - 60);
    // text('Rotation Y : ' + flyNet.angle, 10, windowHeight - 80);
    // text('D1 : ' + d1, 10, windowHeight - 100);
    // text('D2 : ' + d2, 10, windowHeight - 120);
    // text('D3 : ' + d3, 10, windowHeight - 140);
    // text('D sum : ' + dsum, 10, windowHeight - 160);
    // text('fly.speed : ' + fly.speed, 10, windowHeight - 180);
    // text('B X loc : ' + beeXloc, 10, windowHeight - 200);
    // text('Vol5: ' + fly.buzzVolume, 10, windowHeight - 220);
    // text('Player name: ' + playername, 10, windowHeight - 240);
    // text('occupancy: ' + occupancy, 10, windowHeight - 260);




}//end of draw




// catch the fly
function caught() {

    // increase the player score by 1
    player.score = player.score + 1;

    // display success screen and play sound
    image(fly.catchAnimation, 0, 0, windowWidth, windowHeight);
    //fly.catchSound.play();

    //viberate the mobile phone when caught
    navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
    if (navigator.vibrate) {
        navigator.vibrate(100);
    }

    //offset fly from the screen
    fly.speed = -500;

    //update player score and publish to the  PubNub server
    dataServer.publish({
        channel: channelName,
        uuid: newUUID,
        message: {
            playerName: playername,
            score: player.score,
            uuidM: newUUID
        }
    });

} //end of caught function




























