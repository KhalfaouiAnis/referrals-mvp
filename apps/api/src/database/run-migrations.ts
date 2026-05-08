import "reflect-metadata";
import { AppDataSource } from "./data-source";

async function runMigrations(): Promise<void> {
  console.log("[migrate] Initialising data source…");
  await AppDataSource.initialize();

  const pending = await AppDataSource.showMigrations();
  if (!pending) {
    console.log("[migrate] No pending migrations — database is up to date.");
  } else {
    console.log("[migrate] Running pending migrations…");
    const executed = await AppDataSource.runMigrations({ transaction: "each" });
    console.log(`[migrate] Applied ${executed.length} migration(s):`);
    executed.forEach((m) => console.log(`  ✓ ${m.name}`));
  }

  await AppDataSource.destroy();
  console.log("[migrate] Done.");
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error("[migrate] FAILED:", err);
  process.exit(1);
});
