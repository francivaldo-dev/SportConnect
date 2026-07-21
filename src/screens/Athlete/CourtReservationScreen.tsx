import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';

export function CourtReservationScreen() {
  const [quadras, setQuadras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pessoasDivisao, setPessoasDivisao] = useState('10');
  const [quadraSelecionada, setQuadraSelecionada] = useState<any>(null);

  useEffect(() => {
    fetchQuadras();
  }, []);

  const fetchQuadras = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quadras')
        .select('*');

      if (error) throw error;
      setQuadras(data || []);
    } catch (error) {
      console.error("Erro ao buscar quadras:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReserva = async () => {
    if (!quadraSelecionada) return;

    Alert.alert(
      'Confirmar Reserva',
      `Deseja solicitar reserva da ${quadraSelecionada.nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: () => {
            Alert.alert('Sucesso', 'Solicitação de reserva enviada para aprovação.');
            setQuadraSelecionada(null);
          }
        }
      ]
    );
  };

  const getValorPorPessoa = (valorHora: number) => {
    const num = parseInt(pessoasDivisao) || 1;
    return (valorHora / num).toFixed(2);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-[#121212]">
      <View className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-[#1A1A1A]">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Locação de Quadras</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-sm">Alugue os melhores espaços e já calcule a divisão (o famoso "rachão").</Text>
      </View>

      <ScrollView className="flex-1 p-6">
        
        {/* Calculadora de Rachão Fixo */}
        <View className="bg-white dark:bg-[#1A1A1A] rounded-xl p-5 border border-gray-200 dark:border-[#2A2A2A] mb-8 shadow-sm">
          <View className="flex-row items-center mb-4">
            <Ionicons name="calculator-outline" size={24} color="#005BBB" className="dark:text-[#82A0D8]" />
            <Text className="text-gray-900 dark:text-white font-bold ml-2 text-lg">Calculadora de Divisão</Text>
          </View>
          <Text className="text-gray-500 dark:text-gray-400 mb-2">Quantas pessoas vão jogar?</Text>
          <View className="flex-row items-center bg-gray-50 dark:bg-[#121212] rounded-lg border border-gray-300 dark:border-[#333] px-4 py-2">
            <Ionicons name="people-outline" size={20} color="#888" className="mr-3" />
            <TextInput 
              value={pessoasDivisao}
              onChangeText={setPessoasDivisao}
              keyboardType="number-pad"
              className="flex-1 text-gray-900 dark:text-white text-lg font-bold"
              maxLength={2}
            />
          </View>
        </View>

        <Text className="text-gray-900 dark:text-white font-bold text-xl mb-4">Quadras Disponíveis</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#005BBB" className="mt-10" />
        ) : quadras.length === 0 ? (
          <View className="items-center mt-10 bg-white dark:bg-[#1A1A1A] p-6 rounded-xl border border-gray-200 dark:border-[#2A2A2A] shadow-sm">
            <Ionicons name="tennisball-outline" size={48} color="#888" />
            <Text className="text-gray-500 dark:text-gray-400 mt-4 text-center">Nenhuma quadra cadastrada no sistema. O Administrador precisa cadastrá-las no Supabase.</Text>
          </View>
        ) : (
          quadras.map(quadra => (
            <TouchableOpacity 
              key={quadra.id}
              onPress={() => setQuadraSelecionada(quadra)}
              className={`bg-white dark:bg-[#1A1A1A] rounded-xl border ${quadraSelecionada?.id === quadra.id ? 'border-[#005BBB] dark:border-[#FFD700]' : 'border-gray-200 dark:border-[#2A2A2A]'} p-4 mb-4 shadow-sm`}
            >
              <View className="flex-row justify-between items-start mb-2">
                <View>
                  <Text className="text-gray-900 dark:text-white font-bold text-lg">{quadra.nome}</Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-sm">{quadra.localizacao}</Text>
                </View>
                <View className="bg-gray-100 dark:bg-[#2A2A2A] px-3 py-1 rounded-full">
                  <Text className="text-[#005BBB] dark:text-[#FFD700] font-black">R$ {quadra.valor_hora}/hr</Text>
                </View>
              </View>

              <View className="flex-row justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-[#2A2A2A]">
                <Text className="text-gray-500 text-xs uppercase font-bold">Valor p/ pessoa</Text>
                <Text className="text-green-600 dark:text-[#4ADE80] font-black text-xl">
                  R$ {getValorPorPessoa(quadra.valor_hora)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

      </ScrollView>

      {/* Barra fixa embaixo se tiver selecionado */}
      {quadraSelecionada && (
        <View className="absolute bottom-0 w-full bg-white dark:bg-[#1A1A1A] border-t border-gray-200 dark:border-[#2A2A2A] p-6 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-900 dark:text-white font-bold">{quadraSelecionada.nome}</Text>
            <Text className="text-[#005BBB] dark:text-[#FFD700] font-bold">R$ {quadraSelecionada.valor_hora}</Text>
          </View>
          <TouchableOpacity 
            onPress={handleReserva}
            className="bg-[#005BBB] dark:bg-[#82A0D8] rounded-xl py-4 items-center">
            <Text className="text-white dark:text-[#121212] font-black text-lg">SOLICITAR RESERVA</Text>
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
}
