use crate::supabase::SupabaseClient;
use crate::tunnel::TunnelState;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
    pub device_info: Option<DeviceInfo>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DeviceInfo {
    pub user_agent: String,
    pub ip_address: Option<String>,
    pub timestamp: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub success: bool,
    pub token: Option<String>,
    pub requires_captcha: bool,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum AuthError {
    InvalidCredentials,
    CaptchaRequired,
    RateLimited,
    CloudflareUnavailable,
    SupabaseError(String),
    NetworkError,
}

impl std::fmt::Display for AuthError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            AuthError::InvalidCredentials => write!(f, "Invalid credentials"),
            AuthError::CaptchaRequired => write!(f, "CAPTCHA required"),
            AuthError::RateLimited => write!(f, "Rate limited"),
            AuthError::CloudflareUnavailable => write!(f, "Cloudflare unavailable"),
            AuthError::SupabaseError(msg) => write!(f, "Supabase error: {}", msg),
            AuthError::NetworkError => write!(f, "Network error"),
        }
    }
}

pub struct AuthState {
    pub failed_attempts: RwLock<HashMap<String, Vec<Instant>>>,
    pub suspicious_ips: RwLock<HashMap<String, Instant>>,
    pub cloudflare_status: RwLock<bool>,
}

impl Default for AuthState {
    fn default() -> Self {
        Self {
            failed_attempts: RwLock::new(HashMap::new()),
            suspicious_ips: RwLock::new(HashMap::new()),
            cloudflare_status: RwLock::new(true),
        }
    }
}

#[tauri::command]
pub async fn login_user(
    request: LoginRequest,
    auth_state: tauri::State<'_, AuthState>,
    tunnel_state: tauri::State<'_, TunnelState>,
) -> Result<LoginResponse, AuthError> {
    // Check if suspicious behavior
    if is_suspicious_behavior(&request, &auth_state, &tunnel_state).await {
        return Ok(LoginResponse {
            success: false,
            token: None,
            requires_captcha: true,
            message: "CAPTCHA required for security".to_string(),
        });
    }

    // Check tunnel availability
    let cloudflare_ok = match check_simple_tunnel_status().await {
        Ok(status) => status,
        Err(_) => false,
    };
    if !cloudflare_ok {
        println!("DEBUG: Tunnel unavailable, switching to direct mode");
    }

    // Attempt login with Supabase
    match attempt_supabase_login(&request).await {
        Ok(token) => {
            // Clear failed attempts on success
            clear_failed_attempts(&request.email, &auth_state).await;
            Ok(LoginResponse {
                success: true,
                token: Some(token),
                requires_captcha: false,
                message: "Login successful".to_string(),
            })
        }
        Err(e) => {
            // Record failed attempt
            record_failed_attempt(&request.email, &auth_state).await;
            Err(e)
        }
    }
}

#[tauri::command]
pub async fn verify_captcha(
    captcha_token: String,
    #[allow(unused_variables)] user_ip: Option<String>,
) -> Result<bool, AuthError> {
    // Verify with CAPTCHA service (hCaptcha, reCAPTCHA, etc.)
    // This is a placeholder implementation
    println!("Verifying CAPTCHA token: {}", captcha_token);

    // In production, verify with actual CAPTCHA service
    // For demo purposes, always return true
    Ok(true)
}

#[tauri::command]
pub async fn check_cloudflare_health(
    state: tauri::State<'_, AuthState>,
) -> Result<bool, AuthError> {
    // Check if Cloudflare Tunnel is accessible
    match check_cloudflare_tunnel_status().await {
        Ok(is_healthy) => {
            // Update state
            let mut cloudflare_status = state.cloudflare_status.write().await;
            *cloudflare_status = is_healthy;
            Ok(is_healthy)
        }
        Err(e) => {
            println!("Cloudflare health check failed: {}", e);
            // Mark as unhealthy
            let mut cloudflare_status = state.cloudflare_status.write().await;
            *cloudflare_status = false;
            Ok(false)
        }
    }
}

#[tauri::command]
pub async fn safe_direct_mode(state: tauri::State<'_, AuthState>) -> Result<(), AuthError> {
    let mut cloudflare_status = state.cloudflare_status.write().await;
    *cloudflare_status = false;
    println!("Switched to direct mode - Cloudflare unavailable");
    Ok(())
}

