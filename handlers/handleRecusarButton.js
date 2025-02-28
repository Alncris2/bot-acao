const Acao = require('../models/Acao');

async function handleRecusarButton(interaction, client) {
    try {
        const [_, acaoId, userId] = interaction.customId.split('_');

        const acao = await Acao.findOne({ acao_id: acaoId });

        if (!acao) {
            return await interaction.reply({
                content: 'Ação não encontrada.',
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

        acao.solicitacoes[solicitationIndex].status = 'recusado';
        await acao.save();

        try {
            await interaction.message.edit({
                content: `<@${userId}> foi **RECUSADO** para a ação "${acao.nome}" por <@${interaction.user.id}>`,
                components: []
            });
        } catch (error) {
            console.error('Erro ao editar mensagem de solicitação:', error);
        }

        try {
            const user = await client.users.fetch(userId);
            await user.send(`Sua solicitação para participar da ação "${acao.nome}" foi **RECUSADA**.`);
        } catch (error) {
            console.error('Erro ao notificar usuário sobre recusa:', error);
        }

        await interaction.reply({
            content: `Solicitação do usuário <@${userId}> para a ação "${acao.nome}" foi recusada.`,
            flags: 64
        });
    } catch (error) {
        console.error('Erro ao recusar solicitação:', error);
        await interaction.reply({
            content: 'Houve um erro ao recusar a solicitação. Por favor, tente novamente.',
            flags: 64
        });
    }
}

module.exports = { handleRecusarButton };