use bookie_core::domain_services::reading_session::ReadingSession;
use bookie_core::models::Lap;
use serde::Serialize;
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::{async_runtime, Emitter};
use tokio::time;

// TimerManager delegates domain logic to ReadingSession
// and handles Tauri-specific event emission
#[derive(Clone)]
pub struct TimerManager(Arc<Mutex<Inner>>);

struct Inner {
    session: ReadingSession,
    tick_handle: Option<async_runtime::JoinHandle<()>>,
}

impl TimerManager {
    pub fn new() -> Self {
        TimerManager(Arc::new(Mutex::new(Inner {
            session: ReadingSession::new(),
            tick_handle: None,
        })))
    }

    pub fn start(&self, app: tauri::AppHandle) -> Result<(), String> {
        let mut inner = self.0.lock().unwrap();
        inner.session.start()?;

        let arc = self.0.clone();
        let app_handle = app.clone();

        // spawn tick loop for UI updates
        let handle = async_runtime::spawn(async move {
            let mut interval = time::interval(Duration::from_millis(1000));
            loop {
                interval.tick().await;

                let payload = {
                    let inner = arc.lock().unwrap();
                    if !inner.session.running {
                        break;
                    }
                    inner.get_tick()
                };
                let _ = app_handle.emit("timer:tick", payload);
            }
            // cleanup
            let mut inner = arc.lock().unwrap();
            inner.tick_handle = None;
        });

        inner.tick_handle = Some(handle);
        Ok(())
    }

    pub fn stop(&self) -> Result<(), String> {
        let mut inner = self.0.lock().unwrap();
        inner.session.stop()?;

        if let Some(handle) = inner.tick_handle.take() {
            handle.abort();
        }

        Ok(())
    }

    pub fn reset(&self) {
        let mut inner = self.0.lock().unwrap();
        if let Some(handle) = inner.tick_handle.take() {
            handle.abort();
        }
        inner.session.reset();
    }

    pub fn add_lap(&self, note: Option<String>, ref_page: Option<u32>) -> Lap {
        let mut inner = self.0.lock().unwrap();
        let created_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs().to_string())
            .unwrap_or_default();
        inner.session.add_lap(note, ref_page, created_at)
    }

    pub fn get_laps(&self) -> Vec<Lap> {
        let inner = self.0.lock().unwrap();
        inner.session.get_laps()
    }

    pub fn get_tick(&self) -> TimerTick {
        let inner = self.0.lock().unwrap();
        inner.get_tick()
    }
}

impl Inner {
    fn get_tick(&self) -> TimerTick {
        let elapsed = self.session.elapsed_ms();
        let secs = elapsed / 1000;
        let h = secs / 3600;
        let m = (secs % 3600) / 60;
        let s = secs % 60;
        TimerTick {
            elapsed,
            h,
            m,
            s,
            is_running: self.session.running,
        }
    }
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TimerTick {
    elapsed: u64,
    h: u64,
    m: u64,
    s: u64,
    is_running: bool,
}
