import { describe, expect, it } from "vitest";
import { validateNewPassword, validateSignup } from "@/lib/auth";

const ok = { name: "Luis Felipe", email: "luis@exemplo.com", password: "segredo1", confirm: "segredo1" };

describe("sign-up rules", () => {
  it("accepts a complete form", () => {
    expect(validateSignup(ok)).toBeNull();
  });
  it("requires a name with at least 3 characters", () => {
    expect(validateSignup({ ...ok, name: "Lu" })).not.toBeNull();
  });
  it("requires a valid e-mail", () => {
    expect(validateSignup({ ...ok, email: "luis@" })).not.toBeNull();
  });
  it("rejects passwords shorter than 6 characters", () => {
    expect(validateNewPassword("12345", "12345")).not.toBeNull();
    expect(validateNewPassword("123456", "123456")).toBeNull();
  });
  it("rejects a confirmation that does not match", () => {
    expect(validateNewPassword("segredo1", "segredo2")).not.toBeNull();
  });
});
