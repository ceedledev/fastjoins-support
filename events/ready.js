const { Client, WebhookClient } = require("discord.js");
const fs = require("fs");
const config = require("../config");
const utils = require("../utils");

/**
 * 
 * @param {Client} client 
 */
module.exports = async (client) => {
    console.log(`${utils.chalk.bot} Logged in as ${client.user.tag}`);

    // Delete all commands
    /*await Promise.all(
        (await client.application.commands.fetch()).map(async (command) => {
            await command.delete().then(() => {
                console.log(`${utils.chalk.bot} Command deleted (${command.type}): ${command.name}`);
            });
        })
    ).then(() => {
        console.log(`${utils.chalk.bot} Deletion commands done`);
    });*/

    const commandsFiles = fs.readdirSync("./commands").filter((file) => file.endsWith(".js"));
    for(const file of commandsFiles) {
        let { data } = require(`../commands/${file}`);
        data.type = "CHAT_INPUT";
        data.name = file.replace(/\.[^.]*$/, "");
        client.application.commands.create(data).then(() => {
            console.log(`${utils.chalk.bot} Command loaded: ${data.name}`);
        }).catch(({ stack }) => {
            console.error(`${utils.chalk.bot} Command error "${data.name}"`, stack);
        });
    };

    //require("../app")(client, db);

    const tracker = new utils.inviteTracker(client, {
        guildId: config.guildId
    });

    tracker.on("cacheFetched", () => {
        console.log(`${utils.chalk.inviteTracker} Cache fetched`);
    });

    tracker.on("inviteCreate", (invite) => {
        const inviter = client.users.cache.get(invite.inviterId);
        new WebhookClient(config.webhooks.inviteLogger).send({
            content: `**${inviter.tag}** has created a new invite. (\`${invite.code}\`)`
        });
    });

    tracker.on("inviteDelete", (invite) => {
        const inviter = client.users.cache.get(invite.inviterId);
        new WebhookClient(config.webhooks.inviteLogger).send({
            content: `The invitation \`${invite.code}\` created by **${inviter.tag}** has been deleted.`
        });
    });

    tracker.on("guildMemberAdd", async (member, type, invite) => {
        if(type === "normal") {
            new WebhookClient(config.webhooks.inviteLogger).send({
                content: `<@${member.id}> has just joined. He was invited by **${invite.inviter.tag}**.`
            });
        } else if(type === "vanity") {
            new WebhookClient(config.webhooks.inviteLogger).send({
                content: `<@${member.id}> arrived using the personalized invitation.`
            });
        } else if(type === "oauth") {
            new WebhookClient(config.webhooks.inviteLogger).send({
                content: `<@${member.id}> has been just added.`
            });
        } else if(type === "unknown") {
            new WebhookClient(config.webhooks.inviteLogger).send({
                content: `<@${member.id}> has just joined, but I can't find out who invited him.`
            });
        };
    });
};