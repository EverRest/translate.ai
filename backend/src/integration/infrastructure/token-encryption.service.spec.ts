import { TokenEncryptionService } from './token-encryption.service';
import { ConfigService } from '@nestjs/config';

describe('TokenEncryptionService', () => {
  const service = new TokenEncryptionService(
    new ConfigService({ JWT_SECRET: 'test-secret-key' }),
  );

  it('round-trips encrypt and decrypt', () => {
    const plain = 'access-token-abc123';
    const encrypted = service.encrypt(plain);
    expect(encrypted).not.toContain(plain);
    expect(service.decrypt(encrypted)).toBe(plain);
  });
});
