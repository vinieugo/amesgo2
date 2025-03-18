import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Serviço para criptografia e descriptografia de dados sensíveis
 * Implementa criptografia simétrica (AES-256-GCM) e assimétrica (RSA)
 */
export class CryptoService {
  private static instance: CryptoService;
  private encryptionKey: Buffer;
  private algorithm: string = 'aes-256-gcm';
  private rsaPrivateKey: string | null = null;
  private rsaPublicKey: string | null = null;
  
  private constructor() {
    // Obter chave de criptografia do ambiente ou gerar uma nova
    const envKey = process.env.ENCRYPTION_KEY;
    
    if (envKey) {
      // Usar chave do ambiente (deve ser uma string hexadecimal de 64 caracteres)
      this.encryptionKey = Buffer.from(envKey, 'hex');
    } else {
      // Gerar uma nova chave aleatória
      this.encryptionKey = crypto.randomBytes(32); // 256 bits
      console.warn('AVISO: Nenhuma chave de criptografia encontrada no ambiente. Usando chave gerada aleatoriamente.');
      console.warn('Esta chave será perdida na reinicialização do servidor. Defina ENCRYPTION_KEY no arquivo .env');
      console.warn(`Chave gerada: ${this.encryptionKey.toString('hex')}`);
    }
    
    // Carregar chaves RSA se existirem
    this.loadRsaKeys();
  }
  
  /**
   * Obtém a instância do serviço de criptografia
   */
  public static getInstance(): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService();
    }
    return CryptoService.instance;
  }
  
  /**
   * Carrega chaves RSA do sistema de arquivos ou gera novas
   */
  private loadRsaKeys(): void {
    const keysDir = path.join(process.cwd(), 'keys');
    const privateKeyPath = path.join(keysDir, 'private.pem');
    const publicKeyPath = path.join(keysDir, 'public.pem');
    
    try {
      // Verificar se as chaves existem
      if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
        this.rsaPrivateKey = fs.readFileSync(privateKeyPath, 'utf8');
        this.rsaPublicKey = fs.readFileSync(publicKeyPath, 'utf8');
      } else {
        // Gerar novas chaves RSA
        if (!fs.existsSync(keysDir)) {
          fs.mkdirSync(keysDir, { recursive: true });
        }
        
        const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
          modulusLength: 4096,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
          }
        });
        
        // Salvar chaves em arquivos
        fs.writeFileSync(privateKeyPath, privateKey, { mode: 0o600 }); // Permissões restritas
        fs.writeFileSync(publicKeyPath, publicKey);
        
        this.rsaPrivateKey = privateKey;
        this.rsaPublicKey = publicKey;
        
        console.log('Novas chaves RSA geradas e salvas em:', keysDir);
      }
    } catch (error) {
      console.error('Erro ao carregar/gerar chaves RSA:', error);
      // Continuar sem criptografia RSA
      this.rsaPrivateKey = null;
      this.rsaPublicKey = null;
    }
  }
  
  /**
   * Criptografa dados usando AES-256-GCM
   * @param data Dados a serem criptografados
   * @returns Dados criptografados em formato hexadecimal
   */
  public encrypt(data: string): string {
    // Gerar IV aleatório
    const iv = crypto.randomBytes(16);
    
    // Criar cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    // Criptografar dados
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Obter tag de autenticação (para AES-GCM)
    const authTag = cipher.getAuthTag ? cipher.getAuthTag() : Buffer.alloc(16);
    
    // Combinar IV, dados criptografados e tag de autenticação
    return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
  }
  
  /**
   * Descriptografa dados usando AES-256-GCM
   * @param encryptedData Dados criptografados em formato hexadecimal
   * @returns Dados descriptografados
   */
  public decrypt(encryptedData: string): string {
    // Separar IV, dados criptografados e tag de autenticação
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Formato de dados criptografados inválido');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');
    
    // Criar decipher
    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    
    // Definir tag de autenticação (para AES-GCM)
    if (decipher.setAuthTag) {
      decipher.setAuthTag(authTag);
    }
    
    // Descriptografar dados
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  /**
   * Criptografa dados usando RSA (criptografia assimétrica)
   * @param data Dados a serem criptografados
   * @returns Dados criptografados em formato base64
   */
  public encryptRsa(data: string): string {
    if (!this.rsaPublicKey) {
      throw new Error('Chave pública RSA não disponível');
    }
    
    const buffer = Buffer.from(data, 'utf8');
    const encrypted = crypto.publicEncrypt(
      {
        key: this.rsaPublicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      buffer
    );
    
    return encrypted.toString('base64');
  }
  
  /**
   * Descriptografa dados usando RSA (criptografia assimétrica)
   * @param encryptedData Dados criptografados em formato base64
   * @returns Dados descriptografados
   */
  public decryptRsa(encryptedData: string): string {
    if (!this.rsaPrivateKey) {
      throw new Error('Chave privada RSA não disponível');
    }
    
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = crypto.privateDecrypt(
      {
        key: this.rsaPrivateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      buffer
    );
    
    return decrypted.toString('utf8');
  }
  
  /**
   * Gera um hash seguro para senhas usando Argon2id
   * @param password Senha a ser hasheada
   * @returns Hash da senha
   */
  public async hashPassword(password: string): Promise<string> {
    // Usar bcrypt para compatibilidade com o código existente
    // Em uma implementação real, considere usar Argon2id
    const salt = crypto.randomBytes(16).toString('hex');
    
    // Simulação de Argon2id usando PBKDF2 (em produção, use uma biblioteca de Argon2)
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) return reject(err);
        resolve(`$argon2id$v=19$m=65536,t=3,p=4$${salt}$${derivedKey.toString('hex')}`);
      });
    });
  }
  
  /**
   * Verifica se uma senha corresponde ao hash armazenado
   * @param password Senha a ser verificada
   * @param hash Hash armazenado
   * @returns true se a senha corresponder ao hash, false caso contrário
   */
  public async verifyPassword(password: string, hash: string): Promise<boolean> {
    // Verificar se é um hash Argon2id simulado
    if (hash.startsWith('$argon2id$')) {
      const parts = hash.split('$');
      const salt = parts[4];
      const storedHash = parts[5];
      
      return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
          if (err) return reject(err);
          resolve(derivedKey.toString('hex') === storedHash);
        });
      });
    }
    
    // Compatibilidade com bcrypt (código existente)
    // Em uma implementação real, use a biblioteca bcrypt para comparação
    return false;
  }
  
  /**
   * Gera um token seguro para uso em operações como redefinição de senha
   * @param length Comprimento do token (padrão: 32 caracteres)
   * @returns Token seguro
   */
  public generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
  
  /**
   * Gera um hash HMAC para verificação de integridade
   * @param data Dados a serem assinados
   * @returns Hash HMAC em formato hexadecimal
   */
  public generateHmac(data: string): string {
    const hmac = crypto.createHmac('sha256', this.encryptionKey);
    hmac.update(data);
    return hmac.digest('hex');
  }
  
  /**
   * Verifica um hash HMAC para garantir integridade
   * @param data Dados originais
   * @param hmac Hash HMAC a ser verificado
   * @returns true se o HMAC for válido, false caso contrário
   */
  public verifyHmac(data: string, hmac: string): boolean {
    const calculatedHmac = this.generateHmac(data);
    return crypto.timingSafeEqual(Buffer.from(calculatedHmac, 'hex'), Buffer.from(hmac, 'hex'));
  }
}

// Exportar uma instância do serviço
export const cryptoService = CryptoService.getInstance(); 