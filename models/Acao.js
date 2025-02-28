const mongoose = require('mongoose');

const AcaoSchema = new mongoose.Schema({
  acao_id: { type: String, required: true, unique: true },
  nome: { type: String, required: true },
  data: { type: String, required: true },
  radio: { type: String, required: true },
  vagas: {
    total: { type: Number, required: true },
    reservas: { type: Number, required: true } 
  },
  participantes: { aprovados: [String], reservas: [String] },
  solicitacoes: [{
    user_id: String,
    status: { type: String,
      enum: ['pendente', 'aprovado', 'reserva', 'recusado'],
      default: 'pendente'
    },
    mensagem_id: String
  }],
  status: { type: String,
    enum: ['ativa', 'encerrada'],
    default: 'ativa'
  },
  embed_message_id: String,
  topic_channel_id: String,
  guild_id: String,
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Acao', AcaoSchema);