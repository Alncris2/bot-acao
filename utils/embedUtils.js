const { EmbedBuilder } = require('discord.js');

function embedUtils(nome, data, radio, vagasTotal, vagasReservas, aprovados, reservas, isClosed = false) {
    let vagasRestantes = vagasTotal - aprovados.length;
    let vagasReservasRestantes = vagasReservas - reservas.length;
    const embed = new EmbedBuilder()
        .setColor(isClosed ? '#808080' : '#00ff04')
        .setTitle("Nova Ação Marcada 🔫")
        .setDescription(`Deseja participar da ação? Clique nos botões abaixo!👇`)
        .addFields(
            { name: "📝 Nome da Ação", value: nome, inline: true },
            { name: "📅 Data e Hora", value: data, inline: true },
            { name: "📻 Rádio", value: radio, inline: true },
        )
        .setTimestamp();

    let approvedText = 'Nenhum participante aprovado.';
    if (aprovados.length > 0) {
        approvedText = aprovados.map((userId, index) => `${index + 1}. <@${userId}>`).join('\n');
    }
    embed.addFields({ name:  `👥(${aprovados.length}) Membros - ${vagasRestantes} Disponíveis`, value: approvedText });

    if (vagasReservas > 0) {
        let reserveText = 'Nenhum participante na reserva.';
        if (reservas.length > 0) {
            reserveText = reservas.map((userId, index) => `${index + 1}. <@${userId}>`).join('\n');
        }
        embed.addFields({ name: `🪑(${reservas.length}) Reservas - ${vagasReservasRestantes} Disponíveis`, value: reserveText });
    }

    embed.setFooter({
        text: isClosed
            ? 'Ação encerrada'
            : 'Clique em "Participar da ação" para se inscrever'
    });

    return embed;
}

module.exports = { createActionEmbed:embedUtils };