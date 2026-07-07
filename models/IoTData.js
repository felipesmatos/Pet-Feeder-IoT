import mongoose from 'mongoose';

// Molde para a Telemetria (Dados dos sensores)
const TelemetriaSchema = new mongoose.Schema({
  agua_liberada: Number,
  agua_consumida: Number,
  racao_liberada: Number,
  racao_consumida: Number,
  nivel_racao_reserva: Number,
  nivel_agua_reserva: Number,
  data_hora: { type: Date, default: Date.now }
});

// Molde para os Comandos (Botões da interface)
const ComandoSchema = new mongoose.Schema({
  alimentando: { type: Boolean, default: false },
  hidratando: { type: Boolean, default: false },
  quantidade_racao: { type: Number, default: 0 },
  quantidade_agua: { type: Number, default: 0 },
  atualizado_em: { type: Date, default: Date.now }
});

// Impede que o Next.js tente recriar os modelos toda vez que a página recarregar
export const Telemetria = mongoose.models.Telemetria || mongoose.model('Telemetria', TelemetriaSchema);
export const Comando = mongoose.models.Comando || mongoose.model('Comando', ComandoSchema);