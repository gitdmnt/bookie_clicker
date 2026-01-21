use crate::db::Lap;
use serde::Serialize;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tauri::{async_runtime, Emitter};
use tokio::time;

#[derive(Debug)]
pub struct Timer {
    pub running: bool,
    pub start_instant: Option<Instant>,
    pub elapsed: Duration, // accumulated
    pub laps: Vec<Lap>,
}

impl Timer {
    pub fn new() -> Self {
        Timer {
            running: false,
            start_instant: None,
            elapsed: Duration::ZERO,
            laps: Vec::new(),
        }
    }

    pub fn start(&mut self) -> Result<(), String> {
        if self.running {
            return Err("timer already running".to_string());
        }
        self.running = true;
        self.start_instant = Some(Instant::now());
        Ok(())
    }

    pub fn stop(&mut self) -> Result<(), String> {
        if !self.running {
            return Err("timer not running".to_string());
        }
        if let Some(s) = self.start_instant {
            let dur = s.elapsed();
            self.elapsed += dur;
        }
        self.start_instant = None;
        self.running = false;
        Ok(())
    }

    pub fn reset(&mut self) {
        self.running = false;
        self.start_instant = None;
        self.elapsed = Duration::ZERO;
        self.laps.clear();
    }

    pub fn elapsed_ms(&self) -> u64 {
        let mut e = self.elapsed;
        if let Some(s) = self.start_instant {
            e += s.elapsed();
        }
        e.as_millis() as u64
    }

    pub fn add_lap(&mut self, note: Option<String>, ref_page: Option<u32>) -> Lap {
        let elapsed = self.elapsed_ms();
        let lap = Lap {
            id: None,
            elapsed_ms: elapsed,
            note,
            ref_page,
            created_at: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map(|d| d.as_secs().to_string())
                .unwrap_or_default(),
        };
        self.laps.push(lap.clone());
        lap
    }

    pub fn get_laps(&self) -> Vec<Lap> {
        self.laps.clone()
    }
}

#[derive(Clone)]
pub struct TimerManager(Arc<Mutex<Inner>>);

struct Inner {
    timer: Timer,
    tick_handle: Option<async_runtime::JoinHandle<()>>, // handle for the tick loop
}

impl TimerManager {
    pub fn new() -> Self {
        TimerManager(Arc::new(Mutex::new(Inner {
            timer: Timer::new(),
            tick_handle: None,
        })))
    }

    pub fn start(&self, app: tauri::AppHandle) -> Result<(), String> {
        let mut inner = self.0.lock().unwrap();
        inner.timer.start()?;

        let arc = self.0.clone();
        let app_handle = app.clone();

        // spawn tick loop
        let handle = async_runtime::spawn(async move {
            let mut interval = time::interval(Duration::from_millis(1000));
            loop {
                interval.tick().await;
                // check running state

                let payload = {
                    let inner = arc.lock().unwrap();
                    if !inner.timer.running {
                        break;
                    }
                    inner.get_tick()
                };
                let _ = app_handle.emit("timer:tick", payload);
            }
            // loop finished: clear tick_handle to avoid stale reference
            let mut inner = arc.lock().unwrap();
            inner.tick_handle = None;
        });

        inner.tick_handle = Some(handle);
        Ok(())
    }

    pub fn stop(&self) -> Result<(), String> {
        let mut inner = self.0.lock().unwrap();

        // stop timer logic
        inner.timer.stop()?;

        // abort tick task if exists
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
        inner.timer.reset();
    }

    pub fn elapsed_ms(&self) -> u64 {
        let inner = self.0.lock().unwrap();
        inner.timer.elapsed_ms()
    }

    pub fn add_lap(&self, note: Option<String>, ref_page: Option<u32>) -> Lap {
        let mut inner = self.0.lock().unwrap();
        inner.timer.add_lap(note, ref_page)
    }

    pub fn get_laps(&self) -> Vec<Lap> {
        let inner = self.0.lock().unwrap();
        inner.timer.get_laps()
    }

    pub fn is_running(&self) -> bool {
        let inner = self.0.lock().unwrap();
        inner.timer.running
    }

    pub fn get_tick(&self) -> TimerTick {
        let inner = self.0.lock().unwrap();
        inner.get_tick()
    }
}

impl Inner {
    fn get_tick(&self) -> TimerTick {
        let elapsed = self.timer.elapsed_ms();
        let secs = elapsed / 1000;
        let h = secs / 3600;
        let m = (secs % 3600) / 60;
        let s = secs % 60;
        TimerTick {
            elapsed,
            h,
            m,
            s,
            is_running: self.timer.running,
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
