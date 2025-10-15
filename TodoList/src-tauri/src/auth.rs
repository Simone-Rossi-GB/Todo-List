use serde::{Deserialize, Serialize};

// URL del server
const SERVER_URL: &str = "https://zprhzalelveyqzzuazex.supabase.co";
const SUPABASE_KEY: &str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwcmh6YWxlbHZleXF6enVhemV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDEwODQsImV4cCI6MjA3NTQ3NzA4NH0.A7T9SLw6Myn1j3MwHAs3owpmzx_IZuYGQdFx_YuQdp4";

// ==================== STRUTTURE DATI ====================

/// Dati per login
#[derive(Serialize)]
struct LoginRequest {
    email: String,
    password: String,
}

#[derive(Deserialize, Serialize, Clone)]
struct SupabaseUser {
    pub id: String,
    pub email: String,
}

/// Risposta dal server dopo login
#[derive(Deserialize)]
struct LoginResponse {
    access_token: String,
    user: SupabaseUser,
}

/// Info utente
#[derive(Deserialize, Serialize, Clone)]
pub struct UserInfo {
    pub id: String,
    pub email: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
}

#[derive(Serialize)]
struct UserData {
    name: String,
    username: String,
}

/// Dati per registrazione
#[derive(Serialize)]
struct RegisterRequest {
    email: String,
    password: String,
    data: UserData,
}

// ==================== COMANDI TAURI ====================

/// Comando di LOGIN
/// Chiamato dal JS: await invoke('login', { email: '...', password: '...' })
#[tauri::command]
pub async fn login(email: String, password: String) -> Result<String, String> {
    println!("Tentativo login per: {}", email);

    // Crea il client HTTP
    let client = reqwest::Client::new();

    println!("client creato! creo il body della richiesta");

    // Prepara il body della richiesta
    let body = LoginRequest {
        email: email.clone(),
        password
    };

    println!("body creato: {} - {}", body.email, body.password);

    // Invia POST al server
    let response = client
        .post(format!("{}/auth/v1/token?grant_type=password", SERVER_URL))
        .header("apikey", SUPABASE_KEY)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Errore connessione: {}", e))?;

    let status = response.status();
    println!("richiesta POST inviata: {}", status);

    // Controlla lo status code
    if !status.is_success() {
        let error_body = response.text().await.unwrap_or_else(|_| "Impossibile leggere body errore".to_string());
        println!("ERRORE LOGIN - Status: {} - Body: {}", status, error_body);
        return Err(format!("Login fallito: {} - {}", status, error_body));
    }

    // Deserializza la risposta
    let data: LoginResponse = response
        .json()
        .await
        .map_err(|e| format!("Errore parsing risposta: {}", e))?;

    // Salva il token (per ora in memoria, poi miglioreremo)
    save_token(&data.access_token).await?;
    //converto supabaseUSer in UserInfo visto che save_user_info si aspetta UserInfo
    let user_info = UserInfo {
        id: data.user.id,
        email: data.user.email,
        name: None, // Il nome sarà caricato successivamente da get_user_metadata
        username: None,
    };

    save_user_info(&user_info).await?;

    println!("Login effettuato! Token salvato.");

    Ok(format!("Login effettuato: {}", user_info.email))
}

