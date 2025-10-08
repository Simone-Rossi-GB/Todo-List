use serde::{Deserialize, Serialize};

// URL del server
const SERVER_URL: &str = "http://192.168.1.100:8080";

// ==================== STRUTTURE DATI ====================

/// Dati per login
#[derive(Serialize)]
struct LoginRequest {
    email: String,
    password: String,
}

/// Risposta dal server dopo login
#[derive(Deserialize)]
struct LoginResponse {
    token: String,
    user: UserInfo,
}

/// Info utente
#[derive(Deserialize, Serialize, Clone)]
pub struct UserInfo {
    pub id: i32,
    pub email: String,
    pub name: String,
}

/// Dati per registrazione
#[derive(Serialize)]
struct RegisterRequest {
    email: String,
    password: String,
    name: String,
}

// ==================== COMANDI TAURI ====================

/// Comando di LOGIN
/// Chiamato dal JS: await invoke('login', { email: '...', password: '...' })
#[tauri::command]
pub async fn login(email: String, password: String) -> Result<String, String> {
    println!("Tentativo login per: {}", email);

    // Crea il client HTTP
    let client = reqwest::Client::new();

    // Prepara il body della richiesta
    let body = LoginRequest {
        email: email.clone(),
        password
    };

    // Invia POST al server
    let response = client
        .post(format!("{}/api/auth/login", SERVER_URL))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Errore connessione: {}", e))?;

    // Controlla lo status code
    if !response.status().is_success() {
        return Err(format!("Login fallito: {}", response.status()));
    }

    // Deserializza la risposta
    let data: LoginResponse = response
        .json()
        .await
        .map_err(|e| format!("Errore parsing risposta: {}", e))?;

    // Salva il token (per ora in memoria, poi miglioreremo)
    save_token(&data.token).await?;
    save_user_info(&data.user).await?;

    println!("Login effettuato! Token salvato.");

    Ok(format!("Login effettuato: {}", data.user.name))
}

/// Comando di REGISTRAZIONE
/// Chiamato dal JS: await invoke('register', { email: '...', password: '...', name: '...' })
#[tauri::command]
pub async fn register(email: String, password: String, name: String) -> Result<String, String> {
    println!("Tentativo registrazione per: {}", email);

    let client = reqwest::Client::new();

    let body = RegisterRequest {
        email: email.clone(),
        password,
        name
    };

    let response = client
        .post(format!("{}/api/auth/register", SERVER_URL))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Errore connessione: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Registrazione fallita: {}", error_text));
    }

    println!("Registrazione completata!");

    Ok(format!("Utente {} registrato con successo!", email))
}

/// Comando per ottenere il token salvato
#[tauri::command]
pub async fn get_saved_token() -> Result<String, String> {
    load_token().await
}

/// Comando per ottenere info utente salvate
#[tauri::command]
pub async fn get_user_info() -> Result<UserInfo, String> {
    load_user_info().await
}

/// Comando di LOGOUT
#[tauri::command]
pub async fn logout() -> Result<(), String> {
    // Cancella token e info utente
    delete_token().await?;
    delete_user_info().await?;

    println!("=K Logout effettuato");
    Ok(())
}

// ==================== GESTIONE TOKEN (TEMPORANEA - FILE) ====================

use std::path::PathBuf;

/// Percorso dove salvare il token in file
fn get_token_path() -> PathBuf {
    // Usa la cartella app data
    let mut path = std::env::current_dir().unwrap();
    path.push("token.txt");
    path
}

fn get_user_info_path() -> PathBuf {
    let mut path = std::env::current_dir().unwrap();
    path.push("user_info.json");
    path
}

async fn save_token(token: &str) -> Result<(), String> {
    std::fs::write(get_token_path(), token)
        .map_err(|e| format!("Errore salvataggio token: {}", e))
}

async fn load_token() -> Result<String, String> {
    std::fs::read_to_string(get_token_path())
        .map_err(|_| "Nessun token trovato".to_string())
}

async fn delete_token() -> Result<(), String> {
    std::fs::remove_file(get_token_path())
        .map_err(|_| "Errore cancellazione token".to_string())
}

async fn save_user_info(user: &UserInfo) -> Result<(), String> {
    let json = serde_json::to_string(user)
        .map_err(|e| format!("Errore serializzazione: {}", e))?;
    std::fs::write(get_user_info_path(), json)
        .map_err(|e| format!("Errore salvataggio user info: {}", e))
}

async fn load_user_info() -> Result<UserInfo, String> {
    let json = std::fs::read_to_string(get_user_info_path())
        .map_err(|_| "Nessuna info utente trovata".to_string())?;
    serde_json::from_str(&json)
        .map_err(|e| format!("Errore parsing user info: {}", e))
}

async fn delete_user_info() -> Result<(), String> {
    std::fs::remove_file(get_user_info_path())
        .map_err(|_| "Errore cancellazione user info".to_string())
}
