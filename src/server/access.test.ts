import { describe, it, expect } from "vitest";
import { emailCanAccess } from "./access";

const admins = ["admin@example.org"];
const members = ["member@example.org"];

describe("restricted project access", () => {
  it("open projects admit everyone, even unauthenticated", () => {
    expect(emailCanAccess({ restricted: false }, [], null, admins)).toBe(true);
    expect(emailCanAccess({ restricted: false }, [], "anyone@x.org", admins)).toBe(true);
  });
  it("restricted projects admit members and admins only", () => {
    expect(emailCanAccess({ restricted: true }, members, "member@example.org", admins)).toBe(true);
    expect(emailCanAccess({ restricted: true }, members, "admin@example.org", admins)).toBe(true);
    expect(emailCanAccess({ restricted: true }, members, "other@example.org", admins)).toBe(false);
  });
  it("restricted projects fail closed without identity", () => {
    expect(emailCanAccess({ restricted: true }, members, null, admins)).toBe(false);
  });
});
