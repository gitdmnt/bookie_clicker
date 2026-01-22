use base64::{engine::general_purpose, Engine};
use std::fs;
use time::OffsetDateTime;

use crate::api::isbn::parse_isbn;
use crate::services::barcode_processor::BarcodeProcessor;

#[tauri::command]
pub async fn scan_barcode(
    image_data: String,
    _save_debug_images: Option<bool>,
) -> Result<String, String> {
    let bytes = general_purpose::STANDARD
        .decode(&image_data)
        .map_err(|e| format!("画像データのデコードに失敗しました: {}", e))?;

    // Save to temporary file for compatibility
    let temp_dir = std::env::temp_dir();
    let temp_path = temp_dir.join(format!(
        "barcode_scan_{}.jpg",
        OffsetDateTime::now_utc().unix_timestamp()
    ));

    fs::write(&temp_path, &bytes)
        .map_err(|e| format!("一時ファイルの書き込みに失敗しました: {}", e))?;

    // Use BarcodeProcessor service
    let result = BarcodeProcessor::scan(&bytes);

    // Validate ISBN format
    let result = result.and_then(|raw_text| {
        parse_isbn(&raw_text)
            .map(|isbn| isbn.to_string())
            .map_err(|_| {
                format!(
                    "バーコード検出エラー: 有効なISBNではありません (検出値: {})",
                    raw_text
                )
            })
    });

    // Cleanup temporary file
    let _ = fs::remove_file(&temp_path);

    result
}
