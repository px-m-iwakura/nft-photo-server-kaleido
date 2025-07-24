const { Web3 } = require('web3');

class KaleidoBlockchainService {
  constructor() {
    // Check if mock mode is enabled
    this.mockMode = process.env.MOCK_MODE === 'true';
    
    if (this.mockMode) {
      console.log('🎭 MOCK MODE ENABLED - 完全無料テスト中');
      console.log('💰 資金不要でNFTサーバーをテスト中...');
      this.setupMockMode();
    } else {
      console.log('🌐 REAL KALEIDO MODE - 実際のブロックチェーン接続');
      this.setupRealMode();
    }
    
    //this.mockDelay = parseInt(process.env.MOCK_DELAY_MS) || 1000;
    this.mockDelayMs = parseInt(process.env.MOCK_DELAY_MS) || 1000;
    this.mockSuccessRate = parseInt(process.env.MOCK_SUCCESS_RATE) || 100;
    this.mockDatabase = new Map(); // モック用データストレージ
  }

  /**
   * Setup mock mode (完全オフライン)
   */
  setupMockMode() {
    this.isKaleido = true;
    this.chainId = 23251219;
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    this.contractName = process.env.CONTRACT_NAME || 'HitachiNebutaToken';
    this.contractSymbol = process.env.CONTRACT_SYMBOL || 'HNT';
    
    // Mock account setup
    if (process.env.PRIVATE_KEY) {
      this.account = {
        address: this.deriveAddressFromPrivateKey(process.env.PRIVATE_KEY),
        privateKey: process.env.PRIVATE_KEY
      };
      console.log('🔐 Mock account loaded:', this.account.address);
    }
    
    console.log('📍 Mock Network: Kaleido Blockchain (MOCK)');
    console.log('🎯 Mock Contract:', this.contractName, '(' + this.contractSymbol + ')');
  }

