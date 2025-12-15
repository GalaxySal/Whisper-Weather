use std::time::Duration;
use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_updater::UpdaterExt;

pub async fn setup_auto_updater(app: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    println!("Setting up auto updater...");

    // Check for updates every 30 minutes
    let mut interval = tokio::time::interval(Duration::from_secs(30 * 60));

    loop {
        interval.tick().await;

        if let Ok(Some(update)) = app.updater()?.check().await {
            println!("Update available: {}", update.version);

            // Auto-install update
            if let Some(body) = &update.body {
                println!("Update notes: {}", body);
            }

            // Show notification
            if let Err(e) = app
                .notification()
                .builder()
                .title("Whisper Weather Update")
                .body(&format!(
                    "New version {} is available. Installing automatically...",
                    update.version
                ))
                .show()
            {
                println!("Failed to show notification: {}", e);
            }

            // Install update
            if let Err(e) = update
                .download_and_install(
                    |chunk_length, content_length| {
                        let progress = if let Some(total) = content_length {
                            chunk_length as f64 / total as f64 * 100.0
                        } else {
                            0.0
                        };
                        println!("Download progress: {:.1}%", progress);
                    },
                    || {
                        println!("Download completed!");
                    },
                )
                .await
            {
                println!("Failed to install update: {}", e);
                continue;
            }

            println!("Update installed successfully! Restarting...");

            // Show completion notification
            if let Err(e) = app
                .notification()
                .builder()
                .title("Update Complete")
                .body("The application will restart to apply the update.")
                .show()
            {
                println!("Failed to show completion notification: {}", e);
            }

            // Restart the app
            app.restart();
        }
    }
}

#[tauri::command]
pub async fn check_for_updates(app: AppHandle) -> Result<Option<String>, String> {
    match app.updater() {
        Ok(updater) => match updater.check().await {
            Ok(Some(update)) => Ok(Some(format!("Version {} is available", update.version))),
            Ok(None) => Ok(None),
            Err(e) => Err(format!("Failed to check for updates: {}", e)),
        },
        Err(e) => Err(format!("Updater not available: {}", e)),
    }
}

#[tauri::command]
pub async fn install_update(app: AppHandle) -> Result<String, String> {
    match app.updater() {
        Ok(updater) => {
            match updater.check().await {
                Ok(Some(update)) => {
                    match update
                        .download_and_install(
                            |chunk_length, content_length| {
                                let progress = if let Some(total) = content_length {
                                    chunk_length as f64 / total as f64 * 100.0
                                } else {
                                    0.0
                                };
                                println!("Download progress: {:.1}%", progress);
                            },
                            || {
                                println!("Download completed!");
                            },
                        )
                        .await
                    {
                        Ok(_) => {
                            app.restart();
                            // Note: This line won't be reached due to restart
                        }
                        Err(e) => Err(format!("Failed to install update: {}", e)),
                    }
                }
                Ok(None) => Err("No update available".to_string()),
                Err(e) => Err(format!("Failed to check for updates: {}", e)),
            }
        }
        Err(e) => Err(format!("Updater not available: {}", e)),
    }
}
