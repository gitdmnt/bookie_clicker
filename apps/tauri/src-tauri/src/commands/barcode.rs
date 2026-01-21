use base64::{engine::general_purpose, Engine};
use image::{self, imageops, DynamicImage, GenericImageView, GrayImage, ImageBuffer, Luma};
use rxing;
use std::fs;

use crate::api::isbn::parse_isbn;

const PADDING_RATIO: f32 = 0.6;
const MULTI_LINE_COUNT: u32 = 7;
const MIN_STRIP_HEIGHT: u32 = 24;
const MAX_DIMENSION: u32 = 1600;

fn binarize_otsu(gray: &GrayImage) -> GrayImage {
    let mut hist = [0u32; 256];
    for p in gray.pixels() {
        hist[p[0] as usize] += 1;
    }

    let total = (gray.width() * gray.height()) as f64;
    let mut sum = 0f64;
    for i in 0..256 {
        sum += (i as f64) * (hist[i] as f64);
    }

    let mut sum_b = 0f64;
    let mut w_b = 0f64;
    let mut w_f;
    let mut var_max = 0f64;
    let mut threshold = 0u8;

    for i in 0..256 {
        w_b += hist[i] as f64;
        if w_b == 0f64 {
            continue;
        }

        w_f = total - w_b;
        if w_f == 0f64 {
            break;
        }

        sum_b += (i as f64) * (hist[i] as f64);

        let m_b = sum_b / w_b;
        let m_f = (sum - sum_b) / w_f;
        let var_between = w_b * w_f * (m_b - m_f) * (m_b - m_f);

        if var_between > var_max {
            var_max = var_between;
            threshold = i as u8;
        }
    }

    let mut binary = ImageBuffer::new(gray.width(), gray.height());
    for (x, y, p) in gray.enumerate_pixels() {
        let v = if p[0] > threshold { 255u8 } else { 0u8 };
        binary.put_pixel(x, y, Luma([v]));
    }

    binary
}

fn add_padding_white_gray(img: &GrayImage, ratio: f32) -> GrayImage {
    let (width, height) = img.dimensions();

    let pad_x = (width as f32 * ratio).round() as u32;
    let pad_y = (height as f32 * ratio).round() as u32;

    let padded_width = width + pad_x * 2;
    let padded_height = height + pad_y * 2;

    let mut padded = ImageBuffer::from_pixel(padded_width, padded_height, Luma([255u8]));
    imageops::overlay(&mut padded, img, pad_x as i64, pad_y as i64);

    padded
}

fn maybe_downscale(img: DynamicImage) -> DynamicImage {
    let (width, height) = img.dimensions();
    let max_dim = width.max(height);
    if max_dim <= MAX_DIMENSION {
        return img;
    }

    let scale = MAX_DIMENSION as f32 / max_dim as f32;
    let new_width = (width as f32 * scale).round().max(1.0) as u32;
    let new_height = (height as f32 * scale).round().max(1.0) as u32;

    let resized = imageops::resize(&img, new_width, new_height, imageops::FilterType::Lanczos3);
    DynamicImage::ImageRgba8(resized)
}

fn detect_in_multi_lines(gray: &GrayImage) -> Result<String, String> {
    let (width, height) = gray.dimensions();

    // まず全体で検出
    let luma_full = gray.clone().into_raw();
    if let Ok(res) = rxing::helpers::detect_in_luma(luma_full, width, height, None) {
        let raw = res.getText().to_string();
        if let Ok(isbn) = parse_isbn(&raw) {
            return Ok(isbn.to_string());
        }
    }

    if MULTI_LINE_COUNT <= 1 || height == 0 {
        return Err("バーコード検出エラー: NotFoundException(\"\")".to_string());
    }

    let strip_height = (height / 15).max(MIN_STRIP_HEIGHT).min(height);
    let step = if MULTI_LINE_COUNT > 1 {
        (height.saturating_sub(strip_height)) / (MULTI_LINE_COUNT - 1)
    } else {
        0
    };

    for i in 0..MULTI_LINE_COUNT {
        let y = (i * step).min(height.saturating_sub(strip_height));
        let view = imageops::crop_imm(gray, 0, y, width, strip_height).to_image();
        let luma = view.into_raw();

        if let Ok(res) = rxing::helpers::detect_in_luma(luma, width, strip_height, None) {
            let raw = res.getText().to_string();
            if let Ok(isbn) = parse_isbn(&raw) {
                return Ok(isbn.to_string());
            }
        }
    }

    Err("バーコード検出エラー: NotFoundException(\"\")".to_string())
}