// Check Cloudflare Tunnel status
async fn check_cloudflare_tunnel_status() -> Result<bool, Box<dyn std::error::Error + Send + Sync>>
{
    let client = reqwest::Client::new();

    // Try to reach Supabase through Cloudflare Tunnel
    let cloudflare_url = std::env::var("CLOUDFLARE_TUNNEL_URL")
        .unwrap_or_else(|_| "https://your-app.trycloudflare.com".to_string());

    let health_check_url = format!("{}/health", cloudflare_url);

    match client
        .get(&health_check_url)
        .timeout(Duration::from_secs(5))
        .send()
        .await
    {
        Ok(response) => Ok(response.status().is_success()),
        Err(_) => {
            // If Cloudflare Tunnel fails, try direct Supabase
            let direct_url = std::env::var("SUPABASE_URL")
                .unwrap_or_else(|_| "https://ombbxzpyawyyzurhrrjg.supabase.co".to_string());

            let direct_health_url = format!("{}/rest/v1/", direct_url);

            match client
                .get(&direct_health_url)
                .timeout(Duration::from_secs(3))
                .header(
                    "apikey",
                    std::env::var("SUPABASE_ANON_KEY").unwrap_or_default(),
                )
                .send()
                .await
            {
                Ok(response) => Ok(response.status().is_success()),
                Err(e) => {
                    println!("Both Cloudflare and direct connections failed: {}", e);
                    Ok(false)
                }
            }
        }
    }
}

// Internal helper functions
#[allow(dead_code)]
async fn check_cloudflare_health_internal(state: &AuthState) -> bool {
    let cloudflare_status = state.cloudflare_status.read().await;
    *cloudflare_status
}

#[allow(dead_code)]
async fn safe_direct_mode_internal(state: &AuthState) {
    let mut cloudflare_status = state.cloudflare_status.write().await;
    *cloudflare_status = false;
    println!("Switched to direct mode - Cloudflare unavailable");
}

async fn is_suspicious_behavior(
    request: &LoginRequest,
    auth_state: &AuthState,
    tunnel_state: &TunnelState,
) -> bool {
    // Check failed attempts
    let failed_attempts = auth_state.failed_attempts.read().await;
    if let Some(attempts) = failed_attempts.get(&request.email) {
        let recent_attempts: Vec<_> = attempts
            .iter()
            .filter(|&&time| time.elapsed() < Duration::from_secs(300)) // 5 minutes
            .collect();

        // 3+ failed attempts trigger CAPTCHA
        if recent_attempts.len() >= 3 {
            println!(
                "DEBUG: Suspicious behavior detected - {} failed attempts for {}",
                recent_attempts.len(),
                request.email
            );
            return true;
        }
    }

    // Check tunnel status - if tunnel is down, require extra verification
    let tunnel_status = tunnel_state.status.read().await;
    if !tunnel_status.is_active {
        println!(
            "DEBUG: Tunnel is down, requiring extra verification for {}",
            request.email
        );
        return true;
    }

    // Check if response time is too high (indicates potential issues)
    if tunnel_status.response_time_ms > 1000 {
        println!(
            "DEBUG: High response time ({}ms), requiring verification for {}",
            tunnel_status.response_time_ms, request.email
        );
        return true;
    }

    // Check if this is a new device (simplified)
    if let Some(device_info) = &request.device_info {
        let suspicious_ips = auth_state.suspicious_ips.read().await;
        // Simple IP-based check (in production, use more sophisticated methods)
        if suspicious_ips.contains_key(&device_info.user_agent) {
            println!("DEBUG: Suspicious device detected for {}", request.email);
            return true;
        }
    }

    false
}

async fn record_failed_attempt(email: &str, state: &AuthState) {
    let mut failed_attempts = state.failed_attempts.write().await;
    let attempts = failed_attempts
        .entry(email.to_string())
        .or_insert_with(Vec::new);
    attempts.push(Instant::now());

    // Clean old attempts (older than 1 hour)
    attempts.retain(|&time| time.elapsed() < Duration::from_secs(3600));
}

async fn clear_failed_attempts(email: &str, state: &AuthState) {
    let mut failed_attempts = state.failed_attempts.write().await;
    failed_attempts.remove(email);
}

async fn attempt_supabase_login(request: &LoginRequest) -> Result<String, AuthError> {
    // Whisper Weather kendi Supabase projesini kullanmalı
    let supabase_client = SupabaseClient::new();

    match supabase_client
        .sign_in(&request.email, &request.password)
        .await
    {
        Ok(auth_response) => {
            println!(
                "DEBUG: Whisper Weather login successful for: {}",
                request.email
            );
            Ok(auth_response.access_token)
        }
        Err(e) => {
            println!("DEBUG: Whisper Weather login failed: {}", e);
            if e.contains("Invalid login credentials") {
                Err(AuthError::InvalidCredentials)
            } else {
                Err(AuthError::SupabaseError(e))
            }
        }
    }
}

// Simple tunnel check function
async fn check_simple_tunnel_status() -> Result<bool, Box<dyn std::error::Error + Send + Sync>> {
    let client = reqwest::Client::new();
    match client
        .get("https://www.zentaira.com")
        .timeout(Duration::from_secs(3))
        .send()
        .await
    {
        Ok(response) => Ok(response.status().is_success()),
        Err(e) => Err(Box::new(e)),
    }
}
