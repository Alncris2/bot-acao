const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { createHelpEmbed } = require('../utils/craftProcessor');
const config = require('../config.json');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configurarcraftcanal')
        .setDescription('Configura o canal atual como canal de registro de crafts')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const isAdmin = config.adminCraftRoleIds.some(roleId => interaction.member.roles.cache.has(roleId));

            if (!isAdmin) {
                return await interaction.reply({
                    content: 'Você não tem permissão para configurar o canal de crafts.',
                    ephemeral: true
                });
            }

            const channelId = interaction.channelId;
            config.craftChannelId = channelId;

            const configPath = path.join(__dirname, '..', 'config.json');
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

            const helpEmbed = createHelpEmbed();
            const button = new ButtonBuilder()
                .setCustomId('registrar_craft')
                .setLabel('Registrar Craft')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(button);

            await interaction.channel.send({ embeds: [helpEmbed], components: [row] });

            await interaction.reply({
                content: `Este canal foi configurado com sucesso como canal de registro de crafts!`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Erro ao configurar canal de crafts:', error);
            await interaction.reply({
                content: 'Houve um erro ao configurar o canal de crafts.',
                ephemeral: true
            });
        }
    }
};