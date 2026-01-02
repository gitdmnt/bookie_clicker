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
    pub ref_page: u32,
}

type Time = u128;

#[derive(Default)]
struct TimerInner {
    is_running: bool,
    tick_handle: Option<JoinHandle<()>>,
    lap_starts: Vec<Time>,
    lap_ends: Vec<Time>,
    lap_notes: Vec<LapNote>,
}

#[derive(Default)]
pub struct TimerState(Arc<Mutex<TimerInner>>);

impl TimerState {
    pub fn new() -> Self {
        Self(Arc::new(Mutex::new(TimerInner {
            is_running: false,
            tick_handle: None,
            lap_starts: vec![],
            lap_ends: vec![],
            lap_notes: vec![],
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
pub fn start_timer(
    timer_state: tauri::State<'_, TimerState>,
    window: Window,
) -> Result<(), String> {
    let timer_state_arc = timer_state.0.clone();
    let mut timer = timer_state_arc.lock().unwrap();
    if timer.is_running {
        return Ok(());
    }

    timer.is_running = true;
    timer.lap_starts.push(now_ms());
    // Clone for thread
    let window_clone = window.clone();
    let state_for_thread = timer_state_arc.clone();

    // Spawn thread to emit ticks
    let handle = thread::spawn(move || {
        while {
            let guard = state_for_thread.lock().unwrap();
            guard.is_running
        } {
            // Emit event with elapsed (ms) and current laps
            let guard = state_for_thread.lock().unwrap();
            let payload = serde_json::json!({
              "elapsedMs": now_ms() - guard.lap_starts.last().cloned().unwrap_or(now_ms()),
              "laps": guard.lap_notes,
            });
            let _ = window_clone.emit("timer-tick", payload);
            thread::sleep(Duration::from_millis(1000));
        }
    });

    timer.tick_handle = Some(handle);
    Ok(())
}

#[tauri::command]
pub fn stop_timer(timer_state: tauri::State<'_, TimerState>) -> Result<(), String> {
    let mut timer = timer_state.0.lock().unwrap();
    if !timer.is_running {
        return Ok(());
    }
    timer.is_running = false;
    timer.lap_ends.push(now_ms());
    // join thread handle (best-effort)
    if let Some(handle) = timer.tick_handle.take() {
        let _ = handle.join();
    }
    Ok(())
}

#[tauri::command]
pub fn reset_timer(timer_state: tauri::State<'_, TimerState>) -> Result<(), String> {
    let mut timer = timer_state.0.lock().unwrap();
    timer.is_running = false;
    timer.lap_starts.clear();
    timer.lap_ends.clear();
    timer.lap_notes.clear();
    // join and clean up thread
    if let Some(handle) = timer.tick_handle.take() {
        let _ = handle.join();
    }
    Ok(())
}

#[tauri::command]
pub fn get_time(timer_state: tauri::State<'_, TimerState>) -> Result<u128, String> {
    let timer = timer_state.0.lock().unwrap();
    unimplemented!()
}

#[tauri::command]
pub fn add_lap_note(
    timer_state: tauri::State<'_, TimerState>,
    note: String,
    ref_page: u32,
) -> Result<(), String> {
    let mut timer = timer_state.0.lock().unwrap();
    let timestamp_ms = now_ms();

    timer.lap_notes.push(LapNote {
        timestamp_ms,
        note,
        ref_page,
    });

    Ok(())
}

#[tauri::command]
pub fn get_laps(timer_state: tauri::State<'_, TimerState>) -> Result<Vec<LapNote>, String> {
    let timer = timer_state.0.lock().unwrap();
    Ok(timer.lap_notes.clone())
}
