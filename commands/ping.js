const { Client, CommandInteraction } = require("discord.js");
const utils = require("../utils");
const config = require("../config");

module.exports = {
    data: {
        description: "Affiche le ping du bot."
    },
    /**
     * 
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     */
    async exe(client, interaction) {
        interaction.deferReply({
            fetchReply: true
        }).then((i) => {
            interaction.editReply({
                embeds: [{
                    color: config.embedColor,
                    title: "🏓 Ping",
                    description: `Latence du robot: \`${i.createdTimestamp-interaction.createdTimestamp}ms\`\nLatence du WebSocket: \`${client.ws.ping}ms\``
                }]
            }).catch(() => {});
        }).catch(() => {});
    }
};