use bookie_core::ports::Clock;
use chrono::Utc;

/// Clock implementation using chrono for Cloudflare Workers
pub struct WorkerClock;

impl Clock for WorkerClock {
    fn now_rfc3339(&self) -> String {
        Utc::now().to_rfc3339()
    }
}
