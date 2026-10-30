import { Alert } from 'react-native';

type Options = {
  title: string;
  message?: string;
  confirmLabel: string;
  destructive?: boolean;
};

/** Native confirmation dialog. Resolves `true` only if the user confirms. */
export function confirmAsync({ title, message, confirmLabel, destructive }: Options) {
  return new Promise<boolean>((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
