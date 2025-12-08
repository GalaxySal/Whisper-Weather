use sysinfo::System;
use std::thread;
use std::time::Duration;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::{Manager, Emitter};
use reqwest::Client;
use dotenvy::dotenv;

mod auth;
mod supabase;
mod tunnel;
mod system;
mod api;
mod updater;

use auth::AuthState;
use tunnel::TunnelState;

#[tauri::command]
fn get_system_resources() -> Result<serde_json::Value, String> {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    // Mevcut process'i bul
    let current_pid = std::process::id();
    let process_info = if let Some(process) = sys.process(sysinfo::Pid::from(std::process::id() as usize)) {
        serde_json::json!({
            "pid": current_pid,
            "memory_mb": process.memory() / 1024 / 1024, // KB'dan MB'a
            "cpu_percent": process.cpu_usage(),
            "name": process.name()
        })
    } else {
        serde_json::json!({
            "pid": current_pid,
            "memory_mb": 0,
            "cpu_percent": 0.0,
            "name": "unknown"
        })
    };
    
    // Sistem genel bilgileri
    let system_info = serde_json::json!({
        "total_memory_mb": sys.total_memory() / 1024 / 1024,
        "used_memory_mb": sys.used_memory() / 1024 / 1024,
        "available_memory_mb": sys.available_memory() / 1024 / 1024,
        "cpu_usage": sys.global_cpu_info().cpu_usage(),
        "cpu_count": sys.cpus().len(),
        "process_count": sys.processes().len()
    });
    
    Ok(serde_json::json!({
        "process": process_info,
        "system": system_info,
        "timestamp": std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }))
}

#[tauri::command]
async fn search_cities(query: &str) -> Result<Vec<String>, String> {
    if query.trim().is_empty() {
        return Ok(vec![]);
    }

    // OpenStreetMap Nominatim API kullan
    let url = format!(
        "https://nominatim.openstreetmap.org/search?format=json&q={}&addressdetails=1&limit=10&countrycodes=tr",
        urlencoding::encode(query.trim())
    );

    let client = reqwest::Client::new();
    
    match client.get(&url)
        .header("User-Agent", "WhisperWeather App (https://github.com/example/whisper-weather)")
        .send()
        .await {
        Ok(response) => {
            match response.json::<serde_json::Value>().await {
                Ok(data) => {
                    if let Some(results) = data.as_array() {
                        let cities: Vec<String> = results
                            .iter()
                            .filter_map(|result| {
                                // Önce address alanından city/town/village al
                                if let Some(address) = result.get("address") {
                                    if let Some(city) = address.get("city").and_then(|v| v.as_str()) {
                                        return Some(city.to_string());
                                    }
                                    if let Some(town) = address.get("town").and_then(|v| v.as_str()) {
                                        return Some(town.to_string());
                                    }
                                    if let Some(village) = address.get("village").and_then(|v| v.as_str()) {
                                        return Some(village.to_string());
                                    }
                                }
                                
                                // Yoksa display_name'den ayıkla
                                if let Some(display_name) = result.get("display_name").and_then(|v| v.as_str()) {
                                    // Virgülden önceki kısmı al ve temizle
                                    let parts: Vec<&str> = display_name.split(',').collect();
                                    if let Some(first_part) = parts.first() {
                                        let trimmed = first_part.trim();
                                        let cleaned1 = trimmed.replace(" Mah", "");
                                        let cleaned2 = cleaned1.replace(" Köy", "");
                                        let cleaned3 = cleaned2.replace(" Mahallesi", "");
                                        let cleaned4 = cleaned3.replace(" Köyü", "");
                                        let normalized = cleaned4.trim();
                                        
                                        if !normalized.is_empty() && normalized.len() > 2 {
                                            return Some(normalized.to_string());
                                        }
                                    }
                                }
                                
                                None
                            })
                            .take(10)
                            .collect();
                        
                        Ok(cities)
                    } else {
                        Ok(vec![])
                    }
                }
                Err(e) => Err(format!("JSON parse error: {}", e))
            }
        }
        Err(e) => Err(format!("Request error: {}", e))
    }
}

