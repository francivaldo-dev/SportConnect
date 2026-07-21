import React from 'react';
import { View, ViewProps } from 'react-native';

export function Card({ className = '', children, ...props }: ViewProps) {
  return (
    <View className={`bg-brand-surface rounded-xl p-4 shadow-sm border border-gray-800 ${className}`} {...props}>
      {children}
    </View>
  );
}
