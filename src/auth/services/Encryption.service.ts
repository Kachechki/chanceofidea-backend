import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const key = config.getOrThrow<string>("github.accessEncryptionKey");

    if (!key || !/^[0-9a-f]{64}$/i.test(key)) {
      throw new Error("Invalid encryption key");
    }

    this.key = Buffer.from(key, "hex");
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);

    const cipher = createCipheriv("aes-256-gcm", this.key, iv);

    const ciphertext = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
      iv.toString("base64url"),
      authTag.toString("base64url"),
      ciphertext.toString("base64url"),
    ].join(".");
  }

  decrypt(encrypted: string): string {
    try {
      const [ivPart, tagPart, ciphertextPart] = encrypted.split(".");

      if (!ivPart || !tagPart || !ciphertextPart) {
        throw new Error("Invalid encrypted data");
      }

      const decipher = createDecipheriv(
        "aes-256-gcm",
        this.key,
        Buffer.from(ivPart, "base64url"),
      );

      decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

      return Buffer.concat([
        decipher.update(Buffer.from(ciphertextPart, "base64url")),
        decipher.final(),
      ]).toString("utf8");
    } catch {
      throw new InternalServerErrorException("Could not decrypt GitHub token");
    }
  }
}