#[tauri::command]
fn get_system_info() -> Result<serde_json::Value, String> {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    // CPU kullanımı (sysinfo v0.30 API)
    let cpu_usage = sys.global_cpu_info().cpu_usage();
    
    // Bellek kullanımı
    let total_memory = sys.total_memory();
    let used_memory = sys.used_memory();
    let memory_usage = (used_memory as f64 / total_memory as f64) * 100.0;
    
    // Disk kullanımı (basit hesaplama)
    let disk_usage = match std::fs::metadata("/") {
        Ok(metadata) => {
            let size = metadata.len();
            (size / (1024 * 1024)) % 1000 // MB cinsinden
        },
        Err(_) => 0
    };
    
    // Sistem uptime (sysinfo v0.30 API)
    let uptime_seconds = System::uptime();
    let uptime_days = uptime_seconds / 86400;
    let uptime_hours = (uptime_seconds % 86400) / 3600;
    let uptime_minutes = (uptime_seconds % 3600) / 60;
    
    let system_info = serde_json::json!({
        "platform": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "cpuUsage": format!("{:.1}%", cpu_usage),
        "memoryUsage": format!("{:.1}%", memory_usage),
        "diskUsage": format!("{} MB", disk_usage),
        "totalMemory": format!("{} MB", total_memory / (1024 * 1024)),
        "usedMemory": format!("{} MB", used_memory / (1024 * 1024)),
        "processCount": sys.processes().len(),
        "uptime": format!("{}d {}h {}m", uptime_days, uptime_hours, uptime_minutes),
        "online": true
    });
    
    Ok(system_info)
}

#[tauri::command]
fn open_weather_url(city: &str) -> Result<String, String> {
    let url = format!("https://weather.com/weather/today/l/{}", city);
    Ok(url)
}

#[tauri::command]
async fn open_url<'a>(url: String, app: tauri::AppHandle, rate_limit: tauri::State<'a, Arc<Mutex<HashMap<String, u64>>>>) -> Result<(), String> {
    use tauri_plugin_shell::ShellExt;
    use std::time::{SystemTime, UNIX_EPOCH};
    
    // Rate limiting kontrolü (1 saniyede en fazla 1 istek)
    let current_time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    
    let mut rate_map = rate_limit.lock().unwrap();
    let key = "zentaira_access".to_string();
    
    if let Some(&last_time) = rate_map.get(&key) {
        if current_time - last_time < 1 {
            return Err("Rate limit exceeded. Please wait before trying again.".to_string());
        }
    }
    
    rate_map.insert(key, current_time);
    drop(rate_map);
    
    // Güvenlik kontrolü
    if !is_url_safe(&url) {
        return Err("Unsafe URL detected".to_string());
    }
    
    // Sadece Zentaira domain'ine izin ver
    if !url.contains("zentaira.com") && !url.contains("www.zentaira.com") {
        return Err("Access denied: Only Zentaira URLs are allowed".to_string());
    }
    
    match app.shell().command("open").arg(&url).spawn() {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to open URL: {}", e)),
    }
}

// URL güvenlik kontrolü
fn is_url_safe(url: &str) -> bool {
    // Temel URL formatı kontrolü
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return false;
    }
    
    // Tehlikeli karakterleri kontrol et
    let dangerous_chars = ["<", ">", "\"", "'", ";", "(", ")", "{", "}", "|", "\\"];
    for char in dangerous_chars {
        if url.contains(char) {
            return false;
        }
    }
    
    // JavaScript protokolünü engelle
    if url.to_lowercase().contains("javascript:") {
        return false;
    }
    
    true
}

