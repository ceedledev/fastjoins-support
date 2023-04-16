const { Client, CommandInteraction } = require("discord.js");
const utils = require("../utils");
const config = require("../config");

module.exports = {
    data: {
        description: "backup",
        options: [
            {
                type: "SUB_COMMAND",
                name: "list",
                description: "View all backups."
            },
            {
                type: "SUB_COMMAND",
                name: "create",
                description: "Create a backup."
            }
        ]
    },
    /**
     * 
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     */
    async exe(client, interaction) {

    }
};