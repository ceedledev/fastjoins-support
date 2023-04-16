const { GuildMember } = require("discord.js");
const Canvas = require("canvas");

/**
 * 
 * @param {GuildMember} member
 * @returns 
 */
module.exports = async (member) => {
    const canvas = Canvas.createCanvas(900, 380);
    const ctx = canvas.getContext("2d");

    const background = await Canvas.loadImage("./assets/welcome-card.jpg");
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = 0.6;
    ctx.fillRect(40, 40, canvas.width-80, canvas.height-80);

    const radiusAvatar = Math.floor(175 / 2);
    const lineWidthAvatar = 6;
    const marginAvatar = 20;
    const widthAvatar = (radiusAvatar*2)-(marginAvatar*2);

    const fontSizeTitle = 25;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.globalAlpha = 0.85;
    ctx.font = `bold ${fontSizeTitle}px Verdana`;
    ctx.fillText(`Welcome to ${member.guild.name}`, canvas.width/2, 40+20+(radiusAvatar*2)+20+fontSizeTitle);

    const fontSizeDescription = 20;
    ctx.globalAlpha = 0.5;
    ctx.font = `bold ${fontSizeDescription}px Verdana`;
    ctx.fillText(`You're member #${new Intl.NumberFormat("fr").format(member.guild.memberCount)}. Make sure to read #rules!`, canvas.width/2, 40+20+(radiusAvatar*2)+20+fontSizeTitle+15+fontSizeDescription);

    ctx.beginPath();
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = lineWidthAvatar;
        ctx.strokeStyle = "#fff";
        ctx.arc(canvas.width/2, 40+20+radiusAvatar, radiusAvatar-(lineWidthAvatar/2), 0, Math.PI*2, true);
        ctx.stroke();
    ctx.closePath();
    ctx.clip();

    ctx.beginPath();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 2;
        ctx.arc(canvas.width/2, (widthAvatar/2)+40+20+marginAvatar, widthAvatar/2, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.clip();

    const avatar = await Canvas.loadImage(member.displayAvatarURL({ size: 128, format: "png" }));
    ctx.drawImage(avatar, (canvas.width/2)-(widthAvatar/2), 40+20+marginAvatar, widthAvatar, widthAvatar);

    return canvas;
}