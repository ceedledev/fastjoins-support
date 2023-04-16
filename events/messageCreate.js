const { Client, Message, WebhookClient } = require("discord.js");
const config = require("../config");
const utils = require("../utils");

/**
 * 
 * @param {Client} client 
 * @param {Message} message
 */
module.exports = async (client, message) => {
    if(message.author.bot) return;

    if(message.channel.type === "GUILD_NEWS") {
        message.crosspost().then(() => {
            message.react("✅").then(() => {
                setTimeout(() => {
                    message.reactions.cache.get("✅").remove().catch(() => {});
                }, 2*1000);
            }).catch(() => {});
        }).catch(() => {
            message.react("❌").catch(() => {});
        });
    };

    if(message.channelId === config.channels.darkchat) {
        if(message.content) {
            if(message.content.startsWith("*") && config.ownersId.includes(message.author.id)) return;
            const isContentLink = (/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/).test(message.content);
            new WebhookClient(config.webhooks.darkchat).send({
                ...isContentLink ? {
                    content: message.content
                } : {
                    embeds: [{
                        color: config.embedColor,
                        description: message.content
                    }]
                }
            }).then(async (msg) => {
                await message.delete().catch(() => {});
                new WebhookClient(config.webhooks.darkchatLogs).send({
                    embeds: [{
                        color: config.embedColor,
                        author: {
                            name: message.author.tag,
                            icon_url: message.author.avatarURL({ dynamic: true }),
                            url: `https://discord.com/channels/${message.guildId}/${msg.channel_id}/${msg.id}`
                        },
                        description: message.content,
                        fields: [
                            {
                                name: "More Info",
                                value: `**\`Is link\`** ${isContentLink ? `${config.emojis.checkmarkbutton} Yes` : `${config.emojis.crossmarkbutton} No`}`
                            },
                            {
                                name: "ID",
                                value: "\`\`\`ini\n" + Object.entries({
                                    "USER": message.author.id
                                }).map(([ name, value ]) => `${name} = ${value}`).join("\n") + "\`\`\`"
                            }
                        ],
                        timestamp: Date.now()
                    }]
                });
            });
        } else {
            await message.delete().catch(() => {});
        };
    };
};