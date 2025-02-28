const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require('discord.js');
//const { v4: uuidv4 } = require('uuid');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('iniciaracao')
        .setDescription('Inicia uma nova ação'),

    async execute(interaction) {
        // Create the modal
        const modal = new ModalBuilder()
            .setCustomId('iniciaracao-modal')
            .setTitle('Iniciar Nova Ação');

        // Add inputs to the modal
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

        // Add inputs to rows
        const firstRow = new ActionRowBuilder().addComponents(nomeInput);
        const secondRow = new ActionRowBuilder().addComponents(dataInput);
        const thirdRow = new ActionRowBuilder().addComponents(radioInput);
        const fourthRow = new ActionRowBuilder().addComponents(vagasInput);
        const fifthRow = new ActionRowBuilder().addComponents(reservasInput);

        // Add rows to the modal
        modal.addComponents(firstRow, secondRow, thirdRow, fourthRow, fifthRow);

        // Show the modal
        await interaction.showModal(modal);
    }
};
