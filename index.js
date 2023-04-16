const { Client, Intents } = require("discord.js");
const fs = require("fs");
const utils = require("./utils");
const config = require("./config");

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_INVITES
    ]
});

const eventFiles = fs.readdirSync("./events").filter((file) => file.endsWith(".js") || fs.statSync(`./events/${file}`).isDirectory());
for(const file of eventFiles) {
    const event = require(`./events/${file}`);
    const eventName = file.replace(/\.[^.]*$/, "");
    client.on(eventName, (...args) => event(client, ...args));
};

client.login(config.bot.token);