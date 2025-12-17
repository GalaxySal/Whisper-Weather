use crate::auth::AuthState;
use chrono::{DateTime, Utc};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::State;

// API Query logging
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiQuery {
    pub id: String,
    pub endpoint: String,
    pub method: String,
    pub status: u16,
    pub response_time: u64,
    pub user_id: Option<String>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub error: Option<String>,
}

// Global API query store
pub static API_QUERIES: once_cell::sync::Lazy<Arc<Mutex<Vec<ApiQuery>>>> =
    once_cell::sync::Lazy::new(|| Arc::new(Mutex::new(Vec::new())));

// Log API query for admin dashboard
#[tauri::command]
pub async fn log_api_query_command(
    endpoint: String,
    method: String,
    status: u16,
    error: Option<String>,
) -> Result<String, String> {
    log_api_query(&endpoint, &method, status, 0, None, error);
    Ok("Query logged".to_string())
}

pub fn log_api_query(
    endpoint: &str,
    method: &str,
    status: u16,
    response_time: u64,
    user_id: Option<String>,
    error: Option<String>,
) {
    let query = ApiQuery {
        id: uuid::Uuid::new_v4().to_string(),
        endpoint: endpoint.to_string(),
        method: method.to_string(),
        status,
        response_time,
        user_id,
        ip_address: None, // Could be extracted from request headers
        user_agent: None, // Could be extracted from request headers
        timestamp: Utc::now(),
        error,
    };

    if let Ok(mut queries) = API_QUERIES.lock() {
        queries.push(query);
        // Keep only last 1000 queries
        if queries.len() > 1000 {
            queries.remove(0);
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: String,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            message: "Success".to_string(),
        }
    }

    #[allow(dead_code)]
    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            message,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WeatherRequest {
    pub city: String,
    pub units: Option<String>, // metric, imperial, kelvin
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WeatherData {
    pub city: String,
    pub temperature: f64,
    pub condition: String,
    pub humidity: f64,
    pub wind_speed: f64,
    pub feels_like: f64,
    pub pressure: f64,
    pub visibility: f64,
    pub uv_index: f64,
    pub sunrise: i64,
    pub sunset: i64,
    pub timestamp: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenWeatherResponse {
    pub weather: Vec<OpenWeatherWeather>,
    pub main: OpenWeatherMain,
    pub wind: OpenWeatherWind,
    pub sys: OpenWeatherSys,
    pub name: String,
    pub dt: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenWeatherWeather {
    pub main: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenWeatherMain {
    pub temp: f64,
    pub feels_like: f64,
    pub humidity: f64,
    pub pressure: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenWeatherWind {
    pub speed: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenWeatherSys {
    pub sunrise: i64,
    pub sunset: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NominatimResponse {
    pub place_id: u64,
    pub licence: String,
    pub osm_type: String,
    pub osm_id: u64,
    pub lat: String,
    pub lon: String,
    pub display_name: String,
    pub address: Option<NominatimAddress>,
    pub boundingbox: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NominatimAddress {
    pub city: Option<String>,
    pub town: Option<String>,
    pub village: Option<String>,
    pub county: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub country_code: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthStatusResponse {
    pub authenticated: bool,
    pub user_id: Option<String>,
    pub session_expires: Option<i64>,
}

// Weather API endpoints
#[tauri::command]
pub async fn get_weather(request: WeatherRequest) -> Result<ApiResponse<WeatherData>, String> {
    let start_time = std::time::Instant::now();
    let endpoint = "/api/weather";

    let result = async {
        let api_key = env::var("VITE_OPENWEATHERMAP_API_KEY")
            .or_else(|_| env::var("OPENWEATHERMAP_API_KEY"))
            .unwrap_or_else(|_| {
                // Fallback to hardcoded key for production debugging
                "5d05b84ad6236dcc4cf258d5a70c9214".to_string()
            });

        let client = Client::new();
        let units = request.units.unwrap_or_else(|| "metric".to_string());

        // First get coordinates using Nominatim (OpenStreetMap)
        let nominatim_url = format!(
            "https://nominatim.openstreetmap.org/search?format=json&q={}&limit=1",
            request.city
        );

        let nominatim_response: Vec<NominatimResponse> = client
            .get(&nominatim_url)
            .header("User-Agent", "WhisperWeather/1.0")
            .timeout(Duration::from_secs(10))
            .send()
            .await
            .map_err(|e| format!("Failed to fetch coordinates: {}", e))?
            .json()
            .await
            .map_err(|e| format!("Failed to parse Nominatim response: {}", e))?;

        if nominatim_response.is_empty() {
            return Err("City not found".to_string());
        }

        let location = &nominatim_response[0];
        let lat: f64 = location
            .lat
            .parse()
            .map_err(|_| "Invalid latitude".to_string())?;
        let lon: f64 = location
            .lon
            .parse()
            .map_err(|_| "Invalid longitude".to_string())?;

        // Get weather data
        let weather_url = format!(
            "https://api.openweathermap.org/data/2.5/weather?lat={}&lon={}&appid={}&units={}",
            lat, lon, api_key, units
        );

        let weather_response: OpenWeatherResponse = client
            .get(&weather_url)
            .timeout(Duration::from_secs(10))
            .send()
            .await
            .map_err(|e| format!("Failed to fetch weather data: {}", e))?
            .json()
            .await
            .map_err(|e| format!("Failed to parse weather response: {}", e))?;

        let weather_data = WeatherData {
            city: weather_response.name,
            temperature: weather_response.main.temp,
            condition: weather_response
                .weather
                .first()
                .map(|w| w.description.clone())
                .unwrap_or_else(|| "Unknown".to_string()),
            humidity: weather_response.main.humidity,
            wind_speed: weather_response.wind.speed,
            feels_like: weather_response.main.feels_like,
            pressure: weather_response.main.pressure,
            visibility: 10000.0, // OpenWeather doesn't always provide this
            uv_index: 0.0,       // Would need separate API call for UV index
            sunrise: weather_response.sys.sunrise,
            sunset: weather_response.sys.sunset,
            timestamp: weather_response.dt,
        };

        Ok(ApiResponse::success(weather_data))
    }
    .await;

    let response_time = start_time.elapsed().as_millis() as u64;

    // Log the API call
    match &result {
        Ok(_) => log_api_query(endpoint, "POST", 200, response_time, None, None),
        Err(e) => log_api_query(endpoint, "POST", 500, response_time, None, Some(e.clone())),
    }

    result
}

#[tauri::command]
pub async fn search_weather_cities(query: String) -> Result<ApiResponse<Vec<String>>, String> {
    let client = Client::new();

    // Türkçe karakterleri normalize et
    let normalized_query = query
        .replace("ç", "c")
        .replace("Ç", "C")
        .replace("ğ", "g")
        .replace("Ğ", "G")
        .replace("ş", "s")
        .replace("Ş", "S")
        .replace("ı", "i")
        .replace("İ", "I")
        .replace("ö", "o")
        .replace("Ö", "O")
        .replace("ü", "u")
        .replace("Ü", "U");

    // Search for cities using Nominatim (OpenStreetMap) - Türkiye odaklı
    let nominatim_url = format!(
        "https://nominatim.openstreetmap.org/search?format=json&q={}&countrycodes=tr&limit=10",
        normalized_query
    );

    let cities = match client
        .get(&nominatim_url)
        .header("User-Agent", "WhisperWeather/1.0")
        .timeout(Duration::from_secs(10))
        .send()
        .await
    {
        Ok(response) => match response.json::<Vec<NominatimResponse>>().await {
            Ok(nominatim_response) => {
                let mut city_names: Vec<String> = nominatim_response
                    .into_iter()
                    .map(|location| {
                        location
                            .display_name
                            .split(',')
                            .next()
                            .unwrap_or(&location.display_name)
                            .to_string()
                    })
                    .collect();

                if city_names.is_empty() {
                    let worldwide_url = format!(
                        "https://nominatim.openstreetmap.org/search?format=json&q={}&limit=5",
                        normalized_query
                    );

                    if let Ok(worldwide_response) = client
                        .get(&worldwide_url)
                        .header("User-Agent", "WhisperWeather/1.0")
                        .timeout(Duration::from_secs(10))
                        .send()
                        .await
                    {
                        if let Ok(worldwide_data) =
                            worldwide_response.json::<Vec<NominatimResponse>>().await
                        {
                            city_names = worldwide_data
                                .into_iter()
                                .map(|location| {
                                    location
                                        .display_name
                                        .split(',')
                                        .next()
                                        .unwrap_or(&location.display_name)
                                        .to_string()
                                })
                                .collect();
                        }
                    }
                }

                city_names
            }
            Err(_e) => Vec::new(),
        },
        Err(_e) => Vec::new(),
    };

    Ok(ApiResponse::success(cities))
}

// Auth API endpoints
#[tauri::command]
pub async fn check_auth_status(
    _auth_state: State<'_, AuthState>,
) -> Result<ApiResponse<AuthStatusResponse>, String> {
    // Check if user is authenticated
    let response = AuthStatusResponse {
        authenticated: false, // In real app, check actual auth state
        user_id: None,
        session_expires: None,
    };

    Ok(ApiResponse::success(response))
}

#[tauri::command]
pub async fn refresh_session(
    _auth_state: State<'_, AuthState>,
) -> Result<ApiResponse<String>, String> {
    // Refresh authentication session
    Ok(ApiResponse::success("Session refreshed".to_string()))
}

// Get API queries for admin dashboard
#[tauri::command]
pub async fn get_api_queries() -> Result<ApiResponse<Vec<ApiQuery>>, String> {
    if let Ok(queries) = API_QUERIES.lock() {
        let mut sorted_queries = queries.clone();
        sorted_queries.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

        // Convert timestamp to string for JSON serialization
        let mut serialized_queries = Vec::new();
        for query in sorted_queries {
            let mut json_query = serde_json::to_value(&query).unwrap_or_default();

            // Convert timestamp to string
            if let Some(obj) = json_query.as_object_mut() {
                if let Some(timestamp) = obj.get("timestamp") {
                    if let Some(ts_str) = timestamp.as_str() {
                        obj.insert(
                            "timestamp".to_string(),
                            serde_json::Value::String(ts_str.to_string()),
                        );
                    }
                }
            }

            serialized_queries.push(json_query);
        }

        // Convert back to ApiQuery objects
        let final_queries: Vec<ApiQuery> = serialized_queries
            .into_iter()
            .filter_map(|v| serde_json::from_value(v).ok())
            .collect();

        Ok(ApiResponse::success(final_queries))
    } else {
        Ok(ApiResponse::success(Vec::new()))
    }
}

// Health check endpoint
#[tauri::command]
pub async fn api_health_check() -> Result<ApiResponse<HashMap<String, String>>, String> {
    let start_time = std::time::Instant::now();

    let mut health_data = HashMap::new();
    health_data.insert("status".to_string(), "healthy".to_string());
    health_data.insert(
        "timestamp".to_string(),
        chrono::Utc::now().to_rfc3339().to_string(),
    );
    health_data.insert("version".to_string(), "1.0.0".to_string());
    health_data.insert("uptime".to_string(), "0s".to_string());
    health_data.insert(
        "response_time".to_string(),
        format!("{}ms", start_time.elapsed().as_millis()),
    );

    // Log this health check
    log_api_query(
        "/api/health",
        "GET",
        200,
        start_time.elapsed().as_millis() as u64,
        None,
        None,
    );

    Ok(ApiResponse::success(health_data))
}

// Config endpoint
#[tauri::command]
pub async fn get_api_config() -> Result<ApiResponse<HashMap<String, String>>, String> {
    let mut config = HashMap::new();
    config.insert("api_version".to_string(), "v1".to_string());
    config.insert("rate_limit".to_string(), "100/hour".to_string());
    config.insert("features".to_string(), "weather,auth".to_string());

    Ok(ApiResponse::success(config))
}
