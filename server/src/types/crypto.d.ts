import * as crypto from 'crypto';

declare module 'crypto' {
  interface Cipher {
    getAuthTag?(): Buffer;
  }
  
  interface Decipher {
    setAuthTag?(buffer: Buffer): void;
  }
} 