const { EmbedBuilder } = require("discord.js");
const Acao = require("../models/Acao");

module.exports = async function participarAcao(interaction) {
  const [action, topicId] = interaction.customId.split('_');

  if (action === 'participar') {
    const acao = await Acao.findOne({ acao_id: topicId });
    if (!acao || acao.status !== 'ativa') {
      return interaction.reply({ content: "❌ Ação não está mais ativa.", ephemeral: true });
    }

    if (acao.participantes.aprovados.includes(interaction.user.id)) {
      return interaction.reply({ content: "❌ Você já se inscreveu nesta ação.", ephemeral: true });
    }

    if (acao.participantes.aprovados.length < acao.vagas.total) {
      acao.participantes.aprovados.push(interaction.user.id);
      await acao.save();

      const embed = new EmbedBuilder()
        .setTitle(acao.nome)
        .setDescription("📝 **Detalhes da Ação**")
        .addFields(
          { name: "📅 Data e Hora", value: acao.data, inline: true },
          { name: "📻 Rádio", value: acao.radio, inline: true },
          { name: "🎟️ Vagas", value: `${acao.vagas.total}`, inline: true },
          { name: "📌 Reservas", value: `${acao.vagas.reservas}`, inline: true },
          { name: "✅ Participantes", value: `${acao.participantes.aprovados.join(', ') || 'Nenhum ainda'}`, inline: false }
        )
        .setColor("Blue");

      await interaction.message.edit({ embeds: [embed] });

      return interaction.reply({ content: "✅ Você se inscreveu na ação!", ephemeral: true });
    } else {
      if (acao.participantes.reservas.length < acao.vagas.reservas) {
        acao.participantes.reservas.push(interaction.user.id);
        await acao.save();
        return interaction.reply({ content: "✅ Você foi adicionado à lista de reservas!", ephemeral: true });
      } else {
        return interaction.reply({ content: "❌ O número máximo de participantes e reservas foi atingido.", ephemeral: true });
      }
    }
  }
};
