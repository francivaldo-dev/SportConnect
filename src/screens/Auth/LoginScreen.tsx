import React, { useState, useContext } from 'react';
import { View, Text, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { supabase } from '../../services/supabase';
import { AuthContext } from '../../contexts/AuthContext';

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn } = useContext(AuthContext);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha e-mail e senha.');
      return;
    }
    
    setLoading(true);
    
    // Consulta manual no banco de dados
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('senha', password)
      .single();

    setLoading(false);

    if (error || !data) {
      let errorMessage = 'E-mail ou senha incorretos.';
      if (error && (error.message.includes('Network request failed') || error.message.includes('fetch'))) {
        errorMessage = 'Erro de conexão. Verifique sua internet.';
      }
      Alert.alert('Falha no Login', errorMessage);
      return;
    }

    // Sucesso - salva a sessão no app
    await signIn(data);
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-brand-bg"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        
        {/* LOGO */}
        <View className="items-center mb-10 mt-4">
          <Image 
            source={require('../../../assets/logoSport.png')} 
            style={{ width: 180, height: 180 }} 
            resizeMode="contain" 
          />
        </View>

        <Text className="text-white text-3xl font-bold mb-2">Bem-vindo(a)</Text>
        <Text className="text-gray-400 mb-8">Faça login para continuar no SportConnect.</Text>

        <Input 
          label="E-mail" 
          placeholder="seu@email.com" 
          keyboardType="email-address" 
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        
        <Input 
          label="Senha" 
          placeholder="••••••••" 
          secureTextEntry 
          value={password}
          onChangeText={setPassword}
        />

        <Button 
          title="Entrar" 
          onPress={handleLogin} 
          isLoading={loading} 
          className="mt-6 mb-4" 
        />

        <View className="flex-row items-center mb-6">
          <View className="flex-1 h-[1px] bg-gray-800" />
          <Text className="text-gray-500 px-4">OU</Text>
          <View className="flex-1 h-[1px] bg-gray-800" />
        </View>

        <Button 
          title="Continuar com Google" 
          variant="outline" 
          onPress={() => Alert.alert('Aviso', 'Login social temporariamente desabilitado.')} 
        />

        <View className="flex-row justify-center mt-10 mb-4">
          <Text className="text-gray-400">Não tem uma conta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text className="text-brand-primary font-bold">Cadastre-se</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
