import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTranslation } from 'react-i18next';

export interface TranslatedTextProps extends TextProps {
  tKey: string;
  tOptions?: Record<string, unknown>;
}

export const TranslatedText: React.FC<TranslatedTextProps> = ({ tKey, tOptions, style, ...rest }) => {
  const { t } = useTranslation();
  
  return (
    <Text style={style} {...rest}>
      {t(tKey, tOptions)}
    </Text>
  );
};
