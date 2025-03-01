const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    ActionRowBuilder
} = require('discord.js');

const { handleAcaoModalSubmit } = require('../handlers/handleAcaoModalSubmit');
const { handleRegistroModalSubmit } = require('../handlers/handleRegistroModalSubmit');
const { handleParticiparButton } = require('../handlers/handleParticiparButton');
const { handleEncerrarButton } = require('../handlers/handleEncerrarButton');
const { handleAprovarButton } = require('../handlers/handleAprovarButton');
const { handleReservaButton } = require('../handlers/handleReservaButton');
const { handleRecusarButton } = require('../handlers/handleRecusarButton');

const arrayTipo = [
    { label: 'Fajuta', value: 'fajuta' },
    { label: 'Five', value: 'five' },
    { label: 'TEC', value: 'tec' },
    { label: 'MP', value: 'mp' },
    { label: 'AK-47', value: 'ak-47' },
    { label: 'AK-MK2', value: 'ak-mk2' },
    { label: 'MTAR', value: 'mtar' },
    { label: 'G36', value: 'g36' },
    { label: 'AUG', value: 'aug' },
    { label: 'FAMAS', value: 'famas' },
    { label: 'AR-15', value: 'ar-15' },
    { label: 'SCAR-L', value: 'scar-l' },
    { label: 'Groza', value: 'groza' }
];

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

        if (interaction.isModalSubmit()){
            if (interaction.customId === 'iniciaracao-modal'){
                await handleAcaoModalSubmit(interaction,client);
            }
            if (interaction.customId.startsWith('craft_form')){
                await handleRegistroModalSubmit(interaction,client);
            }
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
            } else if (interaction.customId === 'registrar_craft') {
                const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('selecionar_tipo_craft')
                .setPlaceholder('Selecione o tipo de craft...')
                .addOptions(arrayTipo);

                const row = new ActionRowBuilder().addComponents(selectMenu);

                await interaction.reply({
                    content: 'Escolha o tipo de craft:',
                    components: [row],
                    flags: 64
                });
            } else if(interaction.customId.startsWith('craft_form')){
                await handleRegistroModalSubmit(interaction, client);
            }
        }

        if (interaction.isStringSelectMenu() && interaction.customId === 'selecionar_tipo_craft') {
            const tipoSelecionado = interaction.values[0];

            const modal = new ModalBuilder()
                .setCustomId(`craft_form:${tipoSelecionado}`)
                .setTitle('Registrar Craft');

            const nicknameUser = interaction.member.nickname;
            const regex = /\[\d+\] (.+?) \| (\d+)/;
            const match = nicknameUser?.match(regex);
            const [_, nome, id] = match ? match : [null, '', ''];

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                    .setCustomId('nome')
                    .setLabel('Nome')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setValue(nome)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                    .setCustomId('id')
                    .setLabel('ID')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setValue(id)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                    .setCustomId('quantidade')
                    .setLabel('Quantidade')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                    .setCustomId('motivo')
                    .setLabel('Motivo (Opcional)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
                )
            );

            await interaction.showModal(modal);
        }
    }
};