/// Comando di REGISTRAZIONE
/// Chiamato dal JS: await invoke('register', { email: '...', password: '...', name: '...', username: '...' })
#[tauri::command]
pub async fn register(email: String, password: String, name: String, username: String) -> Result<String, String> {
    println!("Tentativo registrazione per: {}", email);

    let client = reqwest::Client::new();

    let body = RegisterRequest {
        email: email.clone(),
        password,
        data: UserData { name, username },
    };

    let response = client
        .post(format!("{}/auth/v1/signup", SERVER_URL))
        .header("apikey", SUPABASE_KEY)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Errore connessione: {}", e))?;

    let status = response.status();
    println!("Risposta registrazione - Status: {}", status);

    if !status.is_success() {
        let error_text = response.text().await.unwrap_or_default();
        println!("ERRORE REGISTRAZIONE - Body: {}", error_text);
        return Err(format!("Registrazione fallita: {}", error_text));
    }

    let response_body = response.text().await.unwrap_or_default();
    println!("Registrazione completata! Response body: {}", response_body);

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

/// Comando per ottenere i metadata dell'utente da Supabase (incluso il nome)
#[tauri::command]
pub async fn get_user_metadata(token: String) -> Result<UserInfo, String> {
    println!("Recupero metadata utente da Supabase");

    let client = reqwest::Client::new();

    let response = client
        .get(format!("{}/auth/v1/user", SERVER_URL))
        .header("apikey", SUPABASE_KEY)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| format!("Errore connessione: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Errore recupero metadata: {}", error_text));
    }

    #[derive(Deserialize)]
    struct UserMetadataResponse {
        id: String,
        email: String,
        user_metadata: Option<serde_json::Value>,
    }

    let user_data: UserMetadataResponse = response
        .json()
        .await
        .map_err(|e| format!("Errore parsing risposta: {}", e))?;

    // Estrai nome e username dai metadata se presenti
    let (name, username) = if let Some(ref meta) = user_data.user_metadata {
        let name = meta.get("name")
            .and_then(|n| n.as_str())
            .map(|s| s.to_string());
        let username = meta.get("username")
            .and_then(|u| u.as_str())
            .map(|s| s.to_string());
        (name, username)
    } else {
        (None, None)
    };

    let user_info = UserInfo {
        id: user_data.id,
        email: user_data.email,
        name,
        username,
    };

    println!("Metadata recuperati: email={}, name={:?}, username={:?}", user_info.email, user_info.name, user_info.username);
    Ok(user_info)
}

/// Comando di LOGOUT
#[tauri::command]
pub async fn logout() -> Result<(), String> {
    // Cancella token e info utente
    delete_token().await?;
    delete_user_info().await?;

    println!("Logout effettuato");
    Ok(())
}

/// Comando per cambiare la password
#[tauri::command]
pub async fn change_password(token: String, new_password: String) -> Result<String, String> {
    println!("Tentativo cambio password");

    let client = reqwest::Client::new();

    #[derive(Serialize)]
    struct PasswordChangeRequest {
        password: String,
    }

    let body = PasswordChangeRequest {
        password: new_password,
    };

    let response = client
        .put(format!("{}/auth/v1/user", SERVER_URL))
        .header("apikey", SUPABASE_KEY)
        .header("Authorization", format!("Bearer {}", token))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Errore connessione: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Cambio password fallito: {}", error_text));
    }

    println!("Password cambiata con successo");
    Ok("Password aggiornata con successo!".to_string())
}

/// Comando per aggiornare il nome utente
#[tauri::command]
pub async fn update_user_name(token: String, new_name: String) -> Result<String, String> {
    println!("Tentativo aggiornamento nome utente");

    let client = reqwest::Client::new();

    #[derive(Serialize)]
    struct UserMetadata {
        name: String,
    }

    #[derive(Serialize)]
    struct UpdateUserRequest {
        data: UserMetadata,
    }

    let body = UpdateUserRequest {
        data: UserMetadata { name: new_name },
    };

    let response = client
        .put(format!("{}/auth/v1/user", SERVER_URL))
        .header("apikey", SUPABASE_KEY)
        .header("Authorization", format!("Bearer {}", token))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Errore connessione: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Aggiornamento nome fallito: {}", error_text));
    }

    println!("Nome utente aggiornato con successo");
    Ok("Nome utente aggiornato con successo!".to_string())
}

/// Comando per aggiornare l'username
#[tauri::command]
pub async fn update_username(token: String, new_username: String) -> Result<String, String> {
    println!("Tentativo aggiornamento username");

    let client = reqwest::Client::new();

    #[derive(Serialize)]
    struct UsernameMetadata {
        username: String,
    }

    #[derive(Serialize)]
    struct UpdateUsernameRequest {
        data: UsernameMetadata,
    }

    let body = UpdateUsernameRequest {
        data: UsernameMetadata { username: new_username },
    };

    let response = client
        .put(format!("{}/auth/v1/user", SERVER_URL))
        .header("apikey", SUPABASE_KEY)
        .header("Authorization", format!("Bearer {}", token))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Errore connessione: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Aggiornamento username fallito: {}", error_text));
    }

    println!("Username aggiornato con successo");
    Ok("Username aggiornato con successo!".to_string())
}

