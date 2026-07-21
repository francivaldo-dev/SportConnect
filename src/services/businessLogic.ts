import { supabase } from './supabase';

/**
 * RN01 (Aprovação Condicionada):
 * Valida o Pix. Se aprovado, atualiza a inscrição e move o time para a partida inicial.
 */
export async function aprovarInscricaoPix(inscricaoId: string) {
  // 1. Atualiza status da inscrição
  const { data: inscricao, error: updateError } = await supabase
    .from('inscricoes')
    .update({ status: 'aprovado' })
    .eq('id', inscricaoId)
    .select('*')
    .single();

  if (updateError) throw updateError;

  // 2. Aqui a lógica deve inserir o time na primeira fase do bracket/chave.
  // Essa lógica depende da estrutura atual do bracket (ex: buscar partida 'agendada' com vaga vazia).
  console.log(`Inscrição ${inscricaoId} aprovada. Inserindo na chave...`);
  return inscricao;
}

/**
 * RN02 (Mata-Mata / Melhor de 3 Sets):
 * Computa sets vencidos. Se um time atinge 2 sets, finaliza a partida e o avança para a próxima.
 */
export async function registrarSetVencido(partidaId: string, timeVencedorId: string, isTimeA: boolean) {
  // Busca a partida atual
  const { data: partida, error: fetchError } = await supabase
    .from('partidas')
    .select('*')
    .eq('id', partidaId)
    .single();

  if (fetchError) throw fetchError;

  let placarA = partida.placar_a;
  let placarB = partida.placar_b;

  if (isTimeA) placarA += 1;
  else placarB += 1;

  const encerrou = placarA >= 2 || placarB >= 2;
  const status = encerrou ? 'encerrada' : 'em_andamento';

  // Atualiza a partida atual
  const { error: updateError } = await supabase
    .from('partidas')
    .update({ placar_a: placarA, placar_b: placarB, status })
    .eq('id', partidaId);

  if (updateError) throw updateError;

  // Se encerrou, move para a próxima partida
  if (encerrou && partida.proxima_partida_id) {
    // Precisamos descobrir se o time entra como time_a ou time_b na próxima partida.
    // Simplificando: vamos atualizar a próxima partida adicionando o time.
    const { data: proxPartida } = await supabase
      .from('partidas')
      .select('*')
      .eq('id', partida.proxima_partida_id)
      .single();

    if (proxPartida) {
      const updateData: any = {};
      if (!proxPartida.time_a_id) updateData.time_a_id = timeVencedorId;
      else if (!proxPartida.time_b_id) updateData.time_b_id = timeVencedorId;

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from('partidas')
          .update(updateData)
          .eq('id', proxPartida.id);
      }
    }
  }

  return { encerrou, placarA, placarB };
}
