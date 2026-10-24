import * as Linking from 'expo-linking';
import { Alert } from 'react-native';
import { cleanPhoneNumber } from './helpers';

export async function initiatePassengerCall(
  passengerName: string,
  rawPhone?: string
): Promise<void> {
  const cleaned = cleanPhoneNumber(rawPhone);
  if (!cleaned || cleaned.length < 5) {
    Alert.alert(
      'Cannot Make Call',
      `No valid mobile number registered for passenger "${passengerName}".`,
      [{ text: 'OK' }]
    );
    return;
  }

  const url = `tel:${cleaned}`;
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        'Dialer Unavailable',
        `Phone calls cannot be opened automatically on this device.\nNumber: ${cleaned}`,
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    Alert.alert(
      'Call Failed',
      `Could not open phone dialer: ${error instanceof Error ? error.message : 'Unknown error'}`,
      [{ text: 'OK' }]
    );
  }
}
