const { Web3 } = require('web3');

class KaleidoBlockchainService {
  constructor() {
    // Kaleido connection configuration
    this.web3 = new Web3(process.env.BLOCKCHAIN_RPC);
    this.chainId = parseInt(process.env.CHAIN_ID) || 23251219;
    this.isLocal = false;
    this.isKaleido = true;

    // HitachiNebutaToken contract configuration
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
      },
      {
        "inputs": [
          {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
        ],
        "name": "tokenURI",
        "outputs": [
          {"internalType": "string", "name": "", "type": "string"}
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {"internalType": "address", "name": "owner", "type": "address"}
        ],
        "name": "balanceOf",
        "outputs": [
          {"internalType": "uint256", "name": "", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ];

    this.setupAccount();
    this.contract = null;
    this.initializeContract();
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
        console.log('📍 Network: Kaleido Blockchain');
        console.log('🎯 Contract:', this.contractName, '(' + this.contractSymbol + ')');
      } catch (error) {
        console.error('❌ Account setup error:', error.message);
      }
    } else {
      console.warn('⚠️  PRIVATE_KEY not configured');
    }
  }

  /**
   * Initialize smart contract instance
   */
  async initializeContract() {
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
   * Check connection to Kaleido network
   */
  async checkConnection() {
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
   * Get network information
   */
  async getNetworkInfo() {
    try {
      const blockNumber = await this.web3.eth.getBlockNumber();
      const chainId = await this.web3.eth.getChainId();
      const gasPrice = await this.web3.eth.getGasPrice();

      return {
        blockNumber: blockNumber.toString(),
        chainId: chainId.toString(),
        gasPrice: gasPrice.toString(),
        isKaleido: this.isKaleido,
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
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        contractSymbol: this.contractSymbol,
        accountAddress: this.account?.address || 'Not configured',
        error: error.message
      };
    }
  }

  /**
   * Mint NFT using HitachiNebutaToken contract
   * @param {string} userAddress - Target wallet address
   * @param {number} slot - Token slot (1: User, 2: Photo)
   * @param {number} value - Token value
   * @returns {Promise<string>} Token ID
   */
  async mint(userAddress, slot, value) {
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

      // Estimate gas
      const gasEstimate = await this.contract.methods
        .mint(userAddress, slot, value)
        .estimateGas({ from: this.account.address });

      // Get current gas price
      const gasPrice = await this.web3.eth.getGasPrice();

      // Execute mint transaction
      const transaction = await this.contract.methods
        .mint(userAddress, slot, value)
        .send({
          from: this.account.address,
          gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer
          gasPrice: gasPrice
        });

      console.log('✅ Mint transaction successful');
      console.log('📝 Transaction hash:', transaction.transactionHash);
      console.log('⛽ Gas used:', transaction.gasUsed);

      // Extract token ID from transaction logs
      const mintEvent = transaction.events?.Transfer || transaction.events?.Mint;
      let tokenId;

      if (mintEvent && mintEvent.returnValues) {
        tokenId = mintEvent.returnValues.tokenId || mintEvent.returnValues[2];
      }

      if (!tokenId) {
        // Fallback: use timestamp-based token ID
        tokenId = Date.now().toString();
        console.log('⚠️  Using fallback token ID:', tokenId);
      }

      return tokenId.toString();

    } catch (error) {
      console.error('❌ Mint error:', error.message);
      throw new Error('NFTミント処理失敗: ' + error.message);
    }
  }

  /**
   * Set token URI metadata
   * @param {string} tokenId - Token ID
   * @param {string} uri - Metadata URI or content
   * @returns {Promise<string>} Transaction hash
   */
  async setTokenURI(tokenId, uri) {
    try {
      if (!this.contract) {
        throw new Error('Smart contract not initialized');
      }

      if (!this.account) {
        throw new Error('Account not configured');
      }

      console.log('📝 Setting token URI on Kaleido...');
      console.log('🎫 Token ID:', tokenId);
      console.log('📄 URI:', uri);

      // Estimate gas
      const gasEstimate = await this.contract.methods
        .setTokenURI(tokenId, uri)
        .estimateGas({ from: this.account.address });

      // Get current gas price
      const gasPrice = await this.web3.eth.getGasPrice();

      // Execute setTokenURI transaction
      const transaction = await this.contract.methods
        .setTokenURI(tokenId, uri)
        .send({
          from: this.account.address,
          gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer
          gasPrice: gasPrice
        });

      console.log('✅ SetTokenURI transaction successful');
      console.log('📝 Transaction hash:', transaction.transactionHash);
      console.log('⛽ Gas used:', transaction.gasUsed);

      return transaction.transactionHash;

    } catch (error) {
      console.error('❌ SetTokenURI error:', error.message);
      throw new Error('URI設定処理失敗: ' + error.message);
    }
  }

  /**
   * Get token URI
   * @param {string} tokenId - Token ID
   * @returns {Promise<string>} Token URI
   */
  async getTokenURI(tokenId) {
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
   * Get balance of address
   * @param {string} address - Wallet address
   * @returns {Promise<string>} Balance
   */
  async getBalance(address) {
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
   * Deploy contract (if needed - for development)
   */
  async deployContractIfNeeded() {
    console.log('📋 Contract deployment skipped - using existing HitachiNebutaToken');
    console.log('📍 Contract address:', this.contractAddress);
  }
}

module.exports = KaleidoBlockchainService;
