const { Guild, Collection } = require("discord.js");
const https = require("https");

const requestImg = (url) => new Promise((resolve) => {
    https.get(url, (res) => {
        res.setEncoding("base64");
        let data = "";
        res.on("data", (chunk) => {
            data += chunk;
        });
        res.on("close", () => {
            resolve(data);
        });
    });
});

class Backup {
    /**
     * 
     * @param {Guild} guild 
     */
    constructor (guild) {
        this.guild = guild;
        this.cache = {
            roles: new Collection()
        };
    };

    // Create backup
    async getBans() {
        const bans = await this.guild.bans.fetch();
        return bans.map((ban) => {
            return {
                id: ban.user.id,
                reason: ban.reason
            };
        });
    };

    async getRoles() {
        this.cache.roles.clear();
        let roleId = 0;
        const roles = await this.guild.roles.fetch();
        return await Promise.all(
            roles
            .filter((role) => !role.managed)
            .map(async (role) => {
                const id = roleId++;
                this.cache.roles.set(role.id, id);
                return {
                    id,
                    color: role.hexColor,
                    name: role.name,
                    hoist: role.hoist,
                    permissions: role.permissions.bitfield.toString(),
                    mentionable: role.mentionable,
                    position: role.position,
                    iconBase64: role.icon ? await requestImg(role.iconURL({ format: "webp" })) : null,
                    unicodeEmoji: role.unicodeEmoji,
                    isEveryone: this.guild.id === role.id
                };
            })
        );
    };

    async getChannels() {
        const channels = await this.guild.channels.fetch();
        const mapDataChannel = (channel) => {
            return {
                name: channel.name,
                type: channel.type,
                position: channel.position,
                isAfk: this.guild.afkChannelId === channel.id,
                isWidget: this.guild.widgetChannelId === channel.id,
                isSystemChannel: this.guild.systemChannelId === channel.id,
                permissions: channel.permissionOverwrites.cache
                .filter((permission) => permission.type === "role")
                .map((permission) => {
                    return {
                        allow: permission.allow.bitfield.toString(),
                        deny: permission.deny.bitfield.toString(),
                        id: this.cache.roles.get(permission.id),
                        type: "role"
                    };
                })
            };
        };
        return channels
        .filter((channel) => !channel.parentId && channel.type !== "GUILD_CATEGORY")
        .map((channel) => mapDataChannel(channel))
        .concat(
            channels
            .filter((channel) => channel.type === "GUILD_CATEGORY")
            .map((channel) => {
                return {
                    ...mapDataChannel(channel),
                    children: channel.children.map((children) => mapDataChannel(children))
                };
            })
        );
    };

    // Load backup
    async loadGuild(backup) {
        // Set name
        await this.guild.setName(backup.name);

        // Set all pictures
        if(backup.iconBase64) await this.guild.setIcon(Buffer.from(backup.iconBase64, "base64"));
        if(backup.bannerBase64) await this.guild.setBanner(Buffer.from(backup.bannerBase64, "base64"));
        if(backup.splashBase64) await this.guild.setDiscoverySplash(Buffer.from(backup.splashBase64, "base64"));

        // Set default msg notif
        await this.guild.setDefaultMessageNotifications(backup.defaultMessageNotifications);

        // Set verif level
        await this.guild.setVerificationLevel(backup.verificationLevel);

        // Set locale
        await this.guild.setPreferredLocale(backup.preferredLocale);

        // Set afk
        await this.guild.setAFKChannel(backup.channels.find((channel) => channel.isAfk)?.id);
        await this.guild.setAFKTimeout(backup.afkTimeout);

        // Set widget
        await this.guild.setWidgetSettings({
            enabled: backup.widgetEnabled,
            channel: backup.channels.find((channel) => channel.isWidget)?.id
        });

        // System channel
        await this.guild.setSystemChannel(backup.channels.find((channel) => channel.isSystemChannel)?.id);
        await this.guild.setSystemChannelFlags(backup.systemChannelFlags);
        
        // Add bans
        await Promise.all(
            backup.bans.map(async ({ id, reason }) => await this.guild.members.ban(id, { reason }))
        );
    };

