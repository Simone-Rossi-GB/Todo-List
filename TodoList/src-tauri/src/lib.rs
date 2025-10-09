// Importa i moduli
mod auth;
mod notes;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            auth::login,
            auth::register,
            auth::logout,
            auth::get_saved_token,
            auth::get_user_info,
            auth::get_user_metadata,
            auth::change_password,
            auth::update_user_name,
            auth::update_username,
            auth::recover_password,
            notes::load_notes,
            notes::create_note,
            notes::update_note,
            notes::delete_note,
            notes::move_note
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
