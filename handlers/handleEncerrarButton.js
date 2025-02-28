const { createActionEmbed } = require('../utils/embedUtils');
const config = require('../config.json');
const Acao = require('../models/Acao');

async function handleEncerrarButton(interaction, client) {
    try {
        const acaoId = interaction.customId.split('_')[1];

        const acao = await Acao.findOne({ acao_id: acaoId });

        if (!acao) {
            return await interaction.reply({
                content: 'Ação não encontrada.',
                flags: 64
            });
        }

        const isAdmin = config.adminRoleIds.some(roleId => interaction.member.roles.cache.has(roleId));

        if (!isAdmin) {
            return await interaction.reply({
                content: 'Você não tem permissão para encerrar esta ação.',
                flags: 64
            });
        }

        if (acao.status === 'encerrada') {
            return await interaction.reply({
                content: 'Esta ação já foi encerrada.',
                flags: 64
            });
        }

        acao.status = 'encerrada';
        await acao.save();

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
                        acao.participantes.reservas,
                        true
                    );

                    await message.edit({
                        embeds: [updatedEmbed],
                        components: []
                    });
                }
            } catch (error) {
                console.error('Erro ao atualizar embed da ação encerrada:', error);
            }
        }

        try {
            const topicChannel = client.channels.cache.get(acao.topic_channel_id);
            if (topicChannel) {
                await topicChannel.delete();
            }
        } catch (error) {
            console.error('Erro ao excluir tópico da ação:', error);
        }

        await interaction.reply({
            content: `Ação "${acao.nome}" foi encerrada com sucesso!`,
            flags: 64
        });
    } catch (error) {
        console.error('Erro ao encerrar ação:', error);
        await interaction.reply({
            content: 'Houve um erro ao encerrar a ação. Por favor, tente novamente.',
            flags: 64
        });
    }
}

module.exports = { handleEncerrarButton };