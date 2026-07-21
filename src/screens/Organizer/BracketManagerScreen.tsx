import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { supabase } from '../../services/supabase';
import { AuthContext } from '../../contexts/AuthContext';
import { generateBracket, advanceTeam } from '../../services/bracketEngine';

export function BracketManagerScreen() {
  const { user } = useContext(AuthContext);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [torneios, setTorneios] = useState<any[]>([]);
  const [selectedTorneio, setSelectedTorneio] = useState<string | null>(null);
  const [partidas, setPartidas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchTorneios();
  }, [user]);

  useEffect(() => {
    if (selectedTorneio) {
      fetchPartidas(selectedTorneio);
    } else {
      setPartidas([]);
    }
  }, [selectedTorneio]);

  const fetchTorneios = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('torneios')
      .select('*')
      .eq('organizador_id', user.id);
    
    if (data && data.length > 0) {
      setTorneios(data);
      setSelectedTorneio(data[0].id);
    }
    setLoading(false);
  };

  const fetchPartidas = async (torneioId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('partidas')
      .select(`
        *,
        timeA:times!time_a_id(nome),
        timeB:times!time_b_id(nome)
      `)
      .eq('torneio_id', torneioId)
      .order('created_at', { ascending: true });
    
    if (!error && data) {
      setPartidas(data);
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!selectedTorneio) return;
    
    Alert.alert(
      "Gerar Chaveamento",
      "Isso fechará as inscrições e criará a primeira rodada. Apenas times Aprovados entrarão na chave. Continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Gerar", 
          onPress: async () => {
            try {
              setGenerating(true);
              await generateBracket(selectedTorneio);
              await fetchPartidas(selectedTorneio);
              Alert.alert("Sucesso", "Chaveamento gerado com sucesso!");
            } catch (e: any) {
              Alert.alert("Erro", e.message);
            } finally {
              setGenerating(false);
            }
          }
        }
      ]
    );
  };

  const handleAdvance = async (partidaId: string, vencedorId: string, nomeVencedor: string) => {
    Alert.alert(
      "Declarar Vencedor",
      `Tem certeza que ${nomeVencedor} venceu esta partida? Ele avançará para a próxima fase.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar", 
          onPress: async () => {
            try {
              setLoading(true);
              await advanceTeam(partidaId, vencedorId);
              await fetchPartidas(selectedTorneio!);
              Alert.alert("Sucesso", "Time avançou na chave!");
            } catch (e: any) {
              Alert.alert("Erro", e.message);
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-[#121212]">
      <View className="flex-row items-center px-6 py-4 border-b border-gray-200 dark:border-[#1A1A1A]">
        <Text className="text-[#005BBB] dark:text-[#82A0D8] text-xl font-bold tracking-wider">Gestão de Chaves</Text>
      </View>

      <View className="px-4 py-3 bg-white dark:bg-[#1A1A1A] border-b border-gray-200 dark:border-[#2A2A2A]">
        <Text className="text-xs font-bold text-gray-500 uppercase mb-2">Selecione o Torneio</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {torneios.map(t => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setSelectedTorneio(t.id)}
              className={`mr-3 px-4 py-2 rounded-full border ${
                selectedTorneio === t.id 
                  ? 'bg-[#005BBB] dark:bg-[#82A0D8] border-[#005BBB] dark:border-[#82A0D8]' 
                  : 'bg-transparent border-gray-300 dark:border-gray-700'
              }`}
            >
              <Text className={`font-bold ${selectedTorneio === t.id ? 'text-white dark:text-[#121212]' : 'text-gray-700 dark:text-gray-300'}`}>
                {t.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 p-4">
        {loading ? (
          <ActivityIndicator size="large" color="#005BBB" className="mt-10" />
        ) : !selectedTorneio ? (
          <Text className="text-center text-gray-500 mt-10">Crie um torneio primeiro.</Text>
        ) : partidas.length === 0 ? (
          <View className="items-center mt-10 bg-white dark:bg-[#1A1A1A] p-6 rounded-xl border border-gray-200 dark:border-[#2A2A2A]">
            <Ionicons name="git-network-outline" size={48} color="#888" />
            <Text className="text-gray-900 dark:text-white font-bold text-lg mt-4 text-center">
              Gerar Chaveamento para:
            </Text>
            <Text className="text-[#005BBB] dark:text-[#82A0D8] font-black text-xl mb-2 text-center">
              {torneios.find(t => t.id === selectedTorneio)?.nome}
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center">Para gerar a chave, certifique-se de que existem 2, 4, 8 ou 16 times com inscrição Aprovada na aba de inscrições.</Text>
            
            <TouchableOpacity 
              className="bg-[#005BBB] dark:bg-[#82A0D8] px-6 py-3 rounded-xl mt-6 flex-row items-center shadow-sm"
              onPress={handleGenerate}
              disabled={generating}
            >
              {generating ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="play" size={20} color={isDark ? "#121212" : "#fff"} />
                  <Text className="text-white dark:text-[#121212] font-bold ml-2">Gerar Chaveamento</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-4">
            {partidas.map((p) => {
              const isFinished = p.status === 'finalizada';
              const teamAName = p.timeA?.nome || 'Aguardando...';
              const teamBName = p.timeB?.nome || 'Aguardando...';

              return (
                <View key={p.id} className="bg-white dark:bg-[#1A1A1A] rounded-xl p-4 border border-gray-200 dark:border-[#2A2A2A] shadow-sm mb-4">
                  <View className="flex-row justify-between mb-3">
                    <Text className="text-[#005BBB] dark:text-[#82A0D8] font-black uppercase text-xs tracking-wider">{p.fase_torneio}</Text>
                    {isFinished ? (
                      <View className="bg-green-100 dark:bg-green-900/30 px-2 rounded">
                        <Text className="text-green-700 dark:text-green-400 text-[10px] font-bold uppercase">Finalizada</Text>
                      </View>
                    ) : (
                      <View className="bg-amber-100 dark:bg-amber-900/30 px-2 rounded">
                        <Text className="text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase">Aberta</Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row items-center justify-between py-2">
                    <Text className="text-gray-900 dark:text-white font-bold flex-1">{teamAName}</Text>
                    <Text className="font-black text-gray-400 mx-2">VS</Text>
                    <Text className="text-gray-900 dark:text-white font-bold flex-1 text-right">{teamBName}</Text>
                  </View>

                  {!isFinished && p.time_a_id && p.time_b_id && (
                    <View className="flex-row justify-between mt-4 border-t border-gray-100 dark:border-[#333] pt-4 space-x-2">
                      <TouchableOpacity 
                        onPress={() => handleAdvance(p.id, p.time_a_id, teamAName)}
                        className="flex-1 bg-gray-100 dark:bg-[#2A2A2A] py-2 rounded items-center"
                      >
                        <Text className="text-gray-800 dark:text-white font-bold text-xs text-center">🏆 Vencedor: {teamAName}</Text>
                      </TouchableOpacity>
                      <View className="w-2" />
                      <TouchableOpacity 
                        onPress={() => handleAdvance(p.id, p.time_b_id, teamBName)}
                        className="flex-1 bg-gray-100 dark:bg-[#2A2A2A] py-2 rounded items-center"
                      >
                        <Text className="text-gray-800 dark:text-white font-bold text-xs text-center">🏆 Vencedor: {teamBName}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}
