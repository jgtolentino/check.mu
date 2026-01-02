import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getEnv, getServerUrl } from "./env";
import { ShelfError } from "./error";

// why: Mock isBrowser to ensure we're testing server-side behavior
vi.mock("./is-browser", () => ({
  isBrowser: false,
}));

describe("getEnv", () => {
  beforeEach(() => {
    // why: Clear all env stubs before each test
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    // why: Clean up env stubs after each test
    vi.unstubAllEnvs();
  });

  describe("default behavior (isRequired=true, allowEmpty=false)", () => {
    it("should throw error when env var is not set", () => {
      // why: Explicitly stub as undefined to test missing var case
      vi.stubEnv("ADMIN_EMAIL", undefined);

      expect(() => {
        getEnv("ADMIN_EMAIL");
      }).toThrow(ShelfError);
    });

    it("should throw error when env var is empty string", () => {
      vi.stubEnv("ADMIN_EMAIL", "");

      expect(() => {
        getEnv("ADMIN_EMAIL");
      }).toThrow(ShelfError);
    });

    it("should return value when env var is set", () => {
      vi.stubEnv("ADMIN_EMAIL", "admin@example.com");

      const result = getEnv("ADMIN_EMAIL");

      expect(result).toBe("admin@example.com");
    });
  });

  describe("with allowEmpty=true", () => {
    it("should throw error when env var is not set", () => {
      // why: Test that isRequired defaults to true even with partial options
      vi.stubEnv("STRIPE_WEBHOOK_ENDPOINT_SECRET", undefined);

      expect(() => {
        getEnv("STRIPE_WEBHOOK_ENDPOINT_SECRET", {
          allowEmpty: true,
          // Note: NOT passing isRequired - should default to true
        });
      }).toThrow(ShelfError);
    });

    it("should allow empty string when env var is set to empty", () => {
      vi.stubEnv("STRIPE_WEBHOOK_ENDPOINT_SECRET", "");

      const result = getEnv("STRIPE_WEBHOOK_ENDPOINT_SECRET", {
        allowEmpty: true,
      });

      expect(result).toBe("");
    });

    it("should return value when env var is set", () => {
      vi.stubEnv("STRIPE_WEBHOOK_ENDPOINT_SECRET", "whsec_test123");

      const result = getEnv("STRIPE_WEBHOOK_ENDPOINT_SECRET", {
        allowEmpty: true,
      });

      expect(result).toBe("whsec_test123");
    });
  });

  describe("with isRequired=false", () => {
    it("should return undefined when env var is not set", () => {
      // why: Explicitly stub as undefined to test missing var case
      vi.stubEnv("DIRECT_URL", undefined);

      const result = getEnv("DIRECT_URL", { isRequired: false });

      expect(result).toBeUndefined();
    });

    it("should return empty string when env var is empty string", () => {
      vi.stubEnv("ADMIN_EMAIL", "");

      const result = getEnv("ADMIN_EMAIL", { isRequired: false });

      expect(result).toBe("");
    });

    it("should return value when env var is set", () => {
      vi.stubEnv("ADMIN_EMAIL", "admin@example.com");

      const result = getEnv("ADMIN_EMAIL", { isRequired: false });

      expect(result).toBe("admin@example.com");
    });
  });

  describe("with allowEmpty=true and isRequired=false", () => {
    it("should return undefined when env var is not set", () => {
      // why: Explicitly stub as undefined to test missing var case
      vi.stubEnv("SMTP_PORT", undefined);

      const result = getEnv("SMTP_PORT", {
        isRequired: false,
        allowEmpty: true,
      });

      expect(result).toBeUndefined();
    });

    it("should return empty string when env var is set to empty", () => {
      vi.stubEnv("SMTP_FROM", "");

      const result = getEnv("SMTP_FROM", {
        isRequired: false,
        allowEmpty: true,
      });

      expect(result).toBe("");
    });

    it("should return value when env var is set", () => {
      vi.stubEnv("SMTP_FROM", "noreply@example.com");

      const result = getEnv("SMTP_FROM", {
        isRequired: false,
        allowEmpty: true,
      });

      expect(result).toBe("noreply@example.com");
    });
  });

  describe("SMTP credentials use case", () => {
    it("should throw error when required var with allowEmpty is missing", () => {
      // why: Matches real usage - only passing allowEmpty, isRequired defaults
      vi.stubEnv("DISABLE_SSO", undefined);

      expect(() => {
        getEnv("DISABLE_SSO", { allowEmpty: true });
      }).toThrow(ShelfError);
      expect(() => {
        getEnv("DISABLE_SSO", { allowEmpty: true });
      }).toThrow("DISABLE_SSO is not set");
    });

    it("should allow empty string when explicitly set (SMTP no-auth case)", () => {
      vi.stubEnv("DISABLE_SSO", "");

      const result = getEnv("DISABLE_SSO", { allowEmpty: true });

      expect(result).toBe("");
    });

    it("should accept actual value when provided", () => {
      vi.stubEnv("DISABLE_SSO", "true");

      const result = getEnv("DISABLE_SSO", { allowEmpty: true });

      expect(result).toBe("true");
    });
  });

  describe("strict validation for critical env vars", () => {
    it("should throw error when DATABASE_URL is empty string", () => {
      vi.stubEnv("DATABASE_URL", "");

      expect(() => {
        getEnv("DATABASE_URL");
      }).toThrow(ShelfError);
      expect(() => {
        getEnv("DATABASE_URL");
      }).toThrow("DATABASE_URL is not set");
    });

    it("should throw error when SESSION_SECRET is empty string", () => {
      vi.stubEnv("SESSION_SECRET", "");

      expect(() => {
        getEnv("SESSION_SECRET");
      }).toThrow(ShelfError);
    });
  });
});

