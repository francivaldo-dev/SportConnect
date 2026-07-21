import { supabase } from './supabase';

export const generateBracket = async (torneioId: string) => {
  // 1. Fetch approved inscriptions
  const { data: inscricoes, error: inscError } = await supabase
    .from('inscricoes')
    .select('time_id')
    .eq('torneio_id', torneioId)
    .eq('status', 'aprovado');

  if (inscError || !inscricoes) {
    throw new Error('Erro ao buscar inscrições.');
  }

  const times = inscricoes.map(i => i.time_id);
  
  if (times.length !== 2 && times.length !== 4 && times.length !== 8 && times.length !== 16) {
    throw new Error(`Número de times aprovados (${times.length}) não é suportado. Deve ser 2, 4, 8 ou 16.`);
  }

  // Verificar se já existe chaveamento
  const { data: existingMatches } = await supabase
    .from('partidas')
    .select('id')
    .eq('torneio_id', torneioId)
    .limit(1);

  if (existingMatches && existingMatches.length > 0) {
    throw new Error('O chaveamento já foi gerado para este torneio.');
  }

  // Shuffle times randomly
  const shuffledTeams = [...times].sort(() => Math.random() - 0.5);

  const numTeams = shuffledTeams.length;
  let currentPhaseMatches: any[] = [];
  let nextPhaseMatches: any[] = [];
  
  // Nomenclatura das fases baseada no número de times na rodada atual
  const getPhaseName = (tCount: number) => {
    if (tCount === 16) return 'Oitavas de Final';
    if (tCount === 8) return 'Quartas de Final';
    if (tCount === 4) return 'Semifinal';
    return 'Final';
  };

  // Algoritmo de arvore simplificado: 
  // Em vez de criar todas as partidas e linkar com proxima_partida_id (o que requer múltiplas inserções dependentes),
  // No MVP vamos criar apenas a rodada inicial completa.
  // E uma função advanceTeam cuidará de criar as próximas rodadas sob demanda.
  
  const phaseName = getPhaseName(numTeams);
  
  for (let i = 0; i < shuffledTeams.length; i += 2) {
    currentPhaseMatches.push({
      torneio_id: torneioId,
      time_a_id: shuffledTeams[i],
      time_b_id: shuffledTeams[i+1],
      fase_torneio: phaseName,
      status: 'agendada'
    });
  }

  const { error: insertError } = await supabase
    .from('partidas')
    .insert(currentPhaseMatches);

  if (insertError) {
    throw new Error(`Erro ao inserir partidas: ${insertError.message}`);
  }

  return true;
};

export const advanceTeam = async (partidaId: string, vencedorId: string) => {
  // 1. Atualizar a partida atual como finalizada
  const { data: currentMatch, error: fetchErr } = await supabase
    .from('partidas')
    .select('*')
    .eq('id', partidaId)
    .single();

  if (fetchErr || !currentMatch) throw new Error('Partida não encontrada');

  await supabase
    .from('partidas')
    .update({ status: 'finalizada' })
    .eq('id', partidaId);

  // Se for final, não tem pra onde avançar
  if (currentMatch.fase_torneio === 'Final') {
    return { finished: true };
  }

  // 2. Descobrir a proxima fase
  let nextPhase = 'Final';
  if (currentMatch.fase_torneio === 'Oitavas de Final') nextPhase = 'Quartas de Final';
  if (currentMatch.fase_torneio === 'Quartas de Final') nextPhase = 'Semifinal';

  // 3. Procurar se já existe uma partida aberta nesta proxima fase aguardando um time (com time_a null ou time_b null)
  const { data: pendingMatches, error: pendingErr } = await supabase
    .from('partidas')
    .select('*')
    .eq('torneio_id', currentMatch.torneio_id)
    .eq('fase_torneio', nextPhase)
    .or('time_a_id.is.null,time_b_id.is.null')
    .limit(1);

  if (pendingMatches && pendingMatches.length > 0) {
    const nextMatch = pendingMatches[0];
    // Se o time_a estiver vazio, preenche, senão preenche o time_b
    if (!nextMatch.time_a_id) {
      await supabase.from('partidas').update({ time_a_id: vencedorId }).eq('id', nextMatch.id);
    } else {
      await supabase.from('partidas').update({ time_b_id: vencedorId }).eq('id', nextMatch.id);
    }
  } else {
    // Se não encontrou, cria uma nova partida nesta fase com o time A preenchido
    await supabase.from('partidas').insert({
      torneio_id: currentMatch.torneio_id,
      time_a_id: vencedorId,
      fase_torneio: nextPhase,
      status: 'agendada'
    });
  }

  return { advanced: true };
};
