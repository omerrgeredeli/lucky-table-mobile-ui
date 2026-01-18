# Google Sign-In Android Yapılandırma Kılavuzu

## DEVELOPER_ERROR Çözümü

Bu hata genellikle Google Cloud Console'da OAuth yapılandırması eksik veya yanlış olduğunda oluşur.

## 1. Google Cloud Console Kontrolü

### Android OAuth Client Oluşturma/Düzenleme

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**
2. **OAuth 2.0 Client IDs** bölümünde Android client'ı bulun veya oluşturun
3. Aşağıdaki bilgileri kontrol edin:

#### Android OAuth Client Ayarları:
- **Application type**: Android
- **Package name**: `com.luckytable.app`
- **SHA-1 certificate fingerprint**: 
  - **Debug/Test**: `AA:03:92:A8:93:D5:E7:9E:D0:B5:F1:36:E8:CD:42:02:1C:82:7E:60`
  - **EAS Release**: `eas credentials -p android` komutu ile alınmalı ve eklenmeli

### Web OAuth Client Kontrolü

1. **OAuth 2.0 Client IDs** bölümünde Web application client'ı bulun
2. Aşağıdaki bilgileri kontrol edin:

#### Web OAuth Client Ayarları:
- **Application type**: Web application
- **Client ID**: `YOUR_WEB_CLIENT_ID.apps.googleusercontent.com` (Google Cloud Console'dan alın)
- **Client Secret**: `YOUR_WEB_CLIENT_SECRET` (Google Cloud Console'dan alın)

### iOS OAuth Client Kontrolü (Referans)

- **Client ID**: `YOUR_IOS_CLIENT_ID.apps.googleusercontent.com` (Google Cloud Console'dan alın)

## 2. EAS Release SHA-1 Alma

Production APK için SHA-1 fingerprint'i almak:

```bash
eas credentials -p android
```

Bu komut EAS build için kullanılan keystore'un SHA-1'ini gösterir. Bu SHA-1'i Google Cloud Console'daki Android OAuth Client'a ekleyin.

## 3. React Native Yapılandırması

### Mevcut Yapılandırma (LoginScreen.js)

```javascript
await GoogleSigninModule.configure({
  androidClientId: GOOGLE_CLIENT_IDS.android, // Android OAuth Client ID
  webClientId: GOOGLE_CLIENT_IDS.web, // Web Client ID (backend token doğrulama için)
  offlineAccess: true, // serverAuthCode almak için
  forceCodeForRefreshToken: true, // serverAuthCode almak için
});
```

### Client ID'ler (src/config/googleAuth.js)

- **Android**: `YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com` (Google Cloud Console'dan alın)
- **Web**: `YOUR_WEB_CLIENT_ID.apps.googleusercontent.com` (Google Cloud Console'dan alın)
- **iOS**: `YOUR_IOS_CLIENT_ID.apps.googleusercontent.com` (Google Cloud Console'dan alın)

## 4. Sorun Giderme

### DEVELOPER_ERROR Alıyorsanız:

1. ✅ Google Cloud Console'da Android OAuth Client mevcut mu?
2. ✅ Package name doğru mu? (`com.luckytable.app`)
3. ✅ SHA-1 fingerprint doğru mu? (Debug ve Release için ayrı ayrı kontrol edin)
4. ✅ Android Client ID doğru mu? (Google Cloud Console'dan kontrol edin)
5. ✅ Web Client ID doğru mu? (Google Cloud Console'dan kontrol edin)

### Debug SHA-1 Kontrolü

Local development için SHA-1'i kontrol etmek:

```bash
# Windows
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android

# macOS/Linux
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Beklenen SHA-1: `AA:03:92:A8:93:D5:E7:9E:D0:B5:F1:36:E8:CD:42:02:1C:82:7E:60`

## 5. Test Senaryoları

### ✅ Çalışması Gerekenler:
- [ ] Emulator'da Google Sign-In
- [ ] Gerçek cihazda Google Sign-In (debug APK)
- [ ] EAS Build APK'da Google Sign-In (release)

### ❌ Hala DEVELOPER_ERROR Alıyorsanız:

1. Google Cloud Console'da OAuth consent screen'in **Published** olduğundan emin olun
2. Android OAuth Client'ın **Package name** ve **SHA-1**'inin tam olarak eşleştiğini kontrol edin
3. APK'yı yeniden build edin (keystore değişiklikleri sonrası)
4. Google Play Services'in güncel olduğundan emin olun

## 6. Önemli Notlar

- **offlineAccess: true** ve **forceCodeForRefreshToken: true** → Backend'de token doğrulaması için `serverAuthCode` almak için gerekli
- **webClientId** → Backend'de Google token'ı doğrulamak için kullanılır
- **androidClientId** → Native Google Sign-In için zorunlu
- Her APK build tipi (debug, release) için ayrı SHA-1 gerekebilir

