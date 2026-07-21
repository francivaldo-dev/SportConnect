import React from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <View className={`w-full mb-4 ${className}`}>
      {label && <Text className="text-gray-300 font-medium mb-1.5">{label}</Text>}
      <TextInput
        className={`bg-brand-surface text-white h-14 px-4 rounded-lg border ${
          error ? 'border-red-500' : 'border-gray-800'
        } focus:border-brand-primary`}
        placeholderTextColor="#6B7280" // Tailwind gray-500
        {...props}
      />
      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
    </View>
  );
}
