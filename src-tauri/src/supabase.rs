use serde::{Deserialize, Serialize};
use reqwest::Client;
use std::time::Duration;

#[derive(Debug, Serialize, Deserialize)]
pub struct SupabaseAuthRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SupabaseAuthResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: u64,
    pub user: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SupabaseError {
    pub error: String,
    pub error_description: Option<String>,
}

pub struct SupabaseClient {
    client: Client,
    url: String,
    anon_key: String,
}

impl SupabaseClient {
    pub fn new() -> Self {
        let url = std::env::var("SUPABASE_URL")
            .unwrap_or_else(|_| "https://ombbxzpyawyyzurhrrjg.supabase.co".to_string());
        let anon_key = std::env::var("SUPABASE_ANON_KEY")
            .unwrap_or_else(|_| "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tYmJ4enB5YXd5eXp1cmhycmpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NTE4MjEsImV4cCI6MjA4MDIyNzgyMX0.jIbtBVHEKK-jeT3GqLupCtBkv-5qjwYvk5yAjLViILE".to_string());

        Self {
            client: Client::new(),
            url,
            anon_key,
        }
    }

    pub async fn sign_in(&self, email: &str, password: &str) -> Result<SupabaseAuthResponse, String> {
        let auth_url = format!("{}/auth/v1/token?grant_type=password", self.url);
        
        let request_body = SupabaseAuthRequest {
            email: email.to_string(),
            password: password.to_string(),
        };

        println!("DEBUG: Attempting Supabase login for: {}", email);
        println!("DEBUG: Auth URL: {}", auth_url);

        match self.client
            .post(&auth_url)
            .header("apikey", &self.anon_key)
            .header("Content-Type", "application/json")
            .json(&request_body)
            .timeout(Duration::from_secs(10))
            .send()
            .await {
                Ok(response) => {
                    println!("DEBUG: Supabase response status: {}", response.status());
                    
                    if response.status().is_success() {
                        match response.json::<SupabaseAuthResponse>().await {
                            Ok(auth_response) => {
                                println!("DEBUG: Login successful");
                                Ok(auth_response)
                            }
                            Err(e) => {
                                println!("DEBUG: Failed to parse auth response: {}", e);
                                Err("Failed to parse authentication response".to_string())
                            }
                        }
                    } else {
                        let status = response.status();
                        match response.json::<SupabaseError>().await {
                            Ok(error) => {
                                println!("DEBUG: Supabase error: {} - {}", error.error, error.error_description.as_deref().unwrap_or_default());
                                Err(format!("{}: {}", error.error, error.error_description.as_deref().unwrap_or_default()))
                            }
                            Err(_) => {
                                println!("DEBUG: HTTP error: {}", status);
                                Err(format!("HTTP {}: Invalid credentials", status))
                            }
                        }
                    }
                }
                Err(e) => {
                    println!("DEBUG: Network error: {}", e);
                    Err(format!("Network error: {}", e))
                }
            }
    }

    #[allow(dead_code)]
    pub async fn verify_token(&self, token: &str) -> Result<bool, String> {
        let user_url = format!("{}/auth/v1/user", self.url);
        
        match self.client
            .get(&user_url)
            .header("apikey", &self.anon_key)
            .header("Authorization", &format!("Bearer {}", token))
            .timeout(Duration::from_secs(5))
            .send()
            .await {
                Ok(response) => Ok(response.status().is_success()),
                Err(e) => Err(format!("Network error: {}", e)),
            }
    }

    #[allow(dead_code)]
    pub async fn get_user_role(&self, token: &str) -> Result<String, String> {
        let user_url = format!("{}/auth/v1/user", self.url);
        
        match self.client
            .get(&user_url)
            .header("apikey", &self.anon_key)
            .header("Authorization", &format!("Bearer {}", token))
            .timeout(Duration::from_secs(5))
            .send()
            .await {
                Ok(response) => {
                    if response.status().is_success() {
                        match response.json::<serde_json::Value>().await {
                            Ok(user_data) => {
                                if let Some(role) = user_data.get("user_metadata")
                                    .and_then(|meta| meta.get("role"))
                                    .and_then(|role| role.as_str()) {
                                    Ok(role.to_string())
                                } else {
                                    Ok("user".to_string())
                                }
                            }
                            Err(e) => Err(format!("Failed to parse user data: {}", e))
                        }
                    } else {
                        Err("Invalid token".to_string())
                    }
                }
                Err(e) => Err(format!("Network error: {}", e)),
            }
    }
}
