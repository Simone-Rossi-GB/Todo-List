use serde::{Deserialize, Serialize};
use serde_json::Value;
use base64::{Engine as _, engine::general_purpose};

// URL e chiave Supabase (stessi di auth.rs)
const SUPABASE_URL: &str = "https://zprhzalelveyqzzuazex.supabase.co";
const SUPABASE_KEY: &str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwcmh6YWxlbHZleXF6enVhemV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDEwODQsImV4cCI6MjA3NTQ3NzA4NH0.A7T9SLw6Myn1j3MwHAs3owpmzx_IZuYGQdFx_YuQdp4";

// ==================== HELPER FUNCTIONS ====================

/// Estrae lo user_id dal token JWT
fn extract_user_id_from_token(token: &str) -> Result<String, String> {
    // Il JWT è composto da 3 parti separate da punti: header.payload.signature
    let parts: Vec<&str> = token.split('.').collect();

    if parts.len() != 3 {
        return Err("Token JWT malformato".to_string());
    }

    // Decodifica il payload (seconda parte) da base64
    let payload_base64 = parts[1];

    // Aggiungi padding se necessario
    let padding = match payload_base64.len() % 4 {
        2 => "==",
        3 => "=",
        _ => "",
    };
    let payload_base64_padded = format!("{}{}", payload_base64, padding);

    // Decodifica da base64
    let payload_bytes = general_purpose::STANDARD.decode(&payload_base64_padded)
        .map_err(|e| format!("Errore decodifica base64: {}", e))?;

    // Converti in stringa JSON
    let payload_str = String::from_utf8(payload_bytes)
        .map_err(|e| format!("Errore conversione UTF-8: {}", e))?;

    // Parsea il JSON
    let payload_json: Value = serde_json::from_str(&payload_str)
        .map_err(|e| format!("Errore parsing JSON: {}", e))?;

    // Estrae il campo "sub" che contiene lo user_id
    let user_id = payload_json["sub"]
        .as_str()
        .ok_or("Campo 'sub' non trovato nel token")?
        .to_string();

    println!("User ID estratto dal token: {}", user_id);
    Ok(user_id)
}

// ==================== STRUTTURE DATI ====================

/// Struttura Nota per Supabase
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Note {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub user_id: Option<String>,
    pub title: String,
    pub description: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
}

/// Struttura per creare una nuova nota
#[derive(Serialize)]
struct CreateNoteRequest {
    user_id: String,
    title: String,
    description: String,
    status: String,
}

// ==================== COMANDI TAURI ====================

/// Carica tutte le note dell'utente da Supabase
#[tauri::command]
pub async fn load_notes(token: String) -> Result<Vec<Note>, String> {
    println!("Caricamento note da Supabase...");

    let client = reqwest::Client::new();

    let response = client
        .get(format!("{}/rest/v1/notes?select=*", SUPABASE_URL))
        .header("apikey", SUPABASE_KEY)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| format!("Errore connessione: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Errore caricamento note: {}", error_text));
    }

    let notes: Vec<Note> = response
        .json()
        .await
        .map_err(|e| format!("Errore parsing note: {}", e))?;

    println!("Caricate {} note", notes.len());
    Ok(notes)
}

/// Crea una nuova nota su Supabase
#[tauri::command]
pub async fn create_note(
    token: String,
    title: String,
    description: String,
    status: String,
) -> Result<Note, String> {
    println!("Creazione nota: {}", title);

    // Estrae lo user_id dal token
    let user_id = extract_user_id_from_token(&token)?;

    let client = reqwest::Client::new();

    let body = CreateNoteRequest {
        user_id,
        title,
        description,
        status,
    };

    let response = client
        .post(format!("{}/rest/v1/notes", SUPABASE_URL))
        .header("apikey", SUPABASE_KEY)
        .header("Authorization", format!("Bearer {}", token))
        .header("Content-Type", "application/json")
        .header("Prefer", "return=representation")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Errore connessione: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Errore creazione nota: {}", error_text));
    }

    let mut notes: Vec<Note> = response
        .json()
        .await
        .map_err(|e| format!("Errore parsing risposta: {}", e))?;

    let note = notes.pop().ok_or("Nessuna nota restituita")?;

    println!("Nota creata con ID: {:?}", note.id);
    Ok(note)
}

/// Aggiorna una nota esistente
#[tauri::command]
pub async fn update_note(
    token: String,
    note_id: String,
    title: String,
    description: String,
    status: String,
) -> Result<Note, String> {
    println!("Aggiornamento nota: {}", note_id);

    // Estrae lo user_id dal token
    let user_id = extract_user_id_from_token(&token)?;

    let client = reqwest::Client::new();

    let body = CreateNoteRequest {
        user_id,
        title,
        description,
        status,
    };

    let response = client
        .patch(format!("{}/rest/v1/notes?id=eq.{}", SUPABASE_URL, note_id))
        .header("apikey", SUPABASE_KEY)
        .header("Authorization", format!("Bearer {}", token))
        .header("Content-Type", "application/json")
        .header("Prefer", "return=representation")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Errore connessione: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Errore aggiornamento nota: {}", error_text));
    }

    let mut notes: Vec<Note> = response
        .json()
        .await
        .map_err(|e| format!("Errore parsing risposta: {}", e))?;

    let note = notes.pop().ok_or("Nessuna nota restituita")?;

    println!("Nota aggiornata: {}", note_id);
    Ok(note)
}

/// Elimina una nota
#[tauri::command]
pub async fn delete_note(token: String, note_id: String) -> Result<(), String> {
    println!("Eliminazione nota: {}", note_id);

    let client = reqwest::Client::new();

    let response = client
        .delete(format!("{}/rest/v1/notes?id=eq.{}", SUPABASE_URL, note_id))
        .header("apikey", SUPABASE_KEY)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| format!("Errore connessione: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Errore eliminazione nota: {}", error_text));
    }

    println!("Nota eliminata: {}", note_id);
    Ok(())
}

/// Sposta una nota in un'altra colonna (cambia status)
#[tauri::command]
pub async fn move_note(token: String, note_id: String, new_status: String) -> Result<Note, String> {
    println!("Spostamento nota {} a {}", note_id, new_status);

    let client = reqwest::Client::new();

    #[derive(Serialize)]
    struct MoveRequest {
        status: String,
    }

    let body = MoveRequest {
        status: new_status,
    };

    let response = client
        .patch(format!("{}/rest/v1/notes?id=eq.{}", SUPABASE_URL, note_id))
        .header("apikey", SUPABASE_KEY)
        .header("Authorization", format!("Bearer {}", token))
        .header("Content-Type", "application/json")
        .header("Prefer", "return=representation")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Errore connessione: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Errore spostamento nota: {}", error_text));
    }

    let mut notes: Vec<Note> = response
        .json()
        .await
        .map_err(|e| format!("Errore parsing risposta: {}", e))?;

    let note = notes.pop().ok_or("Nessuna nota restituita")?;

    println!("Nota spostata con successo");
    Ok(note)
}
