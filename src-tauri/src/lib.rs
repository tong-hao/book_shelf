mod commands;
mod db;
mod models;
mod services;

use db::migrations;
use std::path::PathBuf;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::books::get_books,
            commands::books::get_book,
            commands::books::update_book_field,
            commands::books::delete_book,
            commands::books::delete_books,
            commands::books::update_book_cover,
            commands::books::open_book_file,
            commands::tags::list_tags,
            commands::tags::list_tags_with_count,
            commands::tags::create_tag,
            commands::tags::update_tag_color,
            commands::tags::delete_tag,
            commands::tags::add_tags_to_books,
            commands::tags::remove_tag_from_book,
            commands::scan::scan_directory,
            commands::scan::search_books,
            commands::import::import_books_csv,
        ])
        .setup(|app| {
            // Initialize database
            let app_data_dir: PathBuf = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            std::fs::create_dir_all(&app_data_dir)
                .expect("Failed to create app data directory");

            let covers_dir = app_data_dir.join("covers");
            std::fs::create_dir_all(&covers_dir).ok();

            let db_path = app_data_dir.join("library.db");
            log::info!("Database path: {:?}", db_path);

            migrations::initialize(&db_path)
                .expect("Failed to initialize database");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
