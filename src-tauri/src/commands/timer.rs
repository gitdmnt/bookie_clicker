use tauri::State;

use crate::timer::{LapRecord, TimerManager};

#[tauri::command]
pub fn timer_get(state: State<'_, TimerManager>) -> Result<u64, String> {
    Ok(state.elapsed_ms())
}

#[tauri::command]
pub fn timer_start(state: State<'_, TimerManager>, app: tauri::AppHandle) -> Result<(), String> {
    state.start(app)
}

#[tauri::command]
pub fn timer_stop(state: State<'_, TimerManager>) -> Result<(), String> {
    state.stop()
}

#[tauri::command]
pub fn timer_reset(state: State<'_, TimerManager>) -> Result<(), String> {
    state.reset();
    Ok(())
}

#[tauri::command]
pub fn timer_lap(
    state: State<'_, TimerManager>,
    note: Option<String>,
    ref_page: Option<u32>,
) -> Result<LapRecord, String> {
    let lap = state.add_lap(note, ref_page);
    Ok(LapRecord::from(lap))
}

#[tauri::command]
pub fn timer_get_laps(state: State<'_, TimerManager>) -> Result<Vec<LapRecord>, String> {
    Ok(state.get_laps().into_iter().map(LapRecord::from).collect())
}
