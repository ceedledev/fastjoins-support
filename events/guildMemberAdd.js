const { Client, GuildMember } = require("discord.js");
const config = require("../config");
const utils = require("../utils");

/**
 * 
 * @param {Client} client 
 * @param {GuildMember} member 
 */
module.exports = async (client, member) => {
    if(member.guild.id !== config.guildId) return;
    if(member.user.bot) {
        await member.roles.add(
            "1076264632211210341" // 🤖 Bot
        ).catch(() => {});
    } else {
        await Promise.all(
            [
                "1076308351807397968", // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                "1076264639156981871", // Members
                "1076264641279311982" // ━━━━━━━━━ Notifications ━━━━━━━━━
            ].map(async (roleId) => await member.roles.add(roleId).catch(() => {}))
        );
    };
};