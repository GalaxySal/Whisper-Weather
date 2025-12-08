use serde::{Deserialize, Serialize};
use sysinfo::System;
use std::process::Command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemInfo {
    pub platform: String,
    pub arch: String,
    pub cpu_usage: f32,
    pub memory_usage: f32,
    pub total_memory: u64,
    pub used_memory: u64,
    pub process_count: usize,
    pub uptime: u64,
    pub device_model: Option<String>,
    pub kernel_version: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum SystemError {
    PermissionDenied,
    SystemInfoUnavailable,
    CommandFailed(String),
}

impl std::fmt::Display for SystemError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            SystemError::PermissionDenied => write!(f, "Permission denied"),
            SystemError::SystemInfoUnavailable => write!(f, "System info unavailable"),
            SystemError::CommandFailed(cmd) => write!(f, "Command failed: {}", cmd),
        }
    }
}

#[tauri::command]
pub async fn get_detailed_system_info() -> Result<SystemInfo, SystemError> {
    let mut sys = System::new_all();
    sys.refresh_all();

    // CPU usage
    let cpu_usage = sys.global_cpu_info().cpu_usage();

    // Memory usage
    let total_memory = sys.total_memory();
    let used_memory = sys.used_memory();
    let memory_usage = (used_memory as f64 / total_memory as f64) * 100.0;

    // System uptime
    let uptime = System::uptime();

    // Device model (platform-specific)
    let device_model = get_device_model().await;
    let kernel_version = get_kernel_version().await;

    Ok(SystemInfo {
        platform: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        cpu_usage,
        memory_usage: memory_usage as f32,
        total_memory,
        used_memory,
        process_count: sys.processes().len(),
        uptime,
        device_model,
        kernel_version,
    })
}

#[tauri::command]
pub async fn get_cpu_usage() -> Result<f32, SystemError> {
    let mut sys = System::new_all();
    sys.refresh_cpu();
    Ok(sys.global_cpu_info().cpu_usage())
}

#[tauri::command]
pub async fn get_memory_usage() -> Result<(u64, u64, f32), SystemError> {
    let mut sys = System::new_all();
    sys.refresh_memory();
    
    let total = sys.total_memory();
    let used = sys.used_memory();
    let usage = (used as f64 / total as f64) * 100.0;
    
    Ok((total, used, usage as f32))
}

async fn get_device_model() -> Option<String> {
    if cfg!(target_os = "linux") {
        // Try to get device model from /sys/class/dmi/id/product_name
        if let Ok(output) = Command::new("cat")
            .arg("/sys/class/dmi/id/product_name")
            .output()
        {
            if let Ok(model) = String::from_utf8(output.stdout) {
                return Some(model.trim().to_string());
            }
        }
    } else if cfg!(target_os = "macos") {
        // Get Mac model
        if let Ok(output) = Command::new("sysctl")
            .args(&["-n", "hw.model"])
            .output()
        {
            if let Ok(model) = String::from_utf8(output.stdout) {
                return Some(model.trim().to_string());
            }
        }
    } else if cfg!(target_os = "windows") {
        // Get Windows model
        if let Ok(output) = Command::new("wmic")
            .args(&["computersystem", "get", "model"])
            .output()
        {
            if let Ok(model) = String::from_utf8(output.stdout) {
                let lines: Vec<&str> = model.lines().collect();
                if lines.len() > 1 {
                    return Some(lines[1].trim().to_string());
                }
            }
        }
    }
    None
}

async fn get_kernel_version() -> Option<String> {
    if cfg!(target_os = "linux") {
        if let Ok(output) = Command::new("uname")
            .arg("-r")
            .output()
        {
            if let Ok(version) = String::from_utf8(output.stdout) {
                return Some(version.trim().to_string());
            }
        }
    } else if cfg!(target_os = "macos") {
        if let Ok(output) = Command::new("uname")
            .arg("-r")
            .output()
        {
            if let Ok(version) = String::from_utf8(output.stdout) {
                return Some(version.trim().to_string());
            }
        }
    } else if cfg!(target_os = "windows") {
        if let Ok(output) = Command::new("ver")
            .output()
        {
            if let Ok(version) = String::from_utf8(output.stdout) {
                return Some(version.trim().to_string());
            }
        }
    }
    None
}
