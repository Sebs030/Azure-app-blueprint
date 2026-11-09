import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

import { resolveUser } from "./auth";

const principal = (claims: { typ: string; val: string }[]) =>
  Buffer.from(JSON.stringify({ auth_typ: "aad", claims })).toString("base64");

describe("resolveUser", () => {
  it("liest Identität aus den Easy-Auth-Headern", () => {
    const h = new Headers({
      "x-ms-client-principal": principal([
        { typ: "name", val: "Erika Musterfrau" },
        { typ: "preferred_username", val: "erika@contoso.com" },
        { typ: "roles", val: "Admin" },
      ]),
      "x-ms-client-principal-id": "oid-123",
      "x-ms-client-principal-name": "erika@contoso.com",
    });
    expect(resolveUser(h, { NODE_ENV: "production" })).toEqual({
      id: "oid-123",
      name: "Erika Musterfrau",
      email: "erika@contoso.com",
      roles: ["Admin"],
    });
  });

  it("nutzt den Dev-Fallback nur außerhalb von Produktion", () => {
    const env = { DEV_USER_NAME: "dev@contoso.com", DEV_USER_ID: "dev-1" };
    expect(resolveUser(new Headers(), { ...env, NODE_ENV: "development" })?.id).toBe("dev-1");
    expect(resolveUser(new Headers(), { ...env, NODE_ENV: "production" })).toBeNull();
  });

  it("gibt null zurück bei kaputtem Principal-Header", () => {
    const h = new Headers({ "x-ms-client-principal": "%%%nicht-base64-json%%%" });
    expect(resolveUser(h, { NODE_ENV: "production" })).toBeNull();
  });
});
