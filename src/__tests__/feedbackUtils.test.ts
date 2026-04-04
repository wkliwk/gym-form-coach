import { validateMessage, buildEmailSubject, buildEmailBody } from "../lib/feedbackUtils";

describe("validateMessage", () => {
  it("returns error for empty message", () => {
    expect(validateMessage("")).toBe("Message is required");
  });

  it("returns error for whitespace-only message", () => {
    expect(validateMessage("   ")).toBe("Message is required");
  });

  it("returns error for message under 10 chars", () => {
    expect(validateMessage("too short")).toBe("Please write at least 10 characters");
  });

  it("returns null for valid message", () => {
    expect(validateMessage("This is a valid feedback message")).toBeNull();
  });

  it("returns null for exactly 10 chars", () => {
    expect(validateMessage("1234567890")).toBeNull();
  });
});

describe("buildEmailSubject", () => {
  it("includes category label", () => {
    expect(buildEmailSubject("bug")).toContain("Bug Report");
  });

  it("includes app name", () => {
    expect(buildEmailSubject("feature")).toContain("Gym Form Coach");
  });
});

describe("buildEmailBody", () => {
  it("includes the message", () => {
    const body = buildEmailBody("My feedback", "general", false);
    expect(body).toContain("My feedback");
  });

  it("includes device info when enabled", () => {
    const body = buildEmailBody("My feedback", "bug", true);
    expect(body).toContain("Device:");
    expect(body).toContain("Category: Bug Report");
  });

  it("excludes device info when disabled", () => {
    const body = buildEmailBody("My feedback", "bug", false);
    expect(body).not.toContain("Device:");
  });
});
