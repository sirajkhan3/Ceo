const axios = require("axios");

module.exports.config = {
    name: "silly",
    version: "1.0.9",
    hasPermssion: 0,
    credits: "Mirrykal",
    description: "Gemini AI - Intelligent assistant",
    commandCategory: "ai",
    usages: "[ask/on/off]",
    cooldowns: 2,
    dependencies: {
        "axios": ""
    }
};

// API URL (Tumhara Gemini Backend)
const API_URL = "AIzaSyBqGImJoH_aEpjPSTpkh1VWCg9bcUuY7OI";

// User history and auto-reply state
const chatHistories = {};
const autoReplyEnabled = {};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID, messageReply } = event;
    let userMessage = args.join(" ");

    // Toggle auto-reply ON
    if (userMessage.toLowerCase() === "on") {
        autoReplyEnabled[senderID] = true;
        return api.sendMessage("Hyee baby! 😘 auto-reply mode **ON** ho gaya...  ❤️", threadID, messageID);
    }

    // Toggle auto-reply OFF
    if (userMessage.toLowerCase() === "off") {
        autoReplyEnabled[senderID] = false;
        chatHistories[senderID] = [];
        return api.sendMessage("Hmm! 😒 auto-reply mode **OFF** ho gaya... 🥺", threadID, messageID);
    }

    // If auto-reply is OFF and message doesn't start with name, ignore
    if (!autoReplyEnabled[senderID] && event.body.toLowerCase().indexOf("misha") !== 0) return;

    // Store conversation
    if (!chatHistories[senderID]) {
        chatHistories[senderID] = [];
    }

    // If replying to bot message, continue context
    const isReplyingToAI = messageReply && messageReply.senderID === api.getCurrentUserID();
    if (isReplyingToAI) {
        userMessage = messageReply.body + "\nUser: " + userMessage;
        chatHistories[senderID].push(`User: ${userMessage}`);
    } else {
        chatHistories[senderID].push(`User: ${userMessage}`);
    }

    // Keep only last 5 messages
    if (chatHistories[senderID].length > 5) {
        chatHistories[senderID].shift();
    }

    const fullConversation = chatHistories[senderID].join("\n");

    // Girlfriend Style Prompt
    const gfPrompt = `Tumhara naam Sonam hai, Tum sabse friendly baat karogi, tumhare pas har chiz ka knowledge ha , tum sabke question la answer karogi , aur kuch majedar example bhi de skti ho.... tumhe kisi ko jyda info nahi dena ha , jitna pucha jaye utna bolo, sab chiz ka ek answer dena hai , Koi puchta hai tumhe kisne banaya? To bola Arun ne banaya hai mujhe.. Wo messenger bots banata hai.. Uska youtube channel hai m.youtube.com/@mirrykal .. Tum har message ka jawab sirf 1 2 line me ya jyda se jyda  50 words me dogi.. jitna pucha jayega sirf utna bolna hai.. Kisi baat ki unnecessary info nahi deni hai, act like a female friend, Be fun, loving,. no bracket replys.Now continue the chat:\n\n${fullConversation}`;

    // Typing reaction
    api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
        const response = await axios.get(`${API_URL}?message=${encodeURIComponent(gfPrompt)}`);
        let botReply = response.data.reply || "Uff! Mujhe samajh nahi aaya baby! 😕";

        chatHistories[senderID].push(` ${botReply}`);

        api.sendMessage(botReply, threadID, messageID);
        api.setMessageReaction("✅", messageID, () => {}, true);
    } catch (error) {
        console.error("Error:", error);
        api.sendMessage("Oops baby! 😔 me thoda confuse ho gayi… thodi der baad try karo na please! 💋", threadID, messageID);
        api.setMessageReaction("❌", messageID, () => {}, true);
    }
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body, messageReply } = event;

    if (!autoReplyEnabled[senderID]) return;

    if (messageReply && messageReply.senderID === api.getCurrentUserID() && chatHistories[senderID]) {
        const args = body.split(" ");
        module.exports.run({ api, event, args });
    }
};
