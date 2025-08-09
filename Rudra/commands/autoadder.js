module.exports.config = {
  name: "autoadder",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "🅂🄸🅁🄰🄷 Op",
  description: "Automatically adds user to group when UID or fb link is detected",
  commandCategory: "group",
  usages: "[UID or fb link]",
  cooldowns: 2
};

module.exports.handleEvent = async ({ event, api }) => {
  const { threadID, body } = event;
  const fbLinkRegex = /(?:https?:\/\/)?(?:www\.)?(?:facebook\.com\/(?:profile\.php\?id=)?|fb\.com\/)?([0-9]{9,})/gi;
  const matches = [...body.matchAll(fbLinkRegex)];

  for (const match of matches) {
    const uid = match[1];

    try {
      await api.addUserToGroup(uid, threadID);
      api.sendMessage(`✅ Member added to group: ${uid}`, threadID);
    } catch (e) {
      if (e.message && e.message.includes("approval")) {
        api.sendMessage(`⚠️ Add request sent for UID: ${uid}. Waiting for admin approval.`, threadID);
      } else {
        api.sendMessage(`❌ Failed to add ${uid}: ${e.message || "Unknown error"}`, threadID);
      }
    }
  }
};

module.exports.run = () => {};
