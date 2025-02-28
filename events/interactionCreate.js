const {
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ChannelType,
    PermissionFlagsBits
} = require('discord.js');
const Acao = require('../models/Acao');
const config = require('../config.json');
const { v4: uuidv4 } = require('uuid');

const { handleAcaoModalSubmit } = require('../handlers/handleAcaoModalSubmit');
const { handleParticiparButton } = require('../handlers/handleParticiparButton');
const { handleEncerrarButton } = require('../handlers/handleEncerrarButton');
const { handleAprovarButton } = require('../handlers/handleAprovarButton');
const { handleReservaButton } = require('../handlers/handleReservaButton');
const { handleRecusarButton } = require('../handlers/handleRecusarButton');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: 'Houve um erro ao executar este comando!',
                    flags: 64
                });
            }
        }

        if (interaction.isModalSubmit() && interaction.customId === 'iniciaracao-modal') {
            await handleAcaoModalSubmit(interaction, client);
        }

        if (interaction.isButton()) {
            if (interaction.customId.startsWith('participar_')) {
                await handleParticiparButton(interaction, client);
            } else if (interaction.customId.startsWith('encerrar_')) {
                await handleEncerrarButton(interaction, client);
            } else if (interaction.customId.startsWith('aprovar_')) {
                await handleAprovarButton(interaction, client);
            } else if (interaction.customId.startsWith('reserva_')) {
                await handleReservaButton(interaction, client);
            } else if (interaction.customId.startsWith('recusar_')) {
                await handleRecusarButton(interaction, client);
            }
        }
    }
};