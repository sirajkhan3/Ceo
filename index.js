const config = require("./config.json");

if (config.facebook && config.facebook.enable === false) {
  console.log("🚫 Facebook login disabled by config");
  global.userID = "TEST_USER";
  global.facebookDisabled = true;
}
const { spawn } = require("child_process");
const axios = require("axios");
const logger = require("./utils/log");

///////////////////////////////////////////////////////////
//========= Create website for dashboard/uptime =========//
///////////////////////////////////////////////////////////

const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// Serve the index.html file
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/index.html'));
});

// Start the server and add error handling
app.listen(port, () => {
    logger(`Server is running on port ${port}...`, "[ MirryKal ]");
}).on('error', (err) => {
    if (err.code === 'EACCES') {
        logger(`Permission denied. Cannot bind to port ${port}.`, "[ MirryKal ]");
    } else {
        logger(`Server error: ${err.message}`, "[ Kripya Dhyan de ]");
    }
});

/////////////////////////////////////////////////////////
//========= Start bot with auto-restart on crash =======//
/////////////////////////////////////////////////////////

global.countRestart = global.countRestart || 0;

function startBot(message) {
    if (message) logger(message, "[ MirryKal ]");

    const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "rudra.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    child.on("close", (codeExit) => {
        if (codeExit !== 0 && global.countRestart < 5) {
            global.countRestart++;
            logger(`Bot exited with code ${codeExit}. Restarting... (${global.countRestart}/5)`, "[ Rudra ]");
            startBot();
        } else {
            logger(`Bot stopped after ${global.countRestart} restarts.`, "[ MirrKal]");
        }
    });

    child.on("error", (error) => {
        logger(`An error occurred: ${JSON.stringify(error)}`, "[ Rudra ]");
    });
}

////////////////////////////////////////////////
//========= Check update from GitHub =========//
////////////////////////////////////////////////

axios.get("https://raw.githubusercontent.com/priyanshu192/bot/main/package.json")
    .then((res) => {
        logger(res.data.name, "[ Mirrykal ]");
        logger(`Version: ${res.data.version}`, "[ Mirrykal]");
        logger(res.data.description, "[ Mirrykal ]");
    })
    .catch((err) => {
        logger(`Failed to fetch update info: ${err.message}`, "[ Rudra ]");
    });

// Start the bot
startBot();
