import { describe, expect, it, vi } from "vitest";
import { isTransientSqlError, withRetry } from "./db";
import { likePattern } from "./suppliers/repo";

describe("isTransientSqlError", () => {
  it("erkennt Resume-from-pause-Fehler, auch verschachtelt", () => {
    expect(isTransientSqlError({ number: 40613 })).toBe(true);
    expect(isTransientSqlError({ code: "ETIMEOUT" })).toBe(true);
    expect(isTransientSqlError(new Error("x", { cause: { number: 49919 } }))).toBe(true);
    expect(isTransientSqlError({ number: 2627 })).toBe(false); // Unique-Verletzung
  });
});

describe("withRetry", () => {
  it("wiederholt transiente Fehler und gibt dann das Ergebnis zurück", async () => {
    const fn = vi.fn().mockRejectedValueOnce({ number: 40613 }).mockResolvedValueOnce("ok");
    await expect(withRetry(fn, { delayMs: 0 })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("wirft nicht-transiente Fehler sofort", async () => {
    const fn = vi.fn().mockRejectedValue({ number: 2627 });
    await expect(withRetry(fn, { delayMs: 0 })).rejects.toEqual({ number: 2627 });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("likePattern", () => {
  it("escaped SQL-Server-Wildcards", () => {
    expect(likePattern("50%_[x]")).toBe("%50[%][_][[]x]%");
  });
});