    async loadRoles(backup) {
        await Promise.all(
            (await this.guild.roles.fetch())
            .map(async (role) => await role.delete().catch(() => {}))
        );
        this.cache.roles.clear();
        await Promise.all(
            backup.roles
            .sort((a, b) => b.position - a.position)
            .map(async (role) => {
                if(role.isEveryone) {
                    const { id } = await this.guild.roles.everyone.edit({
                        color: role.color,
                        hoist: role.hoist,
                        //icon: role.iconBase64 ? Buffer.from(role.iconBase64, "base64") : null,
                        mentionable: role.mentionable,
                        permissions: role.permissions,
                        position: role.position,
                        //unicodeEmoji: role.unicodeEmoji
                    });
                    this.cache.roles.set(role.id, id);
                } else {
                    const { id } = await this.guild.roles.create({
                        color: role.color,
                        hoist: role.hoist,
                        //icon: role.iconBase64 ? Buffer.from(role.iconBase64, "base64") : null,
                        mentionable: role.mentionable,
                        name: role.name,
                        permissions: role.permissions,
                        position: role.position,
                        //unicodeEmoji: role.unicodeEmoji
                    });
                    this.cache.roles.set(role.id, id);
                };
            })
        );
    };

    async loadChannels(backup) {
        await Promise.all(
            await (this.guild.channels.fetch())
            .map(async (channel) => await channel.delete().catch(() => {}))
        );
        const valideChannelType = (channel) => {
            let type = channel.type;
            if([ "GUILD_NEWS", "GUILD_DIRECTORY", "GUILD_FORUM" ].includes(type)) type = "GUILD_TEXT";
            if("GUILD_STAGE_VOICE" === type) type = "GUILD_VOICE";
            return type;
        };
        await Promise.all(
            backup.channels.map(async (channel) => {
                if(channel.type === "GUILD_CATEGORY") {
                    const category = await this.guild.channels.create(channel.name, {
                        type: channel.type,
                        position: channel.position,
                        permissionOverwrites: channel.permissions.map((permission) => {
                            return {
                                allow: permission.allow,
                                deny: permission.deny,
                                id: this.cache.roles.get(permission.id)
                            };
                        })
                    });
                    await Promise.all(
                        channel.children
                        .map(async (children) => {
                            await this.guild.channels.create(children.name, {
                                type: valideChannelType(children),
                                parent: category.id,
                                position: children.position,
                                permissionOverwrites: children.permissions.map((permission) => {
                                    return {
                                        allow: permission.allow,
                                        deny: permission.deny,
                                        id: this.cache.roles.get(permission.id)
                                    };
                                })
                            });
                        })
                    );
                } else {
                    await this.guild.channels.create(channel.name, {
                        type: valideChannelType(channel),
                        position: channel.position,
                        permissionOverwrites: channel.permissions.map((permission) => {
                            return {
                                allow: permission.allow,
                                deny: permission.deny,
                                id: this.cache.roles.get(permission.id)
                            };
                        })
                    });
                };
            })
        );
    };

    async create() {
        const bans = await this.getBans();
        const roles = await this.getRoles();
        const channels = await this.getChannels();
        return {
            guildId: this.guild.id,
            createdTimestamp: Date.now(),
            name: this.guild.name,
            iconBase64: this.guild.icon ? await requestImg(this.guild.iconURL({ format: "webp", dynamic: true })) : null,
            bannerBase64: this.guild.banner ? await requestImg(this.guild.bannerURL({ format: "webp" })) : null,
            splashBase64: this.guild.discoverySplash ? await requestImg(this.guild.splashURL({ format: "webp" })) : null,
            defaultMessageNotifications: this.guild.defaultMessageNotifications,
            verificationLevel: this.guild.verificationLevel,
            preferredLocale: this.guild.preferredLocale,
            afkTimeout: this.guild.afkTimeout,
            widgetEnabled: this.guild.widgetEnabled,
            systemChannelFlags: this.guild.systemChannelFlags.bitfield.toString(),
            membersId: (await this.guild.members.fetch()).map((member) => {
                return {
                    id: member.id
                };
            }),
            bans,
            roles,
            channels
        };
    };

    async load(backup) {
        await this.loadGuild(backup);
        await this.loadRoles(backup);
        await this.loadChannels(backup);
    };
};

module.exports = Backup;