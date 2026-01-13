/// Timer module for managing a simple timer with lap notes.
use serde::{Deserialize, Serialize};
use std::{
    sync::{Arc, Mutex},
    thread::{self, JoinHandle},
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use tauri::Emitter;
use tauri::{Manager, Window};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LapNote {
    pub timestamp_ms: u128,
    pub note: String,
    pub ref_page: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LapNoteLog {
    pub start_timestamp_ms: u128,
    pub end_timestamp_ms: Option<u128>,
    pub lap_notes: Vec<LapNote>,
}

#[derive(Default)]
struct TimerInner {
    is_running: bool,
    elapsed_ms: u128,
    start_instant_ms: Option<u128>,
    tick_handle: Option<JoinHandle<()>>,
    laps: Vec<LapNoteLog>,
}

#[derive(Default)]
pub struct TimerState(Arc<Mutex<TimerInner>>);

impl TimerState {
    pub fn new() -> Self {
        Self(Arc::new(Mutex::new(TimerInner {
            is_running: false,
            elapsed_ms: 0,
            start_instant_ms: None,
            tick_handle: None,
            laps: vec![],
        })))
    }
}

// Utility to get ms since epoch
fn now_ms() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis()
}

// Start emits "timer-tick" events every second to the given window
#[tauri::command]
pub fn start_timer(state: tauri::State<'_, TimerState>, window: Window) -> Result<(), String> {
    let state_arc = state.0.clone();
    let mut s = state_arc.lock().unwrap();
    if s.is_running {
        return Ok(());
    }

    s.is_running = true;
    s.start_instant_ms = Some(now_ms());
    // Create a new lap log session
    let ms = s.start_instant_ms.unwrap();
    s.laps.push(LapNoteLog {
        start_timestamp_ms: ms,
        end_timestamp_ms: None,
        lap_notes: vec![],
    });

    // Clone for thread
    let window_clone = window.clone();
    let state_for_thread = state_arc.clone();

    // Spawn thread to emit ticks
    let handle = thread::spawn(move || {
        while {
            let guard = state_for_thread.lock().unwrap();
            guard.is_running
        } {
            {
                // Update elapsed
                let mut guard = state_for_thread.lock().unwrap();
                let start = guard.start_instant_ms.unwrap_or(now_ms());
                guard.elapsed_ms = now_ms() - start;
            }
            // Emit event with elapsed (ms) and current laps
            let guard = state_for_thread.lock().unwrap();
            let payload = serde_json::json!({
              "elapsedMs": guard.elapsed_ms,
              "laps": guard.laps
            });
            let _ = window_clone.emit("timer-tick", payload);
            thread::sleep(Duration::from_millis(1000));
        }
    });

    s.tick_handle = Some(handle);
    Ok(())
}

#[tauri::command]
pub fn stop_timer(state: tauri::State<'_, TimerState>) -> Result<(), String> {
    let mut s = state.0.lock().unwrap();
    if !s.is_running {
        return Ok(());
    }
    s.is_running = false;
    // mark end timestamp for current lap session
    if let Some(last) = s.laps.last_mut() {
        last.end_timestamp_ms = Some(now_ms());
    }
    // join thread handle (best-effort)
    if let Some(handle) = s.tick_handle.take() {
        let _ = handle.join();
    }
    Ok(())
}

#[tauri::command]
pub fn reset_timer(state: tauri::State<'_, TimerState>) -> Result<(), String> {
    let mut s = state.0.lock().unwrap();
    s.is_running = false;
    s.elapsed_ms = 0;
    s.start_instant_ms = None;
    s.laps.clear();
    // join and clean up thread
    if let Some(handle) = s.tick_handle.take() {
        let _ = handle.join();
    }
    Ok(())
}

#[tauri::command]
pub fn get_time(state: tauri::State<'_, TimerState>) -> Result<u128, String> {
    let s = state.0.lock().unwrap();
    Ok(s.elapsed_ms)
}

#[tauri::command]
pub fn add_lap_note(
    state: tauri::State<'_, TimerState>,
    note: String,
    ref_page: i32,
) -> Result<(), String> {
    let mut s = state.0.lock().unwrap();
    let timestamp_ms = now_ms();
    if let Some(last) = s.laps.last_mut() {
        last.lap_notes.push(LapNote {
            timestamp_ms,
            note,
            ref_page,
        });
    }
    Ok(())
}

#[tauri::command]
pub fn get_laps(state: tauri::State<'_, TimerState>) -> Result<Vec<LapNoteLog>, String> {
    let s = state.0.lock().unwrap();
    Ok(s.laps.clone())
}
