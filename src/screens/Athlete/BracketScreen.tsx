import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';

export function BracketScreen({ route, navigation }: any) {
  const { torneioId } = route.params;
  const [partidas, setPartidas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartidas();

    // Inscrever-se para escutar mudanças na tabela partidas via Realtime (WebSockets)
    const subscription = supabase
      .channel('partidas_realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Escutar INSERT, UPDATE e DELETE
          schema: 'public',
          table: 'partidas',
          filter: `torneio_id=eq.${torneioId}`
        },
        (payload) => {
          console.log('Mudança recebida em Realtime:', payload);
          // Refazer fetch para trazer nomes dos times junto ou atualizar estado localmente
          fetchPartidas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchPartidas = async () => {
    try {
      // Buscar partidas e realizar um join com a tabela 'times' para pegar os nomes
      const { data, error } = await supabase
        .from('partidas')
        .select(`
          *,
          timeA:time_a_id(nome),
          timeB:time_b_id(nome)
        `)
        .eq('torneio_id', torneioId)
        .order('fase_torneio', { ascending: false });

      if (error) throw error;
      setPartidas(data || []);
    } catch (error) {
      console.error("Erro ao buscar partidas:", error);
    } finally {
      setLoading(false);
    }
  };

  // Agrupar partidas por fase
  const agruparPorFase = () => {
    const fases = {
      'Quartas': partidas.filter(p => p.fase_torneio === 'Quartas'),
      'Semifinal': partidas.filter(p => p.fase_torneio === 'Semifinal'),
      'Final': partidas.filter(p => p.fase_torneio === 'Final')
    };
    return fases;
  };

  const renderMatchCard = (match: any) => {
    const isFinished = match.status === 'encerrada';
    const isLive = match.status === 'em_andamento';

    return (
      <View key={match.id} className="bg-[#1A1A1A] w-64 rounded-xl border border-[#2A2A2A] mb-4 overflow-hidden">
        {/* Status Header */}
        <View className={`px-3 py-1 flex-row justify-between items-center ${isLive ? 'bg-[#FF7A00]/20' : 'bg-[#121212]'}`}>
          <Text className={`text-xs font-bold ${isLive ? 'text-[#FF7A00]' : 'text-gray-500'}`}>
            {isLive ? 'AO VIVO' : isFinished ? 'ENCERRADO' : 'AGENDADO'}
          </Text>
          <Text className="text-gray-600 text-[10px]">{match.id.substring(0, 5)}</Text>
        </View>

        {/* Times e Placares */}
        <View className="p-3">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-white font-semibold flex-1" numberOfLines={1}>
              {match.timeA?.nome || 'A Definir'}
            </Text>
            <Text className={`text-lg font-black ml-2 ${match.placar_a > match.placar_b && isFinished ? 'text-[#FFD700]' : 'text-gray-400'}`}>
              {match.placar_a}
            </Text>
          </View>
          
          <View className="flex-row justify-between items-center">
            <Text className="text-white font-semibold flex-1" numberOfLines={1}>
              {match.timeB?.nome || 'A Definir'}
            </Text>
            <Text className={`text-lg font-black ml-2 ${match.placar_b > match.placar_a && isFinished ? 'text-[#FFD700]' : 'text-gray-400'}`}>
              {match.placar_b}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#121212] justify-center items-center">
        <ActivityIndicator size="large" color="#FFD700" />
      </SafeAreaView>
    );
  }

  const fases = agruparPorFase();

  return (
    <SafeAreaView className="flex-1 bg-[#121212]">
      {/* Header Fixo */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-[#1A1A1A]">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#888" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Chaveamento Realtime</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
          <Text className="text-green-500 text-xs font-bold">CONECTADO</Text>
        </View>
      </View>

      <ScrollView horizontal className="flex-1" contentContainerStyle={{ padding: 24 }}>
        
        {/* Quartas de Final */}
        <View className="mr-10 justify-around">
          <Text className="text-gray-500 font-bold mb-6 text-center tracking-widest">QUARTAS</Text>
          {fases['Quartas'].length > 0 ? (
            fases['Quartas'].map(renderMatchCard)
          ) : (
             <Text className="text-gray-600 text-center mt-10">Sem partidas geradas</Text>
          )}
        </View>

        {/* Semifinais */}
        <View className="mr-10 justify-around">
          <Text className="text-gray-500 font-bold mb-6 text-center tracking-widest">SEMIFINAL</Text>
          {fases['Semifinal'].length > 0 ? (
            fases['Semifinal'].map(renderMatchCard)
          ) : (
            <View className="flex-1 justify-center opacity-30">
              <Text className="text-gray-600 text-center">Aguardando resultados</Text>
            </View>
          )}
        </View>

        {/* Final */}
        <View className="justify-around">
          <Text className="text-[#FFD700] font-bold mb-6 text-center tracking-widest">FINAL</Text>
          {fases['Final'].length > 0 ? (
            fases['Final'].map(renderMatchCard)
          ) : (
            <View className="flex-1 justify-center items-center opacity-30">
              <Ionicons name="trophy-outline" size={48} color="#888" />
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