#[tauri::command]
async fn get_user_stats() -> Result<serde_json::Value, String> {
    let client = Client::new();
    
    let supabase_url = std::env::var("SUPABASE_URL")
        .unwrap_or_else(|_| "https://ombbxzpyawyyzurhrrjg.supabase.co".to_string());
    let supabase_key = std::env::var("SUPABASE_ANON_KEY")
        .unwrap_or_else(|_| "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tYmJ4enB5YXd5eXp1cmhycmpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NTE4MjEsImV4cCI6MjA4MDIyNzgyMX0.jIbtBVHEKK-jeT3GqLupCtBkv-5qjwYvk5yAjLViILE".to_string());

    // Kullanıcı sayısını al
    let total_users = match client
        .get(&format!("{}/rest/v1/profiles?select=count", supabase_url))
        .header("apikey", &supabase_key)
        .header("Authorization", &format!("Bearer {}", supabase_key))
        .send()
        .await {
            Ok(response) => {
                match response.json::<serde_json::Value>().await {
                    Ok(data) => data.as_array().unwrap_or(&vec![]).len(),
                    Err(_) => 0
                }
            },
            Err(_) => 0
        };

    // Aktif kullanıcıları son 30 günde giriş yapanlar olarak hesapla
    let thirty_days_ago = (chrono::Utc::now() - chrono::Duration::days(30)).to_rfc3339();
    
    let active_users = match client
        .get(&format!("{}/rest/v1/user_sessions?select=count&last_sign_in=gte.{}", supabase_url, thirty_days_ago))
        .header("apikey", &supabase_key)
        .header("Authorization", &format!("Bearer {}", supabase_key))
        .send()
        .await {
            Ok(response) => {
                match response.json::<serde_json::Value>().await {
                    Ok(data) => data.as_array().unwrap_or(&vec![]).len(),
                    Err(_) => 0
                }
            },
            Err(_) => 0
        };

    // Son 30 günde kaydolan yeni kullanıcılar
    let new_users_this_month = match client
        .get(&format!("{}/rest/v1/profiles?select=count&created_at=gte.{}", supabase_url, thirty_days_ago))
        .header("apikey", &supabase_key)
        .header("Authorization", &format!("Bearer {}", supabase_key))
        .send()
        .await {
            Ok(response) => {
                match response.json::<serde_json::Value>().await {
                    Ok(data) => data.as_array().unwrap_or(&vec![]).len(),
                    Err(_) => 0
                }
            },
            Err(_) => 0
        };

    // Hata raporlarını al
    let bugs_data = match client
        .get(&format!("{}/rest/v1/bug_reports?select=status,severity", supabase_url))
        .header("apikey", &supabase_key)
        .header("Authorization", &format!("Bearer {}", supabase_key))
        .send()
        .await {
            Ok(response) => {
                match response.json::<serde_json::Value>().await {
                    Ok(data) => data,
                    Err(_) => serde_json::Value::Array(vec![])
                }
            },
            Err(_) => serde_json::Value::Array(vec![])
        };

    let bugs = if let serde_json::Value::Array(array) = bugs_data {
        array
    } else {
        vec![]
    };
    let total_bugs = bugs.len();
    let resolved_bugs = bugs.iter()
        .filter(|bug| bug.get("status") == Some(&serde_json::Value::String("resolved".to_string())))
        .count();
    let critical_bugs = bugs.iter()
        .filter(|bug| bug.get("severity") == Some(&serde_json::Value::String("critical".to_string())))
        .count();

    let stats = serde_json::json!({
        "totalUsers": total_users,
        "activeUsers": active_users,
        "newUsersThisMonth": new_users_this_month,
        "totalBugs": total_bugs,
        "resolvedBugs": resolved_bugs,
        "criticalBugs": critical_bugs,
        "systemUptime": "15d 8h 23m",
        "lastUpdate": chrono::Utc::now().to_rfc3339()
    });
    
    Ok(stats)
}

#[tauri::command]
async fn get_bug_reports() -> Result<serde_json::Value, String> {
    let client = Client::new();
    
    let supabase_url = std::env::var("SUPABASE_URL")
        .unwrap_or_else(|_| "https://ombbxzpyawyyzurhrrjg.supabase.co".to_string());
    let supabase_key = std::env::var("SUPABASE_ANON_KEY")
        .unwrap_or_else(|_| "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tYmJ4enB5YXd5eXp1cmalionIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NTE4MjEsImV4cCI6MjA4MDIyNzgyMX0.jIbtBVHEKK-jeT3GqLupCtBkv-5qjwYvk5yAjLViILE".to_string());

    println!("DEBUG: Fetching bug reports from: {}", supabase_url);

    match client
        .get(&format!("{}/rest/v1/bug_reports?select=*&order=created_at.desc", supabase_url))
        .header("apikey", &supabase_key)
        .header("Authorization", &format!("Bearer {}", supabase_key))
        .header("Prefer", "return=representation")
        .send()
        .await {
            Ok(response) => {
                println!("DEBUG: Response status: {}", response.status());
                match response.json::<serde_json::Value>().await {
                    Ok(data) => {
                        println!("DEBUG: Successfully parsed bug reports data");
                        Ok(data)
                    },
                    Err(e) => {
                        println!("DEBUG: Failed to parse JSON: {}", e);
                        Err(format!("Failed to parse response: {}", e))
                    }
                }
            },
            Err(e) => {
                println!("DEBUG: HTTP request failed: {}", e);
                Err(format!("Failed to fetch bug reports: {}", e))
            }
        }
}

