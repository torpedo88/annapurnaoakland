import { PermissionsAndroid, Platform } from "react-native";

// Android 12+ (API 31) requires runtime BLUETOOTH_CONNECT / BLUETOOTH_SCAN.
// Older Androids gate Bluetooth scanning behind location. Call this before
// discovering/connecting to the printer. Returns true if all needed grants pass.
export async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== "android") return true;

  const sdk = Platform.Version as number;
  const perms =
    sdk >= 31
      ? [PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT, PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

  const result = await PermissionsAndroid.requestMultiple(perms);
  return perms.every((p) => result[p] === PermissionsAndroid.RESULTS.GRANTED);
}
