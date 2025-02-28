const {
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require('discord.js');
const { createActionEmbed } = require('../utils/embedUtils');
const config = require('../config.json');
const Acao = require('../models/Acao');

async function handleAprovarButton(interaction, client) {
    try {
        const [_, acaoId, userId] = interaction.customId.split('_');

        const acao = await Acao.findOne({ acao_id: acaoId });

        console.log('acaoId: ', acaoId, 'acao: ', acao);

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

        const solicitationIndex = acao.solicitacoes.findIndex(
            sol => sol.user_id === userId && sol.status === 'pendente'
        );

        if (solicitationIndex === -1) {
            return await interaction.reply({
                content: 'Solicitação não encontrada ou já processada.',
                flags: 64
            });
        }

        if (acao.participantes.aprovados.length >= acao.vagas.total) {
            return await interaction.reply({
                content: 'Não há mais vagas disponíveis para esta ação.',
                flags: 64
            });
        }

        acao.solicitacoes[solicitationIndex].status = 'aprovado';

        if (!acao.participantes.aprovados.includes(userId)) {
            acao.participantes.aprovados.push(userId);
        }

        await acao.save();

        try {
            await interaction.message.edit({
                content: `<@${userId}> foi **APROVADO** para a ação "${acao.nome}" por <@${interaction.user.id}>`,
                components: []
            });
        } catch (error) {
            console.error('Erro ao editar mensagem de solicitação:', error);
        }

        const mainChannel = client.channels.cache.get(config.mainActionChannel);
        if (mainChannel) {
            try {
                const message = await mainChannel.messages.fetch(acao.embed_message_id);
                if (message) {
                    const updatedEmbed = createActionEmbed(
                        acao.nome,
                        acao.data,
                        acao.radio,
                        acao.vagas.total,
                        acao.vagas.reservas,
                        acao.participantes.aprovados,
                        acao.participantes.reservas
                    );

                    let components = [];
                    if (acao.status === 'ativa') {
                        const participarButton = new ButtonBuilder()
                            .setCustomId(`participar_${acaoId}`)
                            .setLabel('Participar da ação')
                            .setStyle(ButtonStyle.Primary);

                        const encerrarButton = new ButtonBuilder()
                            .setCustomId(`encerrar_${acaoId}`)
                            .setLabel('Encerrar Ação')
                            .setStyle(ButtonStyle.Danger);

                        components = [new ActionRowBuilder().addComponents(participarButton, encerrarButton)];
                    }

                    await message.edit({
                        embeds: [updatedEmbed],
                        components: components
                    });
                }
            } catch (error) {
                console.error('Erro ao atualizar embed da ação:', error);
            }
        }

        try {
            const user = await client.users.fetch(userId);
            await user.send(`Sua solicitação para participar da ação "${acao.nome}" foi **APROVADA**!`);
        } catch (error) {
            console.error('Erro ao notificar usuário sobre aprovação:', error);
        }

        await interaction.reply({
            content: `Usuário <@${userId}> foi aprovado para a ação "${acao.nome}"!`,
            flags: 64
        });
    } catch (error) {
        console.error('Erro ao aprovar solicitação:', error);
        await interaction.reply({
            content: 'Houve um erro ao aprovar a solicitação. Por favor, tente novamente.',
            flags: 64
        });
    }
}

module.exports = { handleAprovarButton };