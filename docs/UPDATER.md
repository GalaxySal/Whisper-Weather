# Tauri Updater Configuration

## Auto Update Setup

The application includes automatic update functionality that:

1. **Checks for updates every 30 minutes** in the background
2. **Automatically downloads and installs** updates when available
3. **Shows notifications** for update progress
4. **Restarts the application** to apply updates

## Configuration Files

### tauri.conf.json
```json
{
  "bundle": {
    "active": true,
    "targets": ["appimage", "deb", "nsis", "dmg"],
    "publisher": "Zentaria",
    "category": "Weather",
    "shortDescription": "Modern weather application",
    "longDescription": "A beautiful weather application with real-time updates and tunnel monitoring"
  },
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": ["https://releases.tauri.app/{{current_version}}"],
      "dialog": false,
      "windows": {
        "installMode": "passive"
      }
    }
  }
}
```

## Environment Variables

```bash
# Update server configuration
TAURI_UPDADER_ENDPOINTS="https://your-update-server.com/{{current_version}}"
TAURI_PRIVATE_KEY="your_private_key"
TAURI_KEY_PASSWORD="your_key_password"
```

## Manual Update Controls

```typescript
import { updaterService } from '@/services/updater';

// Check for updates manually
const updateAvailable = await updaterService.checkForUpdates();
if (updateAvailable) {
  console.log('Update available:', updateAvailable);
}

// Install update manually
try {
  await updaterService.installUpdate();
} catch (error) {
  console.error('Update failed:', error);
}
```

## Update Process

1. **Background Check**: Every 30 minutes
2. **Notification**: Shows "New version available"
3. **Download**: Automatic with progress tracking
4. **Installation**: Silent installation
5. **Restart**: App restarts automatically

## Security

- Updates are cryptographically signed
- Only verified updates are installed
- Private key required for signing releases

## Release Process

1. Build the application:
```bash
npm run tauri build
```

2. Sign the release:
```bash
tauri signer sign --private-key path/to/key.pem build/bundle/
```

3. Upload to update server

## Platform Support

- **Windows**: NSIS installer
- **Linux**: AppImage, DEB packages
- **macOS**: DMG installer

## Troubleshooting

### Update Not Working
- Check network connection
- Verify update server URL
- Check private key configuration

### Manual Override
Users can disable auto-updater by setting environment variable:
```bash
TAURI_SKIP_UPDATER=true
```

## Logs

Update progress is logged to console:
- Update check results
- Download progress
- Installation status
- Error messages