#[tauri::command]
async fn update_bug_status(bug_id: String, new_status: String) -> Result<(), String> {
    let client = Client::new();
    
    let supabase_url = std::env::var("SUPABASE_URL")
        .unwrap_or_else(|_| "https://ombbxzpyawyyzurhrrjg.supabase.co".to_string());
    let supabase_key = std::env::var("SUPABASE_ANON_KEY")
        .unwrap_or_else(|_| "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tYmJ4enB5YXd5eXp1cmalionIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NTE4MjEsImV4cCI6MjA4MDIyNzgyMX0.jIbtBVHEKK-jeT3GqLupCtBkv-5qjwYvk5yAjLViILE".to_string());

    let update_data = serde_json::json!({
        "status": new_status,
        "updated_at": chrono::Utc::now().to_rfc3339()
    });

    match client
        .patch(&format!("{}/rest/v1/bug_reports?id=eq.{}", supabase_url, bug_id))
        .header("apikey", &supabase_key)
        .header("Authorization", &format!("Bearer {}", supabase_key))
        .header("Content-Type", "application/json")
        .header("Prefer", "return=minimal")
        .json(&update_data)
        .send()
        .await {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to update bug status: {}", e))
        }
}

#[tauri::command]
async fn delete_bug_report(bug_id: String) -> Result<(), String> {
    let client = Client::new();
    
    let supabase_url = std::env::var("SUPABASE_URL")
        .unwrap_or_else(|_| "https://ombbxzpyawyyzurhrrjg.supabase.co".to_string());
    let supabase_key = std::env::var("SUPABASE_ANON_KEY")
        .unwrap_or_else(|_| "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tYmJ4enB5YXd5eXp1cmalionIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NTE4MjEsImV4cCI6MjA4MDIyNzgyMX0.jIbtBVHEKK-jeT3GqLupCtBkv-5qjwYvk5yAjLViILE".to_string());

    match client
        .delete(&format!("{}/rest/v1/bug_reports?id=eq.{}", supabase_url, bug_id))
        .header("apikey", &supabase_key)
        .header("Authorization", &format!("Bearer {}", supabase_key))
        .header("Prefer", "return=minimal")
        .send()
        .await {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to delete bug report: {}", e))
        }
}

