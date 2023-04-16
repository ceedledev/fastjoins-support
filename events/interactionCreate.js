const { Client, Interaction } = require("discord.js");
const config = require("../config");
const utils = require("../utils");

/**
 * 
 * @param {Client} client 
 * @param {Interaction} interaction
 */
module.exports = async (client, interaction) => {
    const { exe } = require(`../commands/${interaction.commandName}`);
    if(config.ownersId.includes(interaction.user.id)) {
        exe(client, interaction);
    } else {
        interaction.reply({
            embeds: [{
                color: "RED",
                description: `${config.emojis.crossmarkbutton} You don't have permissions!`
            }],
            ephemeral: true
        }).catch(() => {});
    };
};