import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';

export function RankingScreen() {
  const [times, setTimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('Futebol');

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    try {
      setLoading(true);
      // Para o MVP, buscamos os times reais e simulamos a pontuação baseada em algum critério
      // No futuro, teríamos uma tabela específica de "ranking" ou "pontuacao_total".
      const { data, error } = await supabase
        .from('times')
        .select('*');

      if (error) throw error;
      
      // Simulando uma ordenação de pontos para a interface
      const timesComPontos = (data || []).map((t, index) => ({
        ...t,
        pontos: 1500 - (index * 150) // Mock progressivo
      }));

      setTimes(timesComPontos.sort((a, b) => b.pontos - a.pontos));
    } catch (error) {
      console.error("Erro ao buscar ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderPodio = () => {
    if (times.length < 3) return null;

    return (
      <View className="flex-row items-end justify-center h-48 mb-6 mt-4">
        {/* 2º Lugar */}
        <View className="items-center mx-2">
          <View className="bg-gray-300 dark:bg-[#C0C0C0] p-1 rounded-full mb-2">
            <Ionicons name="person-circle" size={48} color="#1A1A1A" />
          </View>
          <Text className="text-gray-900 dark:text-white font-bold text-xs w-20 text-center" numberOfLines={1}>{times[1].nome}</Text>
          <Text className="text-gray-600 dark:text-[#C0C0C0] font-black">{times[1].pontos} pts</Text>
          <View className="w-20 h-24 bg-gray-200 dark:bg-[#1A1A1A] border-t-2 border-gray-400 dark:border-[#C0C0C0] items-center justify-start pt-2 mt-2">
            <Text className="text-gray-600 dark:text-[#C0C0C0] font-black text-2xl">2</Text>
          </View>
        </View>

        {/* 1º Lugar */}
        <View className="items-center mx-2">
          <Ionicons name="trophy" size={32} color="#FFD700" className="mb-1" />
          <View className="bg-[#FFD700] p-1 rounded-full mb-2">
            <Ionicons name="person-circle" size={56} color="#1A1A1A" />
          </View>
          <Text className="text-gray-900 dark:text-white font-bold text-sm w-20 text-center" numberOfLines={1}>{times[0].nome}</Text>
          <Text className="text-yellow-600 dark:text-[#FFD700] font-black">{times[0].pontos} pts</Text>
          <View className="w-24 h-32 bg-gray-100 dark:bg-[#1A1A1A] border-t-2 border-[#FFD700] items-center justify-start pt-2 mt-2">
            <Text className="text-yellow-600 dark:text-[#FFD700] font-black text-3xl">1</Text>
          </View>
        </View>

        {/* 3º Lugar */}
        <View className="items-center mx-2">
          <View className="bg-[#CD7F32] p-1 rounded-full mb-2">
            <Ionicons name="person-circle" size={40} color="#1A1A1A" />
          </View>
          <Text className="text-gray-900 dark:text-white font-bold text-xs w-20 text-center" numberOfLines={1}>{times[2].nome}</Text>
          <Text className="text-amber-700 dark:text-[#CD7F32] font-black">{times[2].pontos} pts</Text>
          <View className="w-20 h-16 bg-gray-200 dark:bg-[#1A1A1A] border-t-2 border-[#CD7F32] items-center justify-start pt-2 mt-2">
            <Text className="text-amber-700 dark:text-[#CD7F32] font-black text-xl">3</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-[#121212]">
      <View className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-[#1A1A1A]">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Ranking Global</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-sm">Acompanhe as maiores lendas da comunidade local.</Text>
      </View>

      {/* Chips de Modalidade */}
      <View className="flex-row px-6 py-4">
        <TouchableOpacity 
          onPress={() => setFiltro('Futebol')}
          className={`px-4 py-2 rounded-full mr-3 border ${filtro === 'Futebol' ? 'bg-[#005BBB] border-[#005BBB] dark:bg-[#82A0D8] dark:border-[#82A0D8]' : 'border-gray-300 dark:border-[#333] bg-white dark:bg-transparent shadow-sm'}`}
        >
          <Text className={filtro === 'Futebol' ? 'text-white dark:text-[#121212] font-bold' : 'text-gray-600 dark:text-gray-400'}>Futebol</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setFiltro('Basquete')}
          className={`px-4 py-2 rounded-full border ${filtro === 'Basquete' ? 'bg-[#005BBB] border-[#005BBB] dark:bg-[#82A0D8] dark:border-[#82A0D8]' : 'border-gray-300 dark:border-[#333] bg-white dark:bg-transparent shadow-sm'}`}
        >
          <Text className={filtro === 'Basquete' ? 'text-white dark:text-[#121212] font-bold' : 'text-gray-600 dark:text-gray-400'}>Basquete</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#FFD700" className="mt-10" />
        ) : times.length < 3 ? (
          <View className="items-center mt-10 px-6">
            <Ionicons name="sad-outline" size={48} color="#888" />
            <Text className="text-gray-400 mt-4 text-center">Para ver o ranking, é preciso que haja pelo menos 3 times cadastrados no banco de dados.</Text>
          </View>
        ) : (
          <>
            {renderPodio()}
            
            <View className="px-6 mt-4">
              <Text className="text-gray-400 dark:text-gray-500 font-bold mb-4">RESTANTE DO RANKING</Text>
              
              {times.slice(3).map((time, index) => (
                <View key={time.id} className="flex-row items-center bg-white dark:bg-[#1A1A1A] p-4 rounded-xl border border-gray-200 dark:border-[#2A2A2A] mb-3 shadow-sm">
                  <Text className="text-gray-400 dark:text-gray-500 font-black w-8 text-lg">{index + 4}</Text>
                  <Ionicons name="shield-half-outline" size={32} color="#888" className="mr-3" />
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white font-bold">{time.nome}</Text>
                    <Text className="text-gray-500 text-xs">{time.categoria}</Text>
                  </View>
                  <Text className="text-[#005BBB] dark:text-[#82A0D8] font-black">{time.pontos} pts</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