#[tauri::command]
async fn save_favorite_cities(cities: Vec<String>) -> Result<(), String> {
    use std::fs;
    
    let home_dir = dirs::home_dir().ok_or("Home directory not found")?;
    let config_path = home_dir.join(".whisper-weather");
    
    fs::create_dir_all(&config_path).map_err(|e| e.to_string())?;
    
    let favorites_path = config_path.join("favorites.json");
    let json = serde_json::to_string(&cities).map_err(|e| e.to_string())?;
    
    fs::write(favorites_path, json).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
async fn load_favorite_cities() -> Result<Vec<String>, String> {
    use std::fs;
    
    let home_dir = dirs::home_dir().ok_or("Home directory not found")?;
    let favorites_path = home_dir.join(".whisper-weather/favorites.json");
    
    if !favorites_path.exists() {
        return Ok(vec![]);
    }
    
    let content = fs::read_to_string(favorites_path).map_err(|e| e.to_string())?;
    let cities: Vec<String> = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    
    Ok(cities)
}

#[tauri::command]
fn save_settings(language: String, theme: String) -> Result<(), String> {
    use std::fs;
    
    let home_dir = dirs::home_dir().ok_or("Home directory not found")?;
    let config_path = home_dir.join(".whisper-weather");
    
    fs::create_dir_all(&config_path).map_err(|e| e.to_string())?;
    
    let settings_path = config_path.join("settings.json");
    let settings = serde_json::json!({
        "language": language,
        "theme": theme
    });
    
    let json = serde_json::to_string(&settings).map_err(|e| e.to_string())?;
    fs::write(settings_path, json).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
fn load_settings() -> Result<serde_json::Value, String> {
    use std::fs;
    
    let home_dir = dirs::home_dir().ok_or("Home directory not found")?;
    let settings_path = home_dir.join(".whisper-weather/settings.json");
    
    if !settings_path.exists() {
        return Ok(serde_json::json!({
            "language": "tr",
            "theme": "light"
        }));
    }
    
    let content = fs::read_to_string(settings_path).map_err(|e| e.to_string())?;
    let settings: serde_json::Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    
    Ok(settings)
}

#[tauri::command]
fn show_notification(app: tauri::AppHandle, title: String, body: String) -> Result<(), String> {
    use tauri_plugin_notification::NotificationExt;
    
    let notification = app.notification();
    
    notification.builder()
        .title(title)
        .body(body)
        .show()
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
fn get_system_theme() -> Result<String, String> {
    use std::process::Command;
    
    // Linux için sistem temasını kontrol et
    if cfg!(target_os = "linux") {
        let output = Command::new("gsettings")
            .args(&["get", "org.gnome.desktop.interface", "gtk-theme"])
            .output()
            .map_err(|e| e.to_string())?;
        
        let theme = String::from_utf8_lossy(&output.stdout);
        if theme.to_lowercase().contains("dark") {
            Ok("dark".to_string())
        } else {
            Ok("light".to_string())
        }
    } else if cfg!(target_os = "macos") {
        let output = Command::new("defaults")
            .args(&["read", "-g", "AppleInterfaceStyle"])
            .output()
            .map_err(|e| e.to_string())?;
        
        let theme = String::from_utf8_lossy(&output.stdout);
        if theme.trim().to_lowercase().contains("dark") {
            Ok("dark".to_string())
        } else {
            Ok("light".to_string())
        }
    } else if cfg!(target_os = "windows") {
        // Windows için registry kontrolü
        use std::process::Command;
        let output = Command::new("powershell")
            .args(&["-Command", "Get-ItemProperty -Path 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize' | Select-Object -ExpandProperty AppsUseLightTheme"])
            .output()
            .map_err(|e| e.to_string())?;
        
        let theme_value = String::from_utf8_lossy(&output.stdout);
        let theme_value = theme_value.trim();
        if theme_value == "0" {
            Ok("dark".to_string())
        } else {
            Ok("light".to_string())
        }
    } else {
        Ok("light".to_string())
    }
}

fn start_theme_watcher(app_handle: tauri::AppHandle) {
    use std::sync::atomic::{AtomicBool, Ordering};
    use std::sync::Arc;
    
    let running = Arc::new(AtomicBool::new(true));
    let running_clone = running.clone();
    let app_handle_clone = app_handle.clone();
    
    thread::spawn(move || {
        let mut last_theme = String::new();
        
        while running_clone.load(Ordering::Relaxed) {
            if let Ok(current_theme) = get_system_theme() {
                if current_theme != last_theme {
                    last_theme = current_theme.clone();
                    
                    // Frontend'e tema değişikliğini bildir
                    if let Some(window) = app_handle_clone.get_webview_window("main") {
                        let _ = window.emit("system-theme-changed", &current_theme);
                    }
                }
            }
            
            // Her 3 saniyede bir kontrol et
            for _ in 0..30 { // 3 saniye = 30 * 100ms
                if !running_clone.load(Ordering::Relaxed) {
                    break;
                }
                thread::sleep(Duration::from_millis(100));
            }
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn main() {
    // .env dosyasını yükle
    dotenv().ok();
    
    // Auth state'i başlat
    let auth_state = AuthState::default();
    
    // Tunnel state'i başlat
    let tunnel_state = TunnelState::default();
    
    // Rate limiting için global state
    let rate_limit_state = Arc::new(Mutex::new(HashMap::<String, u64>::new()));
    
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(rate_limit_state)
        .manage(auth_state)
        .manage(tunnel_state)
        .invoke_handler(tauri::generate_handler![
            get_system_resources,
            search_cities,
            get_system_info,
            get_system_theme,
            open_weather_url,
            open_url,
            get_user_stats,
            get_bug_reports,
            update_bug_status,
            delete_bug_report,
            show_notification,
            save_favorite_cities,
            load_favorite_cities,
            save_settings,
            load_settings,
            // Auth commands
            auth::login_user,
            auth::verify_captcha,
            auth::check_cloudflare_health,
            auth::safe_direct_mode,
            // API commands
            api::get_weather,
            api::search_weather_cities,
            api::check_auth_status,
            api::refresh_session,
            api::api_health_check,
            api::get_api_config,
            api::get_api_queries,
            api::log_api_query_command,
            // Updater commands
            updater::check_for_updates,
            updater::install_update,
            // System commands
            system::get_detailed_system_info,
            system::get_cpu_usage,
            system::get_memory_usage,
            // Tunnel commands
            tunnel::check_tunnel_health,
            tunnel::get_tunnel_config,
            tunnel::update_tunnel_config,
            tunnel::get_tunnel_status,
            tunnel::switch_tunnel_mode
        ])
        .setup(|app| {
            start_theme_watcher(app.handle().clone());
            
            // Start auto updater in background
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = updater::setup_auto_updater(app_handle).await {
                    eprintln!("Auto updater setup failed: {}", e);
                }
            });
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
