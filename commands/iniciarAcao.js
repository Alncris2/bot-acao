const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    PermissionFlagsBits
} = require('discord.js');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('iniciaracao')
        .setDescription('Inicia uma nova ação')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const isAdmin = config.adminRoleIds.some(roleId => interaction.member.roles.cache.has(roleId));

        if (!isAdmin) {
            return await interaction.reply({
                content: 'Você não tem permissão para iniciar uma ação.',
                flags: 64
            });
        }

        const modal = new ModalBuilder()
            .setCustomId('iniciaracao-modal')
            .setTitle('Iniciar Nova Ação');

        const nomeInput = new TextInputBuilder()
            .setCustomId('nome')
            .setLabel('Nome da Ação')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const dataInput = new TextInputBuilder()
            .setCustomId('data')
            .setLabel('Data da Ação')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const radioInput = new TextInputBuilder()
            .setCustomId('radio')
            .setLabel('Rádio da Ação')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const vagasInput = new TextInputBuilder()
            .setCustomId('vagas')
            .setLabel('Número de vagas para a ação')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const reservasInput = new TextInputBuilder()
            .setCustomId('reservas')
            .setLabel('Número de vagas reservas')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const firstRow = new ActionRowBuilder().addComponents(nomeInput);
        const secondRow = new ActionRowBuilder().addComponents(dataInput);
        const thirdRow = new ActionRowBuilder().addComponents(radioInput);
        const fourthRow = new ActionRowBuilder().addComponents(vagasInput);
        const fifthRow = new ActionRowBuilder().addComponents(reservasInput);

        modal.addComponents(firstRow, secondRow, thirdRow, fourthRow, fifthRow);

        await interaction.showModal(modal);
    }
};
