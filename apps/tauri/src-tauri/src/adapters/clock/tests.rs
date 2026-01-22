use bookie_core::ports::Clock;

use crate::adapters::clock::SystemClock;

#[test]
fn test_system_clock_rfc3339_format() {
    let clock = SystemClock;
    let timestamp = clock.now_rfc3339();
    
    // RFC3339形式: YYYY-MM-DDTHH:MM:SSZ
    assert!(!timestamp.is_empty(), "Timestamp should not be empty");
    assert!(timestamp.contains('T'), "RFC3339 must contain 'T' separator");
    assert!(timestamp.ends_with('Z') || timestamp.contains('+') || timestamp.contains('-'), 
        "RFC3339 must have timezone indicator");
    
    // 基本的な長さチェック (最小: "2024-01-22T12:00:00Z" = 20文字)
    assert!(timestamp.len() >= 20, "RFC3339 timestamp should be at least 20 characters");
}

#[test]
fn test_system_clock_consistency() {
    let clock = SystemClock;
    let time1 = clock.now_rfc3339();
    std::thread::sleep(std::time::Duration::from_millis(10));
    let time2 = clock.now_rfc3339();
    
    // 時刻は進んでいるはず
    assert_ne!(time1, time2, "Timestamps should be different after sleep");
    assert!(time2 > time1, "Second timestamp should be later");
}
