import { describe, expect, it } from "vitest";
import { describeEmails, parseCsv, readStartupCsv } from "./api";

describe("parseCsv", () => {
  it("reads quoted fields, doubled quotes, CRLF and skips blank lines", () => {
    expect(parseCsv('a,b\r\n"Acme, Inc.","say ""hi"""\n\n1,2')).toEqual([["a", "b"], ["Acme, Inc.", 'say "hi"'], ["1", "2"]]);
  });
});

describe("readStartupCsv", () => {
  it("maps columns by header name and flags bad rows", () => {
    const { rows, error } = readStartupCsv("founder_email,startup_name,sector\nA@Example.org,Alpha,agri\nnot-an-email,Beta,\nc@example.org,,x\n");
    expect(error).toBeNull();
    expect(rows.map((r) => r.problem)).toEqual([null, "Founder email is not valid", "Startup name is missing"]);
    expect(rows[0]).toMatchObject({ line: 2, name: "Alpha", founderEmail: "a@example.org", sector: "agri" });
  });

  it("rejects a file without the required columns or without rows", () => {
    expect(readStartupCsv("name,email\nA,b@example.org").error).toMatch(/columns/);
    expect(readStartupCsv("startup_name,founder_email\n").error).toMatch(/no rows/);
  });

  it("allows a startup with no founder yet", () => {
    expect(readStartupCsv("startup_name,founder_email\nAlpha,\n").rows[0]!.problem).toBeNull();
  });
});

describe("describeEmails", () => {
  it("says plainly when mail was not sent", () => {
    expect(describeEmails([{ to_email: "a@example.org", status: "skipped", detail: null }])).toBe(
      "1 not sent because no email provider is set up.",
    );
    expect(describeEmails([{ to_email: "a@example.org", status: "skipped", detail: "Reserved test address; nothing was sent" }])).toBe(
      "1 not sent because the address is a reserved test address.",
    );
    expect(describeEmails([])).toBe("No one to email.");
  });
});
