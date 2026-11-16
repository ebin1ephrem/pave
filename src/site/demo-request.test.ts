import { describe, expect, it } from "vitest";
import { validateDemoRequest, type DemoRequest } from "./demo-request";

const valid: DemoRequest = {
  fullName: "Sample Person",
  workEmail: "person@example.org",
  organisation: "Sample incubator",
  role: "Program manager",
  orgType: "Incubator",
  country: "India",
  volume: "",
  message: "",
  consent: true,
};

describe("validateDemoRequest", () => {
  it("accepts a complete request with optional fields empty", () => {
    expect(validateDemoRequest(valid)).toEqual({});
  });

  it("uses the copy's wording for each error", () => {
    const e = validateDemoRequest({ ...valid, fullName: " ", workEmail: "nope", orgType: "", consent: false });
    expect(e).toEqual({
      fullName: "This field is required.",
      workEmail: "Please enter your work email.",
      orgType: "Please choose an organisation type.",
      consent: "This field is required.",
    });
  });

  it("lists errors in form order so focus goes to the first one", () => {
    const e = validateDemoRequest({ ...valid, country: "", role: "" });
    expect(Object.keys(e)).toEqual(["role", "country"]);
  });
});
