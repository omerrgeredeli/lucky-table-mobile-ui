# 🚀 Production APK Build - Hemen Başlat

## ⚠️ ÖNEMLİ: Doğru Dizinde Olun!

Komutu çalıştırmadan önce proje dizinine geçmeniz gerekiyor.

## 📋 Adımlar

### 1. Proje Dizinine Geçin

Terminal'de şu komutu çalıştırın:

```bash
cd C:\Users\omergeredeli\CursorProjects\lucky-table-mobile-ui
```

### 2. EAS Login Kontrolü

Login yapıp yapmadığınızı kontrol edin:

```bash
eas whoami
```

Eğer "Not logged in" görüyorsanız:

```bash
eas login
```

**Login Bilgileri:**
- Email: `omerfgeredeli`
- Şifre: `Omer1992.` (sonunda nokta var!)

### 3. Production APK Build

Login yaptıktan sonra:

```bash
npm run build:android:production
```

veya

```bash
npx eas-cli@latest build --platform android --profile production
```

## 🔍 Hızlı Kontrol

Proje dizininde olduğunuzdan emin olmak için:

```bash
dir package.json
```

Eğer `package.json` dosyasını görüyorsanız, doğru dizindesiniz.

## 📝 Tüm Komutlar (Sırayla)

```bash
# 1. Proje dizinine geç
cd C:\Users\omergeredeli\CursorProjects\lucky-table-mobile-ui

# 2. Login kontrolü
eas whoami

# 3. Eğer login değilseniz
eas login

# 4. Production APK build
npm run build:android:production
```

## ⏱️ Build Süresi

- İlk build: ~25-30 dakika
- Sonraki build'ler: ~20-25 dakika

Build başladıktan sonra terminal'de build URL'i görünecek ve [expo.dev](https://expo.dev) hesabınızdan takip edebilirsiniz.

---

**Proje Dizini:** `C:\Users\omergeredeli\CursorProjects\lucky-table-mobile-ui`