/// Comando per recuperare la password (invia email di reset)
#[tauri::command]
pub async fn recover_password(email: String) -> Result<String, String> {
    println!("Richiesta recupero password per: {}", email);

    let client = reqwest::Client::new();

    #[derive(Serialize)]
    struct RecoverRequest {
        email: String,
    }

    let body = RecoverRequest { email };

    let response = client
        .post(format!("{}/auth/v1/recover", SERVER_URL))
        .header("apikey", SUPABASE_KEY)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Errore connessione: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Recupero password fallito: {}", error_text));
    }

    println!("Email di recupero inviata");
    Ok("Email di recupero password inviata! Controlla la tua casella di posta.".to_string())
}

// ==================== GESTIONE TOKEN (TEMPORANEA - FILE) ====================

use std::path::PathBuf;
use std::fs;

/// Ottiene la directory AppData appropriata per il sistema operativo
fn get_app_data_dir() -> Result<PathBuf, String> {
    // Usa la directory AppData/Application Support appropriata per l'OS
    let data_dir = if cfg!(target_os = "windows") {
        std::env::var("APPDATA")
            .map_err(|_| "Impossibile trovare APPDATA".to_string())?
    } else if cfg!(target_os = "macos") {
        let home = std::env::var("HOME")
            .map_err(|_| "Impossibile trovare HOME".to_string())?;
        format!("{}/Library/Application Support", home)
    } else {
        // Linux
        let home = std::env::var("HOME")
            .map_err(|_| "Impossibile trovare HOME".to_string())?;
        format!("{}/.local/share", home)
    };

    let mut path = PathBuf::from(data_dir);
    path.push("Jotly"); // Nome dell'app

    // Crea la directory se non esiste
    fs::create_dir_all(&path)
        .map_err(|e| format!("Impossibile creare directory app: {}", e))?;

    println!("App data directory: {:?}", path);
    Ok(path)
}

/// Percorso dove salvare il token in file
fn get_token_path() -> Result<PathBuf, String> {
    let mut path = get_app_data_dir()?;
    path.push("token.txt");
    Ok(path)
}

fn get_user_info_path() -> Result<PathBuf, String> {
    let mut path = get_app_data_dir()?;
    path.push("user_info.json");
    Ok(path)
}

async fn save_token(token: &str) -> Result<(), String> {
    let path = get_token_path()?;
    std::fs::write(&path, token)
        .map_err(|e| format!("Errore salvataggio token in {:?}: {}", path, e))?;
    println!("Token salvato in: {:?}", path);
    Ok(())
}

async fn load_token() -> Result<String, String> {
    let path = get_token_path()?;
    std::fs::read_to_string(&path)
        .map_err(|_| "Nessun token trovato".to_string())
}

async fn delete_token() -> Result<(), String> {
    let path = get_token_path()?;
    std::fs::remove_file(&path)
        .map_err(|_| "Errore cancellazione token".to_string())
}

async fn save_user_info(user: &UserInfo) -> Result<(), String> {
    let path = get_user_info_path()?;
    let json = serde_json::to_string(user)
        .map_err(|e| format!("Errore serializzazione: {}", e))?;
    std::fs::write(&path, json)
        .map_err(|e| format!("Errore salvataggio user info in {:?}: {}", path, e))?;
    println!("User info salvate in: {:?}", path);
    Ok(())
}

async fn load_user_info() -> Result<UserInfo, String> {
    let path = get_user_info_path()?;
    let json = std::fs::read_to_string(&path)
        .map_err(|_| "Nessuna info utente trovata".to_string())?;
    serde_json::from_str(&json)
        .map_err(|e| format!("Errore parsing user info: {}", e))
}

async fn delete_user_info() -> Result<(), String> {
    let path = get_user_info_path()?;
    std::fs::remove_file(&path)
        .map_err(|_| "Errore cancellazione user info".to_string())
}