#[tauri::command]
pub async fn scan_barcode(
    image_data: String,
    _save_debug_images: Option<bool>,
) -> Result<String, String> {
    let bytes = general_purpose::STANDARD
        .decode(&image_data)
        .map_err(|e| format!("画像データのデコードに失敗しました: {}", e))?;

    // 一時ファイルに保存してからimage::openを使用
    let temp_dir = std::env::temp_dir();
    let temp_path = temp_dir.join(format!(
        "barcode_scan_{}.jpg",
        chrono::Utc::now().timestamp()
    ));

    fs::write(&temp_path, &bytes)
        .map_err(|e| format!("一時ファイルの書き込みに失敗しました: {}", e))?;

    // image::openで読み込み
    let img = image::open(&temp_path).map_err(|e| {
        let _ = fs::remove_file(&temp_path);
        format!("画像のデコードに失敗しました: {}", e)
    })?;

    let img = maybe_downscale(img);

    // 2値化 → パディング → 複数ラインスキャン
    let gray = img.to_luma8();
    let binary = binarize_otsu(&gray);
    let padded = add_padding_white_gray(&binary, PADDING_RATIO);

    let result = detect_in_multi_lines(&padded);

    // 一時ファイルを削除
    let _ = fs::remove_file(&temp_path);

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    fn diagnose_image(path: &std::path::Path, name: &str) {
        println!("🔍 診断: {}", name);
        println!("📁 パス: {:?}", path);

        if !path.exists() {
            println!("❌ ファイルが存在しません");
            return;
        }

        // ファイルサイズ
        let file_size = std::fs::metadata(path).unwrap().len();
        println!(
            "📦 ファイルサイズ: {} bytes ({:.2} KB)",
            file_size,
            file_size as f64 / 1024.0
        );

        // 画像を読み込み
        let img = match image::open(path) {
            Ok(img) => img,
            Err(e) => {
                println!("❌ 画像読み込みエラー: {:?}", e);
                return;
            }
        };

        println!("📐 サイズ: {}x{}", img.width(), img.height());

        // グレースケール変換
        let gray = img.to_luma8();
        let (width, height) = gray.dimensions();

        // rxingで検出
        println!("🔍 バーコード検出開始 (rxing)...");
        let luma = gray.into_raw();

        let result = rxing::helpers::detect_in_luma(luma, width, height, None);

        match result {
            Ok(res) => {
                println!("✅ 成功: {}", res.getText());
                println!("📝 フォーマット: {:?}", res.getBarcodeFormat());
            }
            Err(e) => {
                println!("❌ 失敗: {:?}", e);
            }
        }
    }

    #[test]
    fn test_barcode_detection() {
        let home_dir = dirs::data_dir().expect("データディレクトリが見つかりません");
        let debug_dir = home_dir.join("bookie_clicker").join("barcode_debug");

        let test_images = vec![
            ("固定画像1 (a.jpg)", debug_dir.join("a.jpg")),
            (
                "固定画像2 (70.png)",
                debug_dir.join("1768810685_3_binary_otsu_70.png"),
            ),
            (
                "固定画像3 (702.png)",
                debug_dir.join("1768810685_3_binary_otsu_702.png"),
            ),
            (
                "固定画像4 (703.png)",
                debug_dir.join("1768810685_3_binary_otsu_703.png"),
            ),
        ];

        for (name, path) in test_images {
            diagnose_image(&path, name);
        }
    }
}
