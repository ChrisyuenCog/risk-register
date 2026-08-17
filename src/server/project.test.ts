import { describe, it, expect } from "vitest";
import { chooseDefaultProject } from "./project";
import { slugify } from "../lib/slug";

const proj = (name: string, ...emails: string[]) => ({
  name,
  members: emails.map((email) => ({ user: { email } })),
});

describe("chooseDefaultProject", () => {
  const sseip = proj("SSEIP");
  const board = proj("Board", "sean@cognitioneducation.com");
  it("prefers a project the user is a member of", () => {
    expect(chooseDefaultProject([sseip, board], "sean@cognitioneducation.com")).toBe(board);
  });
  it("falls back to first accessible for non-members", () => {
    expect(chooseDefaultProject([sseip, board], "other@cognitioneducation.com")).toBe(sseip);
  });
  it("falls back to first accessible without identity", () => {
    expect(chooseDefaultProject([sseip, board], null)).toBe(sseip);
  });
});

describe("slugify", () => {
  it("makes URL-safe slugs", () => {
    expect(slugify("Board")).toBe("board");
    expect(slugify("SI SSEIP")).toBe("si-sseip");
    expect(slugify("NDS — LMS (2026)")).toBe("nds-lms-2026");
  });
});
