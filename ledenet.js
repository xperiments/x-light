var net = require("net");
var path = require("path");
var suncalc = require("suncalc");
var ledenetSocket = {
  socket: new net.Socket(),
  state: "init",
  connect: function(ledenetPort, ledenetAddess) {
    ledenetSocket.socket.connect(ledenetPort, ledenetAddess);
  }
};

var ledenet = {
  commands: {
    setColor: 0x31,
    setMode: 0x61,
    setPower: 0x71
  },
  constants: {
    TRUE: 0xf0,
    FALSE: 0x0f,
    ON: 0x23,
    OFF: 0x24
  },
  powerOn: new Buffer([0x71, 0x23, 0x0f, 0xa3]),
  powerOff: new Buffer([0x71, 0x24, 0x0f, 0xa4]),
  functions: {
    SEVEN_COLOR_CROSS_FADE: 0x25,
    RED_GRADUAL_CHANGE: 0x26,
    GREEN_GRADUAL_CHANGE: 0x27,
    BLUE_GRADUAL_CHANGE: 0x28,
    YELLOW_GRADUAL_CHANGE: 0x29,
    CYAN_GRADUAL_CHANGE: 0x2a,
    PURPLE_GRADUAL_CHANGE: 0x2b,
    WHITE_GRADUAL_CHANGE: 0x2c,
    RED_GREEN_CROSS_FADE: 0x2d,
    RED_BLUE_CROSS_FADE: 0x2e,
    GREEN_BLUE_CROSS_FADE: 0x2f,
    SEVEN_COLOR_STROBE_FLASH: 0x30,
    RED_STROBE_FLASH: 0x31,
    GREEN_STROBE_FLASH: 0x32,
    BLUE_STROBE_FLASH: 0x33,
    YELLOW_STROBE_FLASH: 0x34,
    CYAN_STROBE_FLASH: 0x35,
    PURPLE_STROBE_FLASH: 0x36,
    WHITE_STROBE_FLASH: 0x37,
    SEVEN_COLOR_JUMPING_CHANGE: 0x38,
    NO_FUNCTION: 0x61
  }
};

ledenetSocket.socket.on("error", function(e) {
  console.log("error", e);
  ledenetSocket.state = "error";
});
ledenetSocket.socket.on("close", function() {
  console.log("close");
  ledenetSocket.state = "close";
});
ledenetSocket.socket.on("connect", function() {
  console.log("conect");
  ledenetSocket.state = "connected";
  app.listen(3002, function() {
    console.log("Example app listening on port 3002!");
  });
  setInterval(() => {
    if (lastSocketData) socketWrite(lastSocketData);
  }, 60 * 1000);
});

var lastSocketData = 0;

function socketWrite(data) {
  lastSocketData = data;
  ledenetSocket.socket.write(data);
}

function getCWWBuffer(cold, hot) {
  // 0x31 RED GREEN BLUE WW CW TRUE FALSE CHECKSUM
  // var color = [ledenet.commands.setColor, r, g, b, 0, 0, ledenet.constants.FALSE, ledenet.constants.FALSE]; //CW WW
  var color = [
    ledenet.commands.setColor,
    0,
    0,
    0,
    cold,
    hot,
    ledenet.constants.FALSE,
    ledenet.constants.FALSE
  ]; // COLD //HOT
  return new Buffer(color.concat(getChecksum(color)));
}

function getColorBuffer(r, g, b) {
  // 0x31 RED GREEN BLUE WW CW TRUE FALSE CHECKSUM
  // var color = [ledenet.commands.setColor, r, g, b, 0, 0, ledenet.constants.FALSE, ledenet.constants.FALSE]; //CW WW
  var color = [
    ledenet.commands.setColor,
    r,
    g,
    b,
    0,
    0,
    ledenet.constants.TRUE,
    ledenet.constants.FALSE
  ];
  return new Buffer(color.concat(getChecksum(color)));
}

function getMode(mode, speed = 0x10 /*max speed 0x1F*/) {
  var modeBuffer = [ledenet.commands.setMode, mode, speed, 0x0f];
  return new Buffer(modeBuffer.concat(getChecksum(modeBuffer)));
}

function getChecksum(input) {
  let value = 0;
  for (let i in input) {
    value = value + input[i];
  }
  return value & 0xff;
}

function rnd(max) {
  return Math.floor(Math.random() * max);
}

/// SERVER

var express = require("express");
var app = express();
app.use(express.static(path.join(__dirname, "public")));
app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname + "/public/index.html"));
});

// respond with "hello world" when a GET request is made to the homepage
app.get("/on", function(req, res) {
  socketWrite(ledenet.powerOn);
  res.send("ON");
});
app.get("/off", function(req, res) {
  socketWrite(ledenet.powerOff);
  res.send("OFF");
});
app.get("/red", function(req, res) {
  socketWrite(getColorBuffer(255, 0, 0));
  res.send("RED");
});
app.get("/green", function(req, res) {
  socketWrite(getColorBuffer(0, 255, 0));
  res.send("GREEN");
});
app.get("/blue", function(req, res) {
  socketWrite(getColorBuffer(0, 0, 255));
  res.send("BLUE");
});
app.get("/blue", function(req, res) {
  socketWrite(getColorBuffer(0, 0, 255));
  res.send("BLUE");
});
app.get("/cold/:value", function(req, res) {
  socketWrite(getCWWBuffer(parseInt(req.params.value, 10), 0));
  res.send("COLD " + req.params.value);
});
app.get("/hot/:value", function(req, res) {
  socketWrite(getCWWBuffer(0, parseInt(req.params.value)));
  res.send("HOT");
});
app.get("/rgb/:r/:g/:b", function(req, res) {
  console.log(req.params);
  socketWrite(
    getColorBuffer(
      parseInt(req.params.r),
      parseInt(req.params.g),
      parseInt(req.params.b)
    )
  );
  res.send("RGB");
});
app.get("/cw", function(req, res) {
  socketWrite(getColorBuffer(0, 0, 255));
  res.send("BLUE");
});

///// UDP

const discoverBridges = require("./discovery");

discoverBridges({
  type: "v6"
}).then(function(results) {
  ledenetSocket.connect("5577", results[0].ip);
});

console.log(suncalc.getTimes(new Date(), 42.6990457, 2.8694822));
