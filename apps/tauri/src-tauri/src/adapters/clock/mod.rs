use bookie_core::ports::Clock;
use time::format_description::well_known::Rfc3339;
use time::OffsetDateTime;

/// System clock implementation using time crate
pub struct SystemClock;

impl Clock for SystemClock {
    fn now_rfc3339(&self) -> String {
        OffsetDateTime::now_utc()
            .format(&Rfc3339)
            .unwrap_or_else(|_| String::new())
    }
}

#[cfg(test)]
mod tests;
