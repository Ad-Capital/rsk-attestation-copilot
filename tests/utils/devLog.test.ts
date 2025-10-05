import { devLog } from '../../src/utils/devLog.js';

describe('devLog', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should log messages with proper formatting', () => {
    devLog.agent('Test message', { data: 'test' });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[AGENT\] Test message/),
      { data: 'test' }
    );
  });

  it('should sanitize private keys from data', () => {
    const sensitiveData = {
      privateKey: '0x1234567890123456789012345678901234567890123456789012345678901234',
      publicInfo: 'safe data'
    };

    devLog.security('Sensitive operation', sensitiveData);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[SECURITY\] Sensitive operation/),
      {
        privateKey: '[REDACTED]',
        publicInfo: 'safe data'
      }
    );
  });

  it('should sanitize mnemonic phrases', () => {
    const mnemonicData = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

    devLog.security('Mnemonic operation', mnemonicData);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[SECURITY\] Mnemonic operation/),
      '[MNEMONIC_REDACTED]'
    );
  });

  it('should sanitize private keys in strings', () => {
    const dataWithKey = 'Private key: 0x1234567890123456789012345678901234567890123456789012345678901234';

    devLog.agent('Processing data', dataWithKey);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[AGENT\] Processing data/),
      'Private key: 0x[REDACTED]'
    );
  });

  it('should redact various key fields in objects', () => {
    const sensitiveObject = {
      secretKey: 'very-secret',
      privateKey: '0x123',
      mnemonic: 'word1 word2 word3',
      normalField: 'normal value'
    };

    devLog.rpc('RPC call', sensitiveObject);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[RPC\] RPC call/),
      {
        secretKey: '[REDACTED]',
        privateKey: '[REDACTED]',
        mnemonic: '[REDACTED]',
        normalField: 'normal value'
      }
    );
  });

  it('should handle different log categories', () => {
    devLog.security('Security message');
    devLog.rpc('RPC message');
    devLog.agent('Agent message');
    devLog.cli('CLI message');
    devLog.workflow('Workflow message');
    devLog.error('Error message');

    expect(consoleSpy).toHaveBeenCalledTimes(6);
    expect(consoleSpy).toHaveBeenNthCalledWith(1, expect.stringContaining('[SECURITY]'), '');
    expect(consoleSpy).toHaveBeenNthCalledWith(2, expect.stringContaining('[RPC]'), '');
    expect(consoleSpy).toHaveBeenNthCalledWith(3, expect.stringContaining('[AGENT]'), '');
    expect(consoleSpy).toHaveBeenNthCalledWith(4, expect.stringContaining('[CLI]'), '');
    expect(consoleSpy).toHaveBeenNthCalledWith(5, expect.stringContaining('[WORKFLOW]'), '');
    expect(consoleSpy).toHaveBeenNthCalledWith(6, expect.stringContaining('[ERROR]'), '');
  });

  it('should respect production environment settings', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    devLog.agent('Should not log in production');
    devLog.error('Should log in production');

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR]'),
      ''
    );

    process.env.NODE_ENV = originalEnv;
  });
});