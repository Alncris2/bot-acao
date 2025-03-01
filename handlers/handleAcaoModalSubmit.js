const {
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ChannelType,
    PermissionFlagsBits
} = require('discord.js');
const { createActionEmbed } = require('../utils/embedUtils');
const config = require('../config.json');
const Acao = require('../models/Acao');
const { v4: uuidv4 } = require('uuid');


async function handleAcaoModalSubmit(interaction, client) {
    try {
        const nome = interaction.fields.getTextInputValue('nome');
        const data = interaction.fields.getTextInputValue('data');
        const radio = interaction.fields.getTextInputValue('radio');
        const vagas = parseInt(interaction.fields.getTextInputValue('vagas'));
        const reservas = parseInt(interaction.fields.getTextInputValue('reservas'));

        if (isNaN(vagas) || isNaN(reservas) || vagas < 0 || reservas < 0) {
            return await interaction.reply({
                content: 'O número de vagas e reservas deve ser um valor numérico positivo.',
                flags: 64
            });
        }

        const acaoId = uuidv4();

        const embed = createActionEmbed(nome, data, radio, vagas, reservas, [], []);

        const participarButton = new ButtonBuilder()
            .setCustomId(`participar_${acaoId}`)
            .setLabel('Participar da ação')
            .setStyle(ButtonStyle.Primary);

        const encerrarButton = new ButtonBuilder()
            .setCustomId(`encerrar_${acaoId}`)
            .setLabel('Encerrar Ação')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(participarButton, encerrarButton);

        const mainChannel = client.channels.cache.get(config.mainActionChannel);
        if (!mainChannel) {
            return await interaction.reply({
                content: 'Canal principal para ações não encontrado. Verifique a configuração.',
                flags: 64
            });
        }

        const messageResponse = await mainChannel.send({
            embeds: [embed],
            components: [row]
        });

        const guild = interaction.guild;
        const category = guild.channels.cache.get(config.actionCategory);

        if (!category) {
            return await interaction.reply({
                content: 'Categoria para tópicos de ação não encontrada. Verifique a configuração.',
                flags: 64
            });
        }

        const permissionOverwrites = [
            {
                id: guild.id,
                deny: [PermissionFlagsBits.ViewChannel],
            },
            ...config.adminAcaoRoleIds.map(roleId => ({
                id: roleId,
                allow: [PermissionFlagsBits.ViewChannel],
            })),
            {
                id: client.user.id,
                allow: [PermissionFlagsBits.ViewChannel],
            }
        ];

        const topicChannel = await guild.channels.create({
            name: `acao-${nome.slice(0, 20).replace(/\s+/g, '-').toLowerCase()}`,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: permissionOverwrites
        });

        await topicChannel.send(`# Ação: ${nome}\nTópico para gerenciar solicitações de participação para esta ação.`);

        const newAcao = new Acao({
            acao_id: acaoId,
            nome,
            data,
            radio,
            vagas: {
                total: vagas,
                reservas
            },
            participantes: {
                aprovados: [],
                reservas: []
            },
            solicitacoes: [],
            status: 'ativa',
            embed_message_id: messageResponse.id,
            topic_channel_id: topicChannel.id,
            guild_id: interaction.guild.id
        });

        await newAcao.save();

        await interaction.reply({
            content: `Ação "${nome}" criada com sucesso!`,
            flags: 64
        });
    } catch (error) {
        console.error('Erro ao criar ação:', error);
        await interaction.reply({
            content: 'Houve um erro ao criar a ação. Por favor, tente novamente.',
            flags: 64
        });
    }
}

module.exports = { handleAcaoModalSubmit };
