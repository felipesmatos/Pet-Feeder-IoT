'use client';

import { useState, useEffect } from 'react';

export default function PetFeederDashboard() {
  // Estados para armazenar os dados vindos do IoT
  const [telemetria, setTelemetria] = useState({
    agua_liberada: 0,
    agua_consumida: 0,
    racao_liberada: 0,
    racao_consumida: 0,
    nivel_racao_reserva: 0, // em gramas (g)
    nivel_agua_reserva: 0,  // em litros (L)
    ultima_atualizacao: null,
  });

  // Estados para os inputs dos formulários de comando
  const [qtdRacaoInput, setQtdRacaoInput] = useState('');
  const [qtdAguaInput, setQtdAguaInput] = useState('');

  // Estados de feedback visual de envio
  const [statusEnvio, setStatusEnvio] = useState({ tipo: '', mensagem: '' });
  const [loading, setLoading] = useState(false);

  // Definição das capacidades máximas dos reservatórios para o cálculo dos Gauges
  // Altere esses valores de acordo com o tamanho real dos seus depósitos físicos
  const MAX_CAPACIDADE_RACAO = 2000; // Ex: Depósito aguenta até 2000g (2kg)
  const MAX_CAPACIDADE_AGUA = 3.0;   // Ex: Depósito aguenta até 3.0 Litros

  // Função para buscar os dados de telemetria da API
  const buscarTelemetria = async () => {
    try {
      const response = await fetch('/api/telemetria');
      if (response.ok) {
        const dados = await response.json();
        setTelemetria(dados);
      }
    } catch (error) {
      console.error("Erro ao buscar dados de telemetria:", error);
    }
  };

  // Efeito para atualizar a tela automaticamente a cada 4 segundos (Polling)
  useEffect(() => {
    buscarTelemetria(); // Busca imediatamente ao carregar
    const intervalo = setInterval(buscarTelemetria, 4000);
    return () => clearInterval(intervalo);
  }, []);

  // Função para enviar comando de Alimentação
  const handleAlimentar = async (e) => {
    e.preventDefault();
    if (!qtdRacaoInput || Number(qtdRacaoInput) <= 0) {
      mostrarFeedback('erro', 'Insira uma quantidade válida de ração!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/comandos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alimentando: true,
          quantidade_racao: Number(qtdRacaoInput),
          hidratando: false, // garante que não vai ativar a água junto
          quantidade_agua: 0
        }),
      });

      if (response.ok) {
        mostrarFeedback('sucesso', `Comando enviado! Liberando ${qtdRacaoInput}g de ração.`);
        setQtdRacaoInput('');
        
        // Timeout opcional para resetar o estado após o envio (simulando a ação concluída)
        setTimeout(async () => {
          await fetch('/api/comandos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alimentando: false, quantidade_racao: 0 })
          });
        }, 10000); // Reseta a flag após 10 segundos
      } else {
        mostrarFeedback('erro', 'Falha ao enviar comando para o servidor.');
      }
    } catch (error) {
      mostrarFeedback('erro', 'Erro de conexão ao enviar comando.');
    } finally {
      setLoading(false);
    }
  };

  // Função para enviar comando de Hidratação
  const handleHidratar = async (e) => {
    e.preventDefault();
    if (!qtdAguaInput || Number(qtdAguaInput) <= 0) {
      mostrarFeedback('erro', 'Insira uma quantidade válida de água!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/comandos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alimentando: false,
          quantidade_racao: 0,
          hidratando: true,
          quantidade_agua: Number(qtdAguaInput)
        }),
      });

      if (response.ok) {
        mostrarFeedback('sucesso', `Comando enviado! Liberando ${qtdAguaInput}ml de água.`);
        setQtdAguaInput('');

        setTimeout(async () => {
          await fetch('/api/comandos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hidratando: false, quantidade_agua: 0 })
          });
        }, 10000);
      } else {
        mostrarFeedback('erro', 'Falha ao enviar comando para o servidor.');
      }
    } catch (error) {
      mostrarFeedback('erro', 'Erro de conexão ao enviar comando.');
    } finally {
      setLoading(false);
    }
  };

  // Auxiliar para mensagens de status temporárias
  const mostrarFeedback = (tipo, mensagem) => {
    setStatusEnvio({ tipo, mensagem });
    setTimeout(() => setStatusEnvio({ tipo: '', mensagem: '' }), 5000);
  };

  // Cálculos de porcentagem dos reservatórios
  const pctRacao = Math.min(Math.round((telemetria.nivel_racao_reserva / MAX_CAPACIDADE_RACAO) * 100), 100);
  const pctAgua = Math.min(Math.round((telemetria.nivel_agua_reserva / MAX_CAPACIDADE_AGUA) * 100), 100);

  // Determinar altura máxima para escala do gráfico de barras estilizado
  const maxValorGrafico = Math.max(
    telemetria.racao_liberada, telemetria.racao_consumida,
    telemetria.agua_liberada, telemetria.agua_consumida, 10
  );

  const obterAlturaBarra = (valor) => {
    return `${(valor / maxValorGrafico) * 100}%`;
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.titulo}>Dashboard Smart Pet Feeder</h1>
        <p style={styles.subtitulo}>
          Última atualização do IoT: {telemetria.ultima_atualizacao ? new Date(telemetria.ultima_atualizacao).toLocaleTimeString() : 'Aguardando dados...'}
        </p>
      </header>

      {/* Alert de feedback */}
      {statusEnvio.mensagem && (
        <div style={{
          ...styles.alert,
          backgroundColor: statusEnvio.tipo === 'sucesso' ? '#d4edda' : '#f8d7da',
          color: statusEnvio.tipo === 'sucesso' ? '#155724' : '#721c24',
          borderColor: statusEnvio.tipo === 'sucesso' ? '#c3e6cb' : '#f5c6cb'
        }}>
          {statusEnvio.mensagem}
        </div>
      )}

      <main style={styles.gridContainer}>
        
        {/* GAUGES DE NÍVEL DOS RESERVATÓRIOS */}
        <section style={styles.card}>
          <h2 style={styles.cardTitulo}>Níveis dos Reservatórios</h2>
          <div style={styles.flexGauges}>
            
            {/* Gauge Ração */}
            <div style={styles.gaugeContainer}>
              <div style={styles.gaugeOuter}>
                <div style={{ ...styles.gaugeInner, height: `${pctRacao}%`, backgroundColor: '#e6a23c' }}></div>
                <span style={styles.gaugeTexto}>{pctRacao}%</span>
              </div>
              <p style={styles.labelMedidor}>Reserva de Ração</p>
              <span style={styles.subLabelMedidor}>{telemetria.nivel_racao_reserva}g / {MAX_CAPACIDADE_RACAO}g</span>
            </div>

            {/* Gauge Água */}
            <div style={styles.gaugeContainer}>
              <div style={styles.gaugeOuter}>
                <div style={{ ...styles.gaugeInner, height: `${pctAgua}%`, backgroundColor: '#409eff' }}></div>
                <span style={styles.gaugeTexto}>{pctAgua}%</span>
              </div>
              <p style={styles.labelMedidor}>Reserva de Água</p>
              <span style={styles.subLabelMedidor}>{telemetria.nivel_agua_reserva}L / {MAX_CAPACIDADE_AGUA}L</span>
            </div>

          </div>
        </section>

        {/* GRÁFICO DE CONSUMO ATUAL */}
        <section style={styles.card}>
          <h2 style={styles.cardTitulo}>Porções vs Consumo</h2>
          <div style={styles.chartWrapper}>
            
            <div style={styles.chartEixoY}>
              <span>{Math.round(maxValorGrafico)}</span>
              <span>{Math.round(maxValorGrafico / 2)}</span>
              <span>0</span>
            </div>

            <div style={styles.chartArea}>
              {/* Barra Ração Liberada */}
              <div style={styles.colunaGrafico}>
                <div style={{ ...styles.barra, height: obterAlturaBarra(telemetria.racao_liberada), backgroundColor: '#ffc107' }}>
                  <span style={styles.valorBarra}>{telemetria.racao_liberada}g</span>
                </div>
                <span style={styles.labelBarra}>Ração Lib.</span>
              </div>

              {/* Barra Ração Consumida */}
              <div style={styles.colunaGrafico}>
                <div style={{ ...styles.barra, height: obterAlturaBarra(telemetria.racao_consumida), backgroundColor: '#ff9800' }}>
                  <span style={styles.valorBarra}>{telemetria.racao_consumida}g</span>
                </div>
                <span style={styles.labelBarra}>Ração Cons.</span>
              </div>

              {/* Barra Água Liberada */}
              <div style={styles.colunaGrafico}>
                <div style={{ ...styles.barra, height: obterAlturaBarra(telemetria.agua_liberada), backgroundColor: '#a0cfff' }}>
                  <span style={styles.valorBarra}>{telemetria.agua_liberada}ml</span>
                </div>
                <span style={styles.labelBarra}>Água Lib.</span>
              </div>

              {/* Barra Água Consumida */}
              <div style={styles.colunaGrafico}>
                <div style={{ ...styles.barra, height: obterAlturaBarra(telemetria.agua_consumida), backgroundColor: '#2196f3' }}>
                  <span style={styles.valorBarra}>{telemetria.agua_consumida}ml</span>
                </div>
                <span style={styles.labelBarra}>Água Cons.</span>
              </div>
            </div>

          </div>
        </section>

        {/* COMANDOS */}
        <section style={{ ...styles.card, gridColumn: '1 / -1' }}>
          <h2 style={styles.cardTitulo}>Ações de Alimentação Manual</h2>
          <div style={styles.flexComandos}>
            
            {/* Form Alimentar */}
            <form onSubmit={handleAlimentar} style={styles.formAcao}>
              <h3 style={styles.subFormTitulo}>Despejar Ração</h3>
              <div style={styles.inputGroup}>
                <label style={styles.labelInput}>Quantidade prevista (gramas):</label>
                <input 
                  type="number" 
                  min="1"
                  placeholder="Ex: 50" 
                  value={qtdRacaoInput}
                  onChange={(e) => setQtdRacaoInput(e.target.value)}
                  style={styles.input}
                  disabled={loading}
                />
              </div>
              <button type="submit" style={{ ...styles.botao, backgroundColor: '#e6a23c' }} disabled={loading}>
                {loading ? 'Enviando...' : 'Alimentar Pet 🍖'}
              </button>
            </form>

            {/* Form Hidratar */}
            <form onSubmit={handleHidratar} style={styles.formAcao}>
              <h3 style={styles.subFormTitulo}>Despejar Água</h3>
              <div style={styles.inputGroup}>
                <label style={styles.labelInput}>Quantidade prevista (mililitros):</label>
                <input 
                  type="number" 
                  min="1"
                  placeholder="Ex: 150" 
                  value={qtdAguaInput}
                  onChange={(e) => setQtdAguaInput(e.target.value)}
                  style={styles.input}
                  disabled={loading}
                />
              </div>
              <button type="submit" style={{ ...styles.botao, backgroundColor: '#409eff' }} disabled={loading}>
                {loading ? 'Enviando...' : 'Hidratar Pet 💧'}
              </button>
            </form>

          </div>
        </section>

      </main>
    </div>
  );
}

