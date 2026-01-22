use crate::domain::Lap;
use std::time::{Duration, Instant};

/// Pure domain logic for tracking reading sessions
#[derive(Debug)]
pub struct ReadingSession {
    pub running: bool,
    start_instant: Option<Instant>,
    elapsed: Duration,
    laps: Vec<Lap>,
}

impl ReadingSession {
    pub fn new() -> Self {
        ReadingSession {
            running: false,
            start_instant: None,
            elapsed: Duration::ZERO,
            laps: Vec::new(),
        }
    }

    pub fn start(&mut self) -> Result<(), String> {
        if self.running {
            return Err("session already running".to_string());
        }
        self.running = true;
        self.start_instant = Some(Instant::now());
        Ok(())
    }

    pub fn stop(&mut self) -> Result<(), String> {
        if !self.running {
            return Err("session not running".to_string());
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

    pub fn add_lap(
        &mut self,
        note: Option<String>,
        ref_page: Option<u32>,
        created_at: String,
    ) -> Lap {
        let elapsed = self.elapsed_ms();
        let lap = Lap {
            id: None,
            elapsed_ms: elapsed,
            note,
            ref_page,
            created_at,
        };
        self.laps.push(lap.clone());
        lap
    }

    pub fn get_laps(&self) -> Vec<Lap> {
        self.laps.clone()
    }
}

impl Default for ReadingSession {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_session() {
        let session = ReadingSession::new();
        assert!(!session.running);
        assert_eq!(session.elapsed_ms(), 0);
    }

    #[test]
    fn test_start_session() {
        let mut session = ReadingSession::new();
        assert!(session.start().is_ok());
        assert!(session.running);
        assert!(session.start().is_err()); // Cannot start twice
    }

    #[test]
    fn test_stop_session() {
        let mut session = ReadingSession::new();
        assert!(session.stop().is_err()); // Cannot stop before start

        session.start().unwrap();
        assert!(session.stop().is_ok());
        assert!(!session.running);
    }

    #[test]
    fn test_add_lap() {
        let mut session = ReadingSession::new();
        session.start().unwrap();

        std::thread::sleep(Duration::from_millis(10));

        let lap = session.add_lap(
            Some("test note".to_string()),
            Some(42),
            "2024-01-01".to_string(),
        );
        assert_eq!(lap.note, Some("test note".to_string()));
        assert_eq!(lap.ref_page, Some(42));
        assert!(lap.elapsed_ms > 0);

        assert_eq!(session.get_laps().len(), 1);
    }

    #[test]
    fn test_reset_session() {
        let mut session = ReadingSession::new();
        session.start().unwrap();
        std::thread::sleep(Duration::from_millis(10));
        session.add_lap(Some("lap1".to_string()), None, "2024-01-01".to_string());

        session.reset();
        assert!(!session.running);
        assert_eq!(session.elapsed_ms(), 0);
        assert_eq!(session.get_laps().len(), 0);
    }

    #[test]
    fn test_reset_while_running() {
        let mut session = ReadingSession::new();
        session.start().unwrap();
        std::thread::sleep(Duration::from_millis(10));

        session.reset();
        assert!(!session.running, "Reset should stop the session");
        assert_eq!(session.elapsed_ms(), 0);
    }

    #[test]
    fn test_multiple_laps() {
        let mut session = ReadingSession::new();
        session.start().unwrap();

        // 複数のラップを追加
        for i in 1..=3 {
            std::thread::sleep(Duration::from_millis(10));
            session.add_lap(Some(format!("lap{}", i)), Some(i), "2024-01-01".to_string());
        }

        let laps = session.get_laps();
        assert_eq!(laps.len(), 3);
        assert_eq!(laps[0].note, Some("lap1".to_string()));
        assert_eq!(laps[1].note, Some("lap2".to_string()));
        assert_eq!(laps[2].note, Some("lap3".to_string()));
    }

    #[test]
    fn test_elapsed_time_increases() {
        let mut session = ReadingSession::new();
        session.start().unwrap();

        let elapsed1 = session.elapsed_ms();
        std::thread::sleep(Duration::from_millis(50));
        let elapsed2 = session.elapsed_ms();

        assert!(elapsed2 > elapsed1, "Elapsed time should increase");
        assert!(elapsed2 >= 50, "Should have elapsed at least 50ms");
    }

    #[test]
    fn test_elapsed_time_frozen_after_stop() {
        let mut session = ReadingSession::new();
        session.start().unwrap();
        std::thread::sleep(Duration::from_millis(50));
        session.stop().unwrap();

        let elapsed1 = session.elapsed_ms();
        std::thread::sleep(Duration::from_millis(50));
        let elapsed2 = session.elapsed_ms();

        assert_eq!(
            elapsed1, elapsed2,
            "Elapsed time should not increase after stop"
        );
    }

    #[test]
    fn test_lap_without_start() {
        let mut session = ReadingSession::new();

        // start前にラップを追加しても問題ない（0ms経過として記録される）
        let lap = session.add_lap(Some("note".to_string()), None, "2024-01-01".to_string());
        assert_eq!(lap.elapsed_ms, 0);
    }
}
