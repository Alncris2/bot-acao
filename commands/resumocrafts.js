const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createCraftSummary } = require('../utils/craftProcessor');
const config = require('../config.json');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('resumocrafts')
        .setDescription('Gera um resumo dos crafts registrados nas últimas 24 horas')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        try {
            const isAdmin = config.adminCraftRoleIds.some(roleId => interaction.member.roles.cache.has(roleId));

            if (!isAdmin) {
                return await interaction.reply({
                    content: 'Você não tem permissão para usar este comando.',
                    flags: 64
                });
            }

            //await interaction.reply({
            //    content: 'Gerando resumo de crafts das últimas 24 horas...',
            //    flags: 64
            //});

            await createCraftSummary(interaction);
        } catch (error) {
            console.error('Erro ao executar comando de resumo:', error);
            await interaction.reply({
                content: 'Houve um erro ao gerar o resumo de crafts.',
                flags: 64
            });
        }
    }
};