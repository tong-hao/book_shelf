mod commands;
mod db;
mod models;
mod services;

use db::migrations;
use std::path::PathBuf;

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
        .setup(|_app| {
            // 使用 ~/.book_shelf 作为数据目录
            let home = std::env::var("HOME").expect("HOME environment variable not set");
            let data_dir = PathBuf::from(&home).join(".book_shelf");
            std::fs::create_dir_all(&data_dir)
                .expect("Failed to create data directory ~/.book_shelf");

            let covers_dir = data_dir.join("covers");
            std::fs::create_dir_all(&covers_dir).ok();

            let db_path = data_dir.join("library.db");
            log::info!("Database path: {:?}", db_path);

            migrations::initialize(&db_path)
                .expect("Failed to initialize database");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