describe("getServerUrl", () => {
  beforeEach(() => {
    // why: Clear all env stubs before each test to ensure clean state
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    // why: Clean up env stubs after each test
    vi.unstubAllEnvs();
  });

  it("should return SERVER_URL when explicitly set", () => {
    vi.stubEnv("SERVER_URL", "https://my-app.example.com");
    vi.stubEnv("VERCEL_URL", "my-app.vercel.app");

    const result = getServerUrl();

    expect(result).toBe("https://my-app.example.com");
  });

  it("should fallback to VERCEL_URL when SERVER_URL is not set", () => {
    // why: Stub SERVER_URL as undefined to simulate missing variable
    vi.stubEnv("SERVER_URL", undefined);
    vi.stubEnv("VERCEL_URL", "checkmu.vercel.app");

    const result = getServerUrl();

    expect(result).toBe("https://checkmu.vercel.app");
  });

  it("should add https protocol to VERCEL_URL fallback", () => {
    vi.stubEnv("SERVER_URL", undefined);
    vi.stubEnv("VERCEL_URL", "my-preview-123.vercel.app");

    const result = getServerUrl();

    expect(result).toBe("https://my-preview-123.vercel.app");
  });

  it("should throw descriptive error when neither SERVER_URL nor VERCEL_URL is set", () => {
    vi.stubEnv("SERVER_URL", undefined);
    vi.stubEnv("VERCEL_URL", undefined);

    expect(() => {
      getServerUrl();
    }).toThrow(ShelfError);
    expect(() => {
      getServerUrl();
    }).toThrow("SERVER_URL is not set");
  });

  it("should prefer SERVER_URL over VERCEL_URL when both are set", () => {
    // why: SERVER_URL should take precedence for custom domains
    vi.stubEnv("SERVER_URL", "https://check.mu");
    vi.stubEnv("VERCEL_URL", "checkmu.vercel.app");

    const result = getServerUrl();

    expect(result).toBe("https://check.mu");
  });
});
