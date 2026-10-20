import { InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EncryptionService } from "./Encryption.service";

describe("EncryptionService", () => {
  let service: EncryptionService;

  const validKey = "a".repeat(64);

  const createService = (key: string = validKey) => {
    const config = {
      getOrThrow: jest.fn().mockReturnValue(key),
    };

    return new EncryptionService(config as unknown as ConfigService);
  };

  beforeEach(() => {
    service = createService();
  });

  describe("constructor", () => {
    it("should initialize with a valid 32-byte hexadecimal key", () => {
      expect(() => createService()).not.toThrow();
    });

    it("should accept uppercase hexadecimal characters", () => {
      expect(() => createService("A".repeat(64))).not.toThrow();
    });

    it.each([
      ["an empty key", ""],
      ["a key that is too short", "a".repeat(62)],
      ["a key that is too long", "a".repeat(66)],
      ["non-hexadecimal characters", "g".repeat(64)],
      ["a key with whitespace", "a".repeat(63) + " "],
    ])("should reject %s", (_description, key) => {
      expect(() => createService(key)).toThrow("Invalid encryption key");
    });

    it("should request the configured encryption key", () => {
      const config = {
        getOrThrow: jest.fn().mockReturnValue(validKey),
      };

      new EncryptionService(config as unknown as ConfigService);

      expect(config.getOrThrow).toHaveBeenCalledWith(
        "github.accessEncryptionKey",
      );
    });
  });

  describe("encrypt", () => {
    it("should return data in the IV.tag.ciphertext format", () => {
      const encrypted = service.encrypt("github-token");
      const parts = encrypted.split(".");

      expect(parts).toHaveLength(3);

      const [iv, tag, ciphertext] = parts;

      expect(Buffer.from(iv, "base64url")).toHaveLength(12);
      expect(Buffer.from(tag, "base64url")).toHaveLength(16);
      expect(Buffer.from(ciphertext, "base64url").length).toBeGreaterThan(0);
    });

    it("should encrypt plaintext that can be decrypted", () => {
      const plaintext = "gho_example_github_access_token";

      const encrypted = service.encrypt(plaintext);

      expect(service.decrypt(encrypted)).toBe(plaintext);
    });

    it("should support an empty plaintext", () => {
      const encrypted = service.encrypt("");

      expect(service.decrypt(encrypted)).toBe("");
    });

    it("should support Unicode plaintext", () => {
      const plaintext = "токен 🔐 你好";

      const encrypted = service.encrypt(plaintext);

      expect(service.decrypt(encrypted)).toBe(plaintext);
    });

    it("should produce different ciphertexts for the same plaintext", () => {
      const plaintext = "same-github-token";

      const first = service.encrypt(plaintext);
      const second = service.encrypt(plaintext);

      expect(first).not.toBe(second);
      expect(service.decrypt(first)).toBe(plaintext);
      expect(service.decrypt(second)).toBe(plaintext);
    });
  });

  describe("decrypt", () => {
    it("should decrypt a valid encrypted value", () => {
      const encrypted = service.encrypt("my-secret-token");

      expect(service.decrypt(encrypted)).toBe("my-secret-token");
    });

    it.each([
      ["an empty string", ""],
      ["a missing IV", ".dGFn.Y2lwaGVydGV4dA"],
      ["a missing authentication tag", "aXY..Y2lwaGVydGV4dA"],
      ["missing ciphertext", "aXY.dGFn."],
      ["too few parts", "only-two-parts"],
    ])("should reject %s", (_description, encrypted) => {
      expect(() => service.decrypt(encrypted)).toThrow(
        new InternalServerErrorException("Could not decrypt GitHub token"),
      );
    });

    it("should reject ciphertext modified after encryption", () => {
      const encrypted = service.encrypt("sensitive-token");
      const [iv, tag, ciphertext] = encrypted.split(".");

      const bytes = Buffer.from(ciphertext, "base64url");
      bytes[0] ^= 1;

      const tampered = [iv, tag, bytes.toString("base64url")].join(".");

      expect(() => service.decrypt(tampered)).toThrow(
        InternalServerErrorException,
      );
    });

    it("should reject an incorrect authentication tag", () => {
      const encrypted = service.encrypt("sensitive-token");
      const [iv, , ciphertext] = encrypted.split(".");

      const wrongTag = Buffer.alloc(16, 0).toString("base64url");
      const tampered = [iv, wrongTag, ciphertext].join(".");

      expect(() => service.decrypt(tampered)).toThrow(
        InternalServerErrorException,
      );
    });

    it("should reject data encrypted with a different key", () => {
      const encrypted = service.encrypt("sensitive-token");
      const otherService = createService("b".repeat(64));

      expect(() => otherService.decrypt(encrypted)).toThrow(
        InternalServerErrorException,
      );
    });

    it("should reject malformed base64url data", () => {
      expect(() => service.decrypt("!!!.!!!.!!!")).toThrow(
        InternalServerErrorException,
      );
    });
  });
});
