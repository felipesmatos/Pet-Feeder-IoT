export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongodb';
import { Telemetria } from '../../../models/IoTData';

// O ESP32 usa o POST para SALVAR os dados no banco
export async function POST(request) {
  try {
    await connectToDatabase();
    const data = await request.json();
    
    // Cria um novo registro no banco com os dados recebidos
    const novaTelemetria = await Telemetria.create(data);
    
    return NextResponse.json({ success: true, data: novaTelemetria });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// O Frontend (Seu site) usa o GET para LER os dados mais recentes do banco
export async function GET() {
  try {
    await connectToDatabase();
    
    // Busca no banco apenas o último registro salvo (ordenado por data decrescente)
    const ultimaTelemetria = await Telemetria.findOne().sort({ data_hora: -1 });
    
    // Se não tiver nada no banco ainda, retorna um objeto vazio
    return NextResponse.json(ultimaTelemetria || {});
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}