  /**
   * Setup real Kaleido mode
   */
  setupRealMode() {
    this.web3 = new Web3(process.env.BLOCKCHAIN_RPC);
    this.chainId = parseInt(process.env.CHAIN_ID) || 23251219;
    this.isLocal = false;
    this.isKaleido = true;
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    this.contractName = process.env.CONTRACT_NAME || 'HitachiNebutaToken';
    this.contractSymbol = process.env.CONTRACT_SYMBOL || 'HNT';

    // Contract ABI for HitachiNebutaToken
    this.contractABI = [
      {
        "inputs": [
          {"internalType": "address", "name": "mintTo_", "type": "address"},
          {"internalType": "uint256", "name": "slot_", "type": "uint256"},
          {"internalType": "uint256", "name": "value_", "type": "uint256"}
        ],
        "name": "mint",
        "outputs": [
          {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {"internalType": "uint256", "name": "tokenId_", "type": "uint256"},
          {"internalType": "string", "name": "uri_", "type": "string"}
        ],
        "name": "setTokenURI",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];

    this.setupAccount();
    this.initializeContract();
  }

  /**
   * Derive address from private key (simplified for mock)
   */
  deriveAddressFromPrivateKey(privateKey) {
    // Simple mock address derivation
    const key = privateKey.replace('0x', '');
    const hash = require('crypto').createHash('sha256').update(key).digest('hex');
    return '0x' + hash.substring(0, 40);
  }

  /**
   * Setup blockchain account from private key
   */
  setupAccount() {
    if (process.env.PRIVATE_KEY) {
      try {
        const privateKey = process.env.PRIVATE_KEY.startsWith('0x') 
          ? process.env.PRIVATE_KEY 
          : '0x' + process.env.PRIVATE_KEY;

        const account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
        this.web3.eth.accounts.wallet.add(account);
        this.account = account;

        console.log('🔐 Kaleido account loaded:', account.address);
      } catch (error) {
        console.error('❌ Account setup error:', error.message);
      }
    }
  }

  /**
   * Initialize smart contract instance
   */
  async initializeContract() {
    if (this.mockMode) return;
    
    try {
      if (!this.contractAddress) {
        throw new Error('CONTRACT_ADDRESS not configured');
      }
      this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);
      console.log('📋 Smart contract initialized:', this.contractAddress);
    } catch (error) {
      console.error('❌ Contract initialization error:', error.message);
    }
  }

  /**
   * Check connection (mock or real)
   */
  async checkConnection() {
    if (this.mockMode) {
      console.log('🎭 Mock connection check - always success!');
      return true;
    }

    try {
      const blockNumber = await this.web3.eth.getBlockNumber();
      const chainId = await this.web3.eth.getChainId();
      console.log('🌐 Kaleido network connected');
      console.log('📊 Block number:', blockNumber.toString());
      console.log('🔗 Chain ID:', chainId.toString());
      return true;
    } catch (error) {
      console.error('❌ Kaleido network connection error:', error.message);
      return false;
    }
  }

  /**
   * Mock delay simulation
   */
  async mockDelayFunc() {
    return new Promise(resolve => setTimeout(resolve, this.mockDelayMs));
  }

  /**
   * Get network information (mock or real)
   */
  async getNetworkInfo() {
    if (this.mockMode) {
      // Mock network info
      const mockBlockNumber = Math.floor(Date.now() / 10000);
      return {
        blockNumber: mockBlockNumber.toString(),
        chainId: this.chainId.toString(),
        gasPrice: '20000000000',
        isKaleido: true,
        isMockMode: true,
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        contractSymbol: this.contractSymbol,
        accountAddress: this.account?.address || 'Mock account not configured'
      };
    }

    // Real network info
    try {
      const blockNumber = await this.web3.eth.getBlockNumber();
      const chainId = await this.web3.eth.getChainId();
      const gasPrice = await this.web3.eth.getGasPrice();

      return {
        blockNumber: blockNumber.toString(),
        chainId: chainId.toString(),
        gasPrice: gasPrice.toString(),
        isKaleido: this.isKaleido,
        isMockMode: false,
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        contractSymbol: this.contractSymbol,
        accountAddress: this.account?.address || 'Not configured'
      };
    } catch (error) {
      console.error('❌ Network info error:', error.message);
      return {
        blockNumber: '0',
        chainId: this.chainId.toString(),
        gasPrice: '0',
        isKaleido: this.isKaleido,
        isMockMode: false,
        contractAddress: this.contractAddress,
        error: error.message
      };
    }
  }

  /**
   * Mock delay simulation
   */
  async mockDelay() {
    return new Promise(resolve => setTimeout(resolve, this.mockDelay));
  }

  /**
   * Generate mock token ID
   */
  generateMockTokenId() {
    return (Date.now() + Math.floor(Math.random() * 1000)).toString();
  }

  /**
   * Generate mock transaction hash
   */
  generateMockTransactionHash() {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
  }

  /**
   * Mint NFT (mock or real)
   */
  async mint(userAddress, slot, value) {
    if (this.mockMode) {
      console.log('🎭 Mock minting NFT...');
      console.log('📍 Target address:', userAddress);
      console.log('🎯 Slot:', slot);
      console.log('💎 Value:', value);

      // // Simulate network delay
      // await this.mockDelay();
      // Simulate network delay
      await this.mockDelayFunc();
      // Generate mock response
      const tokenId = this.generateMockTokenId();
      const transactionHash = this.generateMockTransactionHash();

      // Store in mock database
      this.mockDatabase.set(tokenId, {
        owner: userAddress,
        slot: slot,
        value: value,
        transactionHash: transactionHash,
        timestamp: Date.now()
      });

      console.log('✅ Mock mint successful!');
      console.log('📝 Mock Transaction hash:', transactionHash);
      console.log('🎫 Mock Token ID:', tokenId);

      return tokenId;
    }

    // Real Kaleido minting
    try {
      if (!this.contract) {
        throw new Error('Smart contract not initialized');
      }
      if (!this.account) {
        throw new Error('Account not configured');
      }

      console.log('🎨 Minting NFT on Kaleido...');
      console.log('📍 Target address:', userAddress);
      console.log('🎯 Slot:', slot);
      console.log('💎 Value:', value);

      const gasEstimate = Number(await this.contract.methods.mint(userAddress, slot, value).estimateGas({ from: this.account.address }));

      const gasPrice = Number(await this.web3.eth.getGasPrice());

      const transaction = await this.contract.methods
        .mint(userAddress, slot, value)
        .send({
          from: this.account.address,
          gas: Math.floor(Number(gasEstimate) * 1.2),
          gasPrice: Number(gasPrice)
        });

      console.log('✅ Mint transaction successful');
      console.log('📝 Transaction hash:', transaction.transactionHash);

      const mintEvent = transaction.events?.Transfer || transaction.events?.Mint;
      let tokenId;
      if (mintEvent && mintEvent.returnValues) {
        tokenId = mintEvent.returnValues.tokenId || mintEvent.returnValues[2];
      }
      if (!tokenId) {
        tokenId = Date.now().toString();
      }

      return tokenId.toString();
    } catch (error) {
      console.error('❌ Mint error:', error.message);
      throw new Error('NFTミント処理失敗: ' + error.message);
    }
  }

  /**
   * Set token URI (mock or real)
   */
  async setTokenURI(tokenId, uri) {
    if (this.mockMode) {
      console.log('🎭 Mock setting token URI...');
      console.log('🎫 Token ID:', tokenId);
      console.log('📄 URI:', uri);

      // // Simulate network delay
      // await this.mockDelay();
      // Simulate network delay
      await this.mockDelayFunc();
      // Update mock database
      const tokenData = this.mockDatabase.get(tokenId) || {};
      tokenData.uri = uri;
      tokenData.uriSetAt = Date.now();
      this.mockDatabase.set(tokenId, tokenData);

      const transactionHash = this.generateMockTransactionHash();

      console.log('✅ Mock setTokenURI successful!');
      console.log('📝 Mock Transaction hash:', transactionHash);

      return transactionHash;
    }

    // Real Kaleido setTokenURI
    try {
      if (!this.contract) {
        throw new Error('Smart contract not initialized');
      }
      if (!this.account) {
        throw new Error('Account not configured');
      }

      console.log('📝 Setting token URI on Kaleido...');

      // Balance check
      const balance = await this.web3.eth.getBalance(this.account.address);
      if (Number(this.web3.utils.fromWei(balance, "ether")) < 0.001) {
        console.log("⚠️ Insufficient balance, skipping setTokenURI");
        return tokenId;
      }
      console.log('🎫 Token ID:', tokenId);
      console.log('📄 URI:', uri);

      const gasEstimate = await this.contract.methods
        .setTokenURI(tokenId, uri)
        .estimateGas({ from: this.account.address });

      const gasPrice = Number(await this.web3.eth.getGasPrice());

      const transaction = await this.contract.methods
        .setTokenURI(tokenId, uri)
        .send({
          from: this.account.address,
          gas: Math.floor(Number(gasEstimate) * 1.2),
          gasPrice: Number(gasPrice)
        });

      console.log('✅ SetTokenURI transaction successful');
      console.log('📝 Transaction hash:', transaction.transactionHash);

      return transaction.transactionHash;
    } catch (error) {
      console.error('❌ SetTokenURI error:', error.message);
      throw new Error('URI設定処理失敗: ' + error.message);
    }
  }

  /**
   * Get token URI (mock or real)
   */
  async getTokenURI(tokenId) {
    if (this.mockMode) {
      const tokenData = this.mockDatabase.get(tokenId);
      return tokenData?.uri || `mock://token/${tokenId}/metadata`;
    }

    try {
      if (!this.contract) {
        throw new Error('Smart contract not initialized');
      }
      const uri = await this.contract.methods.tokenURI(tokenId).call();
      return uri;
    } catch (error) {
      console.error('❌ GetTokenURI error:', error.message);
      throw new Error('URI取得処理失敗: ' + error.message);
    }
  }

  /**
   * Get balance (mock or real)
   */
  async getBalance(address) {
    if (this.mockMode) {
      // Count tokens owned by address in mock database
      let count = 0;
      for (const [tokenId, data] of this.mockDatabase) {
        if (data.owner === address) count++;
      }
      return count.toString();
    }

    try {
      if (!this.contract) {
        throw new Error('Smart contract not initialized');
      }
      const balance = await this.contract.methods.balanceOf(address).call();
      return balance.toString();
    } catch (error) {
      console.error('❌ GetBalance error:', error.message);
      throw new Error('残高取得処理失敗: ' + error.message);
    }
  }

  /**
   * Deploy contract (mock or real)
   */
  async deployContractIfNeeded() {
    if (this.mockMode) {
      console.log('🎭 Mock contract deployment - using existing HitachiNebutaToken');
    } else {
      console.log('📋 Contract deployment skipped - using existing HitachiNebutaToken');
    }
    console.log('📍 Contract address:', this.contractAddress);
  }
}

module.exports = KaleidoBlockchainService;