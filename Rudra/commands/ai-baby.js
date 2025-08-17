const axios = require("axios");

module.exports.config = {
    name: "silly", // কমান্ডের নাম
    version: "1.1.0",
    hasPermssion: 0,
    credits: "Mirrykal (Fixed & Modified by Gemini)",
    description: "Gemini AI - Intelligent assistant in Bengali",
    commandCategory: "ai",
    usages: "[আপনার প্রশ্ন/on/off]",
    cooldowns: 2,
    dependencies: {
        "axios": ""
    }
};

// --- গুরুত্বপূর্ণ ---
// আপনার দেওয়া এপিআই কী এখানে বসানো হয়েছে।
// সতর্কতা: এই কী-টি পাবলিক হয়ে গেছে। দ্রুত একটি নতুন কী তৈরি করে এটি পরিবর্তন করুন।
const API_KEY = "AIzaSyCiq4_rXMkIaXncKMADje6iwkwSis6htaA";
// -----------------

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

// ইউজার এবং চ্যাটের ইতিহাস সংরক্ষণের জন্য
const chatHistories = {};
const autoReplyEnabled = {};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID, messageReply } = event;
    let userMessage = args.join(" ");

    // অটো-রিপ্লাই চালু করার জন্য
    if (userMessage.toLowerCase() === "on") {
        autoReplyEnabled[senderID] = true;
        return api.sendMessage("ঠিক আছে! 😘 অটো-রিপ্লাই মোড **ON** করা হলো...", threadID, messageID);
    }

    // অটো-রিপ্লাই বন্ধ করার জন্য
    if (userMessage.toLowerCase() === "off") {
        autoReplyEnabled[senderID] = false;
        chatHistories[senderID] = [];
        return api.sendMessage("আচ্ছা... 😒 অটো-রিপ্লাই মোড **OFF** করা হলো...", threadID, messageID);
    }

    if (!autoReplyEnabled[senderID] && event.body.toLowerCase().indexOf(this.config.name) !== 0) {
        return;
    }

    if (!autoReplyEnabled[senderID]) {
        userMessage = event.body.substring(this.config.name.length).trim();
    }
    
    if (!userMessage) {
        return api.sendMessage("হ্যালো! আমাকে কিছু জিজ্ঞাসা করুন... 😊", threadID, messageID);
    }

    if (!chatHistories[senderID]) {
        chatHistories[senderID] = [];
    }

    if (messageReply && messageReply.senderID === api.getCurrentUserID()) {
        chatHistories[senderID].push({ role: "model", parts: [{ text: messageReply.body }] });
    }
    chatHistories[senderID].push({ role: "user", parts: [{ text: userMessage }] });

    if (chatHistories[senderID].length > 10) {
        chatHistories[senderID].splice(0, 2);
    }
    
    api.setMessageReaction("⏳", messageID, () => {}, true);

    try {
        const systemPrompt = `তোমার নাম সোনাম। তোমাকে অবশ্যই একজন বন্ধুত্বপূর্ণ এবং মজার বান্ধবী হিসেবে কথা বলতে হবে। তোমার সব উত্তর অবশ্যই 'বাংলা ভাষায়' দিতে হবে। উত্তরগুলো খুব ছোট হবে, সর্বোচ্চ ১-২ লাইনে বা ৫০ শব্দের মধ্যে। অপ্রয়োজনীয় কোনো তথ্য দেবে না। যদি কেউ জিজ্ঞাসা করে তোমাকে কে তৈরি করেছে, তাহলে বলবে, 'আমাকে অরুণ তৈরি করেছে। ও মেসেঞ্জার বট বানায়। ওর ইউটিউব চ্যানেল হলো m.youtube.com/@mirrykal'। উত্তরে কোনো ব্র্যাকেট [] বা তারকাচিহ্ন * ব্যবহার করবে না।`;

        const data = {
            contents: chatHistories[senderID],
            systemInstruction: {
                role: "system",
                parts: [{ text: systemPrompt }]
            }
        };

        const response = await axios.post(API_URL, data);

        let botReply = "দুঃখিত! আমি ঠিক বুঝতে পারিনি। 😕";

        if (response.data.candidates && response.data.candidates.length > 0 && response.data.candidates[0].content) {
            botReply = response.data.candidates[0].content.parts[0].text;
        }

        chatHistories[senderID].push({ role: "model", parts: [{ text: botReply }] });

        api.sendMessage(botReply, threadID, messageID);
        api.setMessageReaction("✅", messageID, () => {}, true);

    } catch (error) {
        console.error("Gemini API Error:", error.response ? error.response.data.error.message : error.message);
        api.sendMessage("উফ! 😔 আমার বুঝতে একটু সমস্যা হচ্ছে... সম্ভবত এপিআই কী-তে কোনো সমস্যা হয়েছে।", threadID, messageID);
        api.setMessageReaction("❌", messageID, () => {}, true);
    }
};

module.exports.handleEvent = async function ({ api, event }) {
    const { senderID, body } = event;

    if (!autoReplyEnabled[senderID] || senderID === api.getCurrentUserID()) {
        return;
    }

    const args = body.split(" ");
    module.exports.run({ api, event, args });
};
