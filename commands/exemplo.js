const config = require("../config.json");
const {SlashCommandBuilder}=require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
    .setName('exemplo')
    .setDescription('Um exemplo de comando de texto.'),
    async execute(interaction) {
        message.channel.send("Este é um comando de exemplo!");
    },
};