const { EmbedBuilder } = require('discord.js');
const { addCraftToSheet, getCraftsSummary } = require('./googleSheets');
const messageCache = require('./messageCache');

function validateCraft(craftData) {
    const errors = [];

    if (!craftData.nome || craftData.nome.length === 0) {
        errors.push('O campo Nome não pode estar vazio.');
    }

    if (isNaN(craftData.id)) {
        errors.push('O campo Id deve ser um número inteiro.');
    }

    if (isNaN(craftData.quantidade) || craftData.quantidade <= 0) {
        errors.push('O campo Quantidade deve ser um número inteiro maior que 0.');
    }

    if (!craftData.tipo || craftData.tipo.length === 0) {
        errors.push('O campo Tipo não pode estar vazio.');
    }

    return errors;
}

async function createCraftSummary(interaction) {
    try {
        const recentCrafts = await getCraftsSummary();

        if (recentCrafts.length === 0) {
            await interaction.reply({
                content: 'Não há registros de crafts nas últimas 24 horas.',
                flags: 64
            });
            return;
        }

        const craftsByType = {};
        for (const craft of recentCrafts) {
            const tipo = craft[5] || 'Não especificado';

            if (!craftsByType[tipo]) {
                craftsByType[tipo] = {
                    total: 0,
                    items: []
                };
            }

            craftsByType[tipo].total += parseInt(craft[4]) || 0;
            craftsByType[tipo].items.push({
                nome: craft[2],
                id: craft[3],
                quantidade: parseInt(craft[4]) || 0,
                username: craft[1]
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📊 Resumo de Crafts - Últimas 24 horas')
            .setDescription(`Total de registros: ${recentCrafts.length}`)
            .setTimestamp();

        for (const [tipo, dados] of Object.entries(craftsByType)) {
            let itemsText = dados.items.map(item =>
                `${item.nome} (ID: ${item.id}) - Qtd: ${item.quantidade} por ${item.username}`
            ).join('\n');

            if (itemsText.length > 1000) {
                itemsText = itemsText.substring(0, 997) + '...';
            }

            embed.addFields({ name: `${tipo} - Total: ${dados.total}`, value: itemsText });
        }

        await interaction.reply({ embeds: [embed], flags: 64 });
    } catch (error) {
        console.error('Erro ao criar resumo de crafts:', error);
        await interaction.reply({ content: 'Ocorreu um erro ao obter o resumo de crafts.', flags: 64 });
    }
}

function createHelpEmbed() {
    return new EmbedBuilder()
    .setColor('#0099ff')  // Cor do embed
    .setTitle('📋 Como Registrar um Craft')
    .setDescription('Siga os passos abaixo para registrar um craft no sistema:')
    .addFields(
        {
            name: '1️⃣ Selecione o Tipo de Craft',
            value: 'Primeiro, você precisa escolher o tipo de craft que deseja registrar. O tipo será uma categoria de itens, como armas ou equipamentos.',
            inline: false,
        },
        {
            name: '2️⃣ Preencha o Formulário',
            value: 'Após selecionar o tipo de craft, você deverá preencher as seguintes informações no formulário:',
            inline: false,
        },
        {
            name: '🔹 Nome',
            value: 'Informe o nome do jogador que está registrando o craft, por exemplo, "Player1" ou "JogadorX".',
            inline: true,
        },
        {
            name: '🔹 ID',
            value: 'Informe o seu ID do jogo, por exemplo, 585 ou 25265',
            inline: true,
        },
        {
            name: '🔹 Quantidade',
            value: 'Informe a quantidade de itens relacionados ao craft que está sendo registrado.',
            inline: true,
        },
        {
            name: '🔹 Motivo (Opcional)',
            value: 'Você pode fornecer um motivo para o registro do craft, como a razão de criação ou obtenção do item (este campo é opcional).',
            inline: true,
        },
        {
            name: '⚠️ Importante',
            value: 'Certifique-se de que todos os dados estão corretos antes de enviar o formulário. Após o envio, o craft será registrado no sistema.',
            inline: false,
        }
    )
    .setFooter({
        text: 'Se você tiver dúvidas, entre em contato com o suporte!',
        iconURL: 'https://media.discordapp.net/attachments/1344159826619666463/1344413353962901594/a54335bf-160f-415a-86b5-5394fdd570af-removebg-preview_1.png?ex=67c2cc41&is=67c17ac1&hm=11668bd00e28945eb802f2085b58c584e6038a123a6fae2416748867ee87aa77&=&format=webp&quality=lossless&width=960&height=960',
    })
    .setTimestamp();
}

module.exports = {
    validateCraft,
    createCraftSummary,
    createHelpEmbed
};