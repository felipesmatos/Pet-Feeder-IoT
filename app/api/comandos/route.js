export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongodb';
import { Comando } from '../../../models/IoTData';

// O ESP32 usa o GET para SABER se deve ligar os motores
export async function GET() {
  try {
    await connectToDatabase();
    
    // Busca o status atual dos comandos
    let comandoAtual = await Comando.findOne();
    
    // Se for a primeira vez rodando e não existir comando, cria um padrão (tudo desligado)
    if (!comandoAtual) {
      comandoAtual = await Comando.create({
        alimentando: false,
        hidratando: false,
        quantidade_racao: 0,
        quantidade_agua: 0
      });
    }
    
    return NextResponse.json(comandoAtual);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar comandos' }, { status: 500 });
  }
}

// O Frontend usa o POST quando você CLICA NOS BOTÕES para atualizar o banco
export async function POST(request) {
  try {
    await connectToDatabase();
    const data = await request.json();
    
    // Atualiza o documento de comandos (ou cria se não existir)
    const comandoAtualizado = await Comando.findOneAndUpdate(
      {}, // Filtro vazio para pegar o único documento de comandos
      { ...data, atualizado_em: Date.now() },
      { new: true, upsert: true } // upsert = cria se não achar
    );
    
    return NextResponse.json({ success: true, data: comandoAtualizado });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}