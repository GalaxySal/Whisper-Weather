# Tauri Signing Keys

## Generated Keys

**Private Key:** `.tauri/whisper-weather.key` (KEEP SECRET!)
**Public Key:** `.tauri/whisper-weather.key.pub`

**Password:** `whisperweather2024`

## Environment Variables

Add these to your `.env` file:

```bash
TAURI_SIGNING_PRIVATE_KEY="/home/nazim/Masaüstü/whisper-weather/.tauri/whisper-weather.key"
TAURI_SIGNING_PRIVATE_KEY_PASSWORD="whisperweather2024"
```

## Usage

### Building and Signing

```bash
# Build the application
npm run tauri build

# Sign the release
npx @tauri-apps/cli signer sign \
  --private-key .tauri/whisper-weather.key \
  --password whisperweather2024 \
  build/bundle/
```

### GitHub Releases Setup

1. Create a new release on GitHub
2. Upload the signed bundles
3. The updater will check: `https://api.github.com/repos/zentaria/whisper-weather/releases/latest`

## Security Notes

- **NEVER** commit the private key to Git
- **NEVER** share the private key
- **NEVER** lose the password
- **ALWAYS** backup the private key securely

## Production Activation

To enable auto-updater in production:

1. Set `"active": true` in `tauri.conf.json`
2. Set up GitHub releases or update server
3. Sign your releases with the private key
4. Upload signed releases to your update endpoint

## Key Rotation

If you need to rotate keys:

1. Generate new key pair
2. Update `pubkey` in config
3. Re-sign all releases
4. Update update server

---

**Generated:** December 8, 2025  
**Password:** `whisperweather2024`  
**Repository:** `zentaria/whisper-weather`
