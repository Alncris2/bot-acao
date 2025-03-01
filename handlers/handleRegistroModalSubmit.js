const { addCraftToSheet } = require('../utils/googleSheets');
const { validateCraft } = require('../utils/craftProcessor');
const messageCache=require("../utils/messageCache")

async function handleRegistroModalSubmit(interaction, client) {
    try {
        const customId = interaction.customId;

        const craftData = {
            nome: interaction.fields.getTextInputValue('nome').trim(),
            id: parseInt(interaction.fields.getTextInputValue('id').trim(), 10),
            quantidade: parseInt(interaction.fields.getTextInputValue('quantidade').trim(), 10),
            tipo: customId.split(':')[1],
            motivo: interaction.fields.getTextInputValue('motivo')?.trim() || '-'
        }

        const validationErrors = await validateCraft(craftData);
        if (validationErrors.length > 0) {
            const reply = await interaction.reply({
                content: `⚠️ **Atenção**: Sua mensagem contém os seguintes erros:\n` +
                    validationErrors.map(err => `- ${err}`).join('\n') +
                    '\n\nPor favor, corrija e envie novamente seguindo o formato:' +
                    '\n```\nNome: <texto>\nId: <número>\nQuantidade: <número>\nTipo: <texto>\nMotivo: <texto> (opcional)\n```',
                flags: 64
            });

            return false;
        }

        craftData.username = interaction.user.username;

        await addCraftToSheet(craftData);

        await interaction.reply({
            content: `✅ Craft registrado com sucesso!\n**Nome:** ${craftData.nome}\n**ID:** ${craftData.id}\n**Quantidade:** ${craftData.quantidade}\n**Tipo:** ${craftData.tipo}\n**Motivo:** ${craftData.motivo}`,
            flags: 64
        });

    } catch (error) {
        console.error('Erro ao processar registro de craft:', error);
        await interaction.reply({
            content: '❌ Ocorreu um erro ao registrar o craft. Tente novamente.',
            flags: 64
        });
    }
};

module.exports = { handleRegistroModalSubmit };
