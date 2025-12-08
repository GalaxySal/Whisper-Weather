use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use reqwest::Client;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TunnelConfig {
    pub main_domain: String,
    pub subdomain: String,
    pub target_port: u16,
    pub health_check_path: String,
    pub fallback_urls: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TunnelStatus {
    pub is_active: bool,
    pub current_mode: TunnelMode,
    pub main_domain_status: bool,
    pub fallback_status: bool,
    pub last_check: u64,
    pub response_time_ms: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum TunnelMode {
    MainDomain,
    Fallback,
    Direct,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum TunnelError {
    ConnectionFailed,
    Timeout,
    InvalidConfig,
    AllEndpointsDown,
}

impl std::fmt::Display for TunnelError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            TunnelError::ConnectionFailed => write!(f, "Connection failed"),
            TunnelError::Timeout => write!(f, "Request timeout"),
            TunnelError::InvalidConfig => write!(f, "Invalid configuration"),
            TunnelError::AllEndpointsDown => write!(f, "All endpoints are down"),
        }
    }
}

pub struct TunnelState {
    pub config: RwLock<TunnelConfig>,
    pub status: RwLock<TunnelStatus>,
    pub client: Client,
    #[allow(dead_code)]
    pub health_check_interval: Duration,
}

impl Default for TunnelState {
    fn default() -> Self {
        let config = TunnelConfig {
            main_domain: "https://www.zentaira.com".to_string(), // www yönlendirmesi
            subdomain: "whisper-weather".to_string(),
            target_port: 3000,
            health_check_path: "/".to_string(), // Ana sayfayı kontrol et
            fallback_urls: vec![
                "https://zentaira.com".to_string(), // Fallback domain
            ],
        };

        let status = TunnelStatus {
            is_active: true,
            current_mode: TunnelMode::MainDomain,
            main_domain_status: false,
            fallback_status: false,
            last_check: 0,
            response_time_ms: 0,
        };

        Self {
            config: RwLock::new(config),
            status: RwLock::new(status),
            client: Client::new(),
            health_check_interval: Duration::from_secs(30),
        }
    }
}

#[tauri::command]
pub async fn check_tunnel_health(
    state: tauri::State<'_, TunnelState>,
) -> Result<TunnelStatus, TunnelError> {
    let config = state.config.read().await;
    let mut status = state.status.write().await;
    
    let start_time = Instant::now();
    
    // Check main domain (zentaira.com)
    let main_domain_url = format!("{}{}", config.main_domain, config.health_check_path);
    let main_domain_status = check_endpoint_health(&state.client, &main_domain_url).await;
    
    // Check fallback URLs
    let mut fallback_status = false;
    for fallback_url in &config.fallback_urls {
        let fallback_check_url = format!("{}{}", fallback_url, config.health_check_path);
        if check_endpoint_health(&state.client, &fallback_check_url).await {
            fallback_status = true;
            break;
        }
    }
    
    let response_time = start_time.elapsed().as_millis() as u64;
    
    // Update status
    let new_status = TunnelStatus {
        is_active: main_domain_status || fallback_status,
        current_mode: if main_domain_status {
            TunnelMode::MainDomain
        } else if fallback_status {
            TunnelMode::Fallback
        } else {
            TunnelMode::Direct
        },
        main_domain_status,
        fallback_status,
        last_check: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
        response_time_ms: response_time,
    };
    
    let return_status = TunnelStatus {
        is_active: new_status.is_active,
        current_mode: new_status.current_mode.clone(),
        main_domain_status: new_status.main_domain_status,
        fallback_status: new_status.fallback_status,
        last_check: new_status.last_check,
        response_time_ms: new_status.response_time_ms,
    };
    
    *status = new_status;
    Ok(return_status)
}

#[tauri::command]
pub async fn get_tunnel_config(
    state: tauri::State<'_, TunnelState>,
) -> Result<TunnelConfig, TunnelError> {
    let config = state.config.read().await;
    Ok(config.clone())
}

#[tauri::command]
pub async fn update_tunnel_config(
    config: TunnelConfig,
    state: tauri::State<'_, TunnelState>,
) -> Result<(), TunnelError> {
    let mut config_state = state.config.write().await;
    *config_state = config;
    Ok(())
}

#[tauri::command]
pub async fn get_tunnel_status(
    state: tauri::State<'_, TunnelState>,
) -> Result<TunnelStatus, TunnelError> {
    let status = state.status.read().await;
    let return_status = TunnelStatus {
        is_active: status.is_active,
        current_mode: status.current_mode.clone(),
        main_domain_status: status.main_domain_status,
        fallback_status: status.fallback_status,
        last_check: status.last_check,
        response_time_ms: status.response_time_ms,
    };
    Ok(return_status)
}

#[tauri::command]
pub async fn switch_tunnel_mode(
    mode: TunnelMode,
    state: tauri::State<'_, TunnelState>,
) -> Result<(), TunnelError> {
    let mut status = state.status.write().await;
    status.current_mode = mode.clone();
    
    match mode {
        TunnelMode::MainDomain => {
            status.is_active = status.main_domain_status;
        }
        TunnelMode::Fallback => {
            status.is_active = status.fallback_status;
        }
        TunnelMode::Direct => {
            status.is_active = true;
        }
    }
    
    Ok(())
}

async fn check_endpoint_health(client: &Client, url: &str) -> bool {
    match client.get(url)
        .timeout(Duration::from_secs(3)) // 5'ten 3'e düşür
        .send()
        .await {
            Ok(response) => response.status().is_success(),
            Err(_) => false,
        }
}

// Get the best available URL for API requests
#[allow(dead_code)]
pub async fn get_best_api_url(state: &TunnelState) -> String {
    let config = state.config.read().await;
    let status = state.status.read().await;
    
    match status.current_mode {
        TunnelMode::MainDomain => format!("{}{}", config.main_domain, "/api"),
        TunnelMode::Fallback => {
            if let Some(fallback) = config.fallback_urls.first() {
                format!("{}{}", fallback, "/api")
            } else {
                format!("{}{}", config.main_domain, "/api")
            }
        }
        TunnelMode::Direct => format!("http://localhost:{}", config.target_port),
    }
}
