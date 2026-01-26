pub mod d1_adapter;

pub use d1_adapter::D1Database;
use worker::{Result, RouteContext};

pub fn database_from_ctx(ctx: &RouteContext<()>) -> Result<D1Database> {
    let d1 = ctx.env.d1("DB")?;
    Ok(D1Database::new(d1))
}
