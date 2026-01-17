use tauri::State;

use crate::db::Lap;
use crate::timer::{TimerManager, TimerTick};

#[tauri::command]
pub fn timer_get(state: State<'_, TimerManager>) -> Result<TimerTick, String> {
    Ok(state.get_tick())
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
) -> Result<Lap, String> {
    Ok(state.add_lap(note, ref_page))
}

#[tauri::command]
pub fn timer_get_laps(state: State<'_, TimerManager>) -> Result<Vec<Lap>, String> {
    Ok(state.get_laps())
}
