# Build the Print Bridge APK — step by step (EAS cloud, no Android Studio)

Do this once on any Mac/PC. Needs **Node 18+** and a free **Expo account**
(sign up at expo.dev). ~20 min, most of it the cloud build.

## 1. Create the native project
```bash
npx @react-native-community/cli@latest init PrintBridge
cd PrintBridge
```

## 2. Add this app's source (overwrite the generated App.tsx)
```bash
# if you're on the same machine as this repo:
REPO=/Users/abhishekmaharjan/annapurna/annapurnaoakland/print-bridge
cp "$REPO/App.tsx" ./App.tsx
cp -R "$REPO/src" ./src
cp "$REPO/eas.json" ./eas.json
```
(If building elsewhere, copy `App.tsx`, the `src/` folder, and `eas.json` from
the repo's `print-bridge/` into the new `PrintBridge/`.)

## 3. Install dependencies
```bash
npm i react-native-star-io10 @react-native-async-storage/async-storage @supersami/rn-foreground-service
npm i -g eas-cli
```

## 4. Android config (two files)

### a) `android/app/src/main/AndroidManifest.xml`
Add the permissions just **above** `<application>`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```
Inside `<application> … </application>` add (foreground-service wiring):
```xml
<meta-data android:name="com.supersami.foregroundservice.notification_channel_name" android:value="Annapurna printing" />
<meta-data android:name="com.supersami.foregroundservice.notification_channel_description" android:value="Prints new orders to the kitchen printer." />
<meta-data android:name="com.supersami.foregroundservice.notification_color" android:resource="@color/fg_service" />
<service android:name="com.supersami.foregroundservice.ForegroundService" android:foregroundServiceType="dataSync" />
<service android:name="com.supersami.foregroundservice.ForegroundServiceTask" />
```

### b) `android/app/src/main/res/values/colors.xml` (create it if missing)
```xml
<resources>
  <item name="fg_service" type="color">#C9A24B</item>
</resources>
```

## 5. Build the APK in the cloud
```bash
eas login                       # your Expo account
eas build:configure             # one-time — choose Android; it sets up a keystore
eas build -p android --profile preview
```
EAS prints a build link. When it finishes (~10–15 min), **download the `.apk`**
from that page.

## 6. Put it on the tablet
Sideload the APK (see `SETUP-CARD.md` / README "Install on the tablet"), then
configure: Server URL `https://annapurnaoakland.com`, the device token, **Scan
Bluetooth** → pick the TSP100 → **Test print** → **Auto-print ON**.

---

### If the build fails
- **Star SDK / foreground-service API mismatch** — those two libraries are
  version-sensitive. Open `src/printer.ts` / `src/printService.ts` and match the
  calls to the installed version's README (the comments at the top of each file
  flag this).
- **`eas build:configure` asks to create an Expo project** — say yes; it just
  registers the app + manages signing.
