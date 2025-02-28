const {
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require('discord.js');
const Acao = require('../models/Acao');

async function handleParticiparButton(interaction, client) {
    try {
        const acaoId = interaction.customId.split('_')[1];

        const acao = await Acao.findOne({ acao_id: acaoId });

        if (!acao) {
            return await interaction.reply({
                content: 'Ação não encontrada.',
                flags: 64
            });
        }

        if (acao.status === 'encerrada') {
            return await interaction.reply({
                content: 'Esta ação já foi encerrada.',
                flags: 64
            });
        }

        const userId = interaction.user.id;

        if (acao.participantes.aprovados.includes(userId)) {
            return await interaction.reply({
                content: 'Você já está participando desta ação.',
                flags: 64
            });
        }

        if (acao.participantes.reservas.includes(userId)) {
            return await interaction.reply({
                content: 'Você já está na lista de reservas desta ação.',
                flags: 64
            });
        }

        const existingSolicitation = acao.solicitacoes.find(sol => sol.user_id === userId && sol.status === 'pendente');
        if (existingSolicitation) {
            return await interaction.reply({
                content: 'Você já tem uma solicitação pendente para esta ação.',
                flags: 64
            });
        }

        const topicChannel = client.channels.cache.get(acao.topic_channel_id);
        if (!topicChannel) {
            return await interaction.reply({
                content: 'Tópico da ação não encontrado.',
                flags: 64
            });
        }

        const aprovarButton = new ButtonBuilder()
            .setCustomId(`aprovar_${acaoId}_${userId}`)
            .setLabel('Aprovar')
            .setStyle(ButtonStyle.Success);

        const reservaButton = new ButtonBuilder()
            .setCustomId(`reserva_${acaoId}_${userId}`)
            .setLabel('Reserva')
            .setStyle(ButtonStyle.Primary);

        const recusarButton = new ButtonBuilder()
            .setCustomId(`recusar_${acaoId}_${userId}`)
            .setLabel('Recusar')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(aprovarButton, reservaButton, recusarButton);

        const requestMessage = await topicChannel.send({
            content: `<@${userId}> (${interaction.user.tag}) solicitou participação na ação "${acao.nome}"`,
            components: [row]
        });

        acao.solicitacoes.push({
            user_id: userId,
            status: 'pendente',
            mensagem_id: requestMessage.id
        });

        await acao.save();

        await interaction.reply({
            content: `Sua solicitação para participar da ação "${acao.nome}" foi enviada!`,
            flags: 64
        });
    } catch (error) {
        console.error('Erro ao solicitar participação:', error);
        await interaction.reply({
            content: 'Houve um erro ao solicitar participação. Por favor, tente novamente.',
            flags: 64
        });
    }
}

module.exports = { handleParticiparButton };