// Objeto de Estilos Inline para garantir layout ndependente de frameworks CSS externos
const styles = {
  container: {
    fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    backgroundColor: '#f4f6f9',
    minHeight: '100vh',
    padding: '24px',
    color: '#333',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
    borderBottom: '2px solid #e2e8f0',
    paddingBottom: '16px',
  },
  titulo: {
    fontSize: '28px',
    color: '#1a202c',
    margin: '0 0 8px 0',
  },
  subtitulo: {
    fontSize: '14px',
    color: '#718096',
    margin: 0,
  },
  alert: {
    padding: '12px 20px',
    borderRadius: '6px',
    marginBottom: '24px',
    border: '1px solid transparent',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
  },
  cardTitulo: {
    fontSize: '18px',
    color: '#2d3748',
    margin: '0 0 20px 0',
    borderLeft: '4px solid #4f46e5',
    paddingLeft: '10px',
  },
  flexGauges: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    flexGrow: 1,
  },
  gaugeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  gaugeOuter: {
    width: '100px',
    height: '150px',
    backgroundColor: '#edf2f7',
    borderRadius: '8px',
    position: 'relative',
    overflow: 'hidden',
    border: '3px solid #cbd5e0',
    display: 'flex',
    alignItems: 'flex-end',
  },
  gaugeInner: {
    width: '100%',
    transition: 'height 0.8s ease-out',
  },
  gaugeTexto: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    top: '45%',
    left: 0,
    fontWeight: 'bold',
    fontSize: '18px',
    color: '#1a202c',
    textShadow: '1px 1px 2px rgba(255,255,255,0.8)',
  },
  labelMedidor: {
    fontWeight: '600',
    fontSize: '15px',
    margin: '12px 0 4px 0',
  },
  subLabelMedidor: {
    fontSize: '12px',
    color: '#718096',
  },
  chartWrapper: {
    display: 'flex',
    height: '200px',
    position: 'relative',
    marginTop: '20px',
    flexGrow: 1,
  },
  chartEixoY: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingRight: '12px',
    color: '#a0aec0',
    fontSize: '12px',
    textAlign: 'right',
    width: '40px',
    borderRight: '2px solid #e2e8f0',
  },
  chartArea: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    width: '100%',
    height: '100%',
    paddingLeft: '10px',
  },
  colunaGrafico: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '20%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barra: {
    width: '100%',
    borderRadius: '4px 4px 0 0',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    transition: 'height 0.5s ease-out',
    position: 'relative',
    minHeight: '4px',
  },
  valorBarra: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#2d3748',
    position: 'absolute',
    top: '-20px',
    whiteSpace: 'nowrap',
  },
  labelBarra: {
    fontSize: '11px',
    color: '#718096',
    marginTop: '8px',
    textAlign: 'center',
  },
  flexComandos: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  formAcao: {
    flex: '1 1 300px',
    backgroundColor: '#f8fafc',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
  },
  subFormTitulo: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    color: '#4a5568',
  },
  inputGroup: {
    marginBottom: '16px',
  },
  labelInput: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: '6px',
    color: '#4a5568',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e0',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  botao: {
    color: '#ffffff',
    border: 'none',
    padding: '12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '15px',
    transition: 'opacity 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  }
};