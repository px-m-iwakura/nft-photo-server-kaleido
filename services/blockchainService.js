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

    // 完全なERC-3525 HitachiNebutaToken ABI (提供されたABIファイルから抽出)
    this.contractABI = [
      // === Constructor ===
      {
        "inputs": [
          {"internalType": "string", "name": "name_", "type": "string"},
          {"internalType": "string", "name": "symbol_", "type": "string"},
          {"internalType": "uint8", "name": "decimals_", "type": "uint8"}
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      
      // === Events ===
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "internalType": "address", "name": "_owner", "type": "address"},
          {"indexed": true, "internalType": "address", "name": "_approved", "type": "address"},
          {"indexed": true, "internalType": "uint256", "name": "_tokenId", "type": "uint256"}
        ],
        "name": "Approval",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "internalType": "address", "name": "_owner", "type": "address"},
          {"indexed": true, "internalType": "address", "name": "_operator", "type": "address"},
          {"indexed": false, "internalType": "bool", "name": "_approved", "type": "bool"}
        ],
        "name": "ApprovalForAll",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "internalType": "uint256", "name": "_tokenId", "type": "uint256"},
          {"indexed": true, "internalType": "address", "name": "_operator", "type": "address"},
          {"indexed": false, "internalType": "uint256", "name": "_value", "type": "uint256"}
        ],
        "name": "ApprovalValue",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "internalType": "address", "name": "_from", "type": "address"},
          {"indexed": true, "internalType": "address", "name": "_to", "type": "address"},
          {"indexed": true, "internalType": "uint256", "name": "_tokenId", "type": "uint256"}
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "internalType": "uint256", "name": "_fromTokenId", "type": "uint256"},
          {"indexed": true, "internalType": "uint256", "name": "_toTokenId", "type": "uint256"},
          {"indexed": false, "internalType": "uint256", "name": "_value", "type": "uint256"}
        ],
        "name": "TransferValue",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "internalType": "uint256", "name": "_tokenId", "type": "uint256"},
          {"indexed": true, "internalType": "uint256", "name": "_oldSlot", "type": "uint256"},
          {"indexed": true, "internalType": "uint256", "name": "_newSlot", "type": "uint256"}
        ],
        "name": "SlotChanged",
        "type": "event"
      },
      
      // === Main Functions ===
      
      // Mint Functions (2 overloads)
      {
        "inputs": [
          {"internalType": "address", "name": "mintTo_", "type": "address"},
          {"internalType": "uint256", "name": "slot_", "type": "uint256"},
          {"internalType": "uint256", "name": "value_", "type": "uint256"}
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {"internalType": "address", "name": "mintTo_", "type": "address"},
          {"internalType": "uint256", "name": "tokenId_", "type": "uint256"},
          {"internalType": "uint256", "name": "slot_", "type": "uint256"},
          {"internalType": "uint256", "name": "value_", "type": "uint256"}
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      
      // Token URI Functions
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
          {"internalType": "uint256", "name": "tokenId_", "type": "uint256"}
        ],
        "name": "tokenURI",
        "outputs": [
          {"internalType": "string", "name": "", "type": "string"}
        ],
        "stateMutability": "view",
        "type": "function"
      },
      
      // ERC-721 Standard Functions
      {
        "inputs": [
          {"internalType": "uint256", "name": "tokenId_", "type": "uint256"}
        ],
        "name": "ownerOf",
        "outputs": [
          {"internalType": "address", "name": "owner_", "type": "address"}
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {"internalType": "address", "name": "owner_", "type": "address"}
        ],
        "name": "balanceOf",
        "outputs": [
          {"internalType": "uint256", "name": "balance", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {"internalType": "uint256", "name": "tokenId_", "type": "uint256"}
        ],
        "name": "balanceOf",
        "outputs": [
          {"internalType": "uint256", "name": "", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
      },
      
      // ERC-3525 Specific Functions
      {
        "inputs": [
          {"internalType": "uint256", "name": "tokenId_", "type": "uint256"}
        ],
        "name": "slotOf",
        "outputs": [
          {"internalType": "uint256", "name": "", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "valueDecimals",
        "outputs": [
          {"internalType": "uint8", "name": "", "type": "uint8"}
        ],
        "stateMutability": "view",
        "type": "function"
      },
      
      // Utility Functions
      {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {"internalType": "uint256", "name": "", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {"internalType": "uint256", "name": "tokenId_", "type": "uint256"}
        ],
        "name": "exists",
        "outputs": [
          {"internalType": "bool", "name": "", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "name",
        "outputs": [
          {"internalType": "string", "name": "", "type": "string"}
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {"internalType": "string", "name": "", "type": "string"}
        ],
        "stateMutability": "view",
        "type": "function"
      },
      
      // Allowance Functions
      {
        "inputs": [
          {"internalType": "uint256", "name": "tokenId_", "type": "uint256"},
          {"internalType": "address", "name": "operator_", "type": "address"}
        ],
        "name": "allowance",
        "outputs": [
          {"internalType": "uint256", "name": "", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
      },
      
      // Transfer Functions
      {
        "inputs": [
          {"internalType": "uint256", "name": "fromTokenId_", "type": "uint256"},
          {"internalType": "address", "name": "to_", "type": "address"},
          {"internalType": "uint256", "name": "value_", "type": "uint256"}
        ],
        "name": "transferFrom",
        "outputs": [
          {"internalType": "uint256", "name": "newTokenId", "type": "uint256"}
        ],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          {"internalType": "address", "name": "from", "type": "address"},
          {"internalType": "address", "name": "to", "type": "address"},
          {"internalType": "uint256", "name": "tokenId", "type": "uint256"}
        ],
        "name": "transferFrom",
        "outputs": [],
        "stateMutability": "payable",
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
      
      // コントラクト基本情報の確認
      try {
        const name = await this.contract.methods.name().call();
        const symbol = await this.contract.methods.symbol().call();
        const totalSupply = await this.contract.methods.totalSupply().call();
        console.log('✅ Contract verified:');
        console.log('   📛 Name:', name);
        console.log('   🏷️  Symbol:', symbol);
        console.log('   📊 Total Supply:', totalSupply.toString());
      } catch (infoError) {
        console.log('ℹ️ Contract info check skipped:', infoError.message);
      }
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
   * Extract tokenId from ERC-3525 events (improved)
   */
  extractTokenIdFromEvents(transaction) {
    try {
      console.log('🔍 Analyzing transaction events for tokenId...');
      
      if (transaction.events && transaction.events.Transfer) {
        const transferEvents = Array.isArray(transaction.events.Transfer) 
          ? transaction.events.Transfer 
          : [transaction.events.Transfer];
        
        console.log('📋 Found Transfer events:', transferEvents.length);
        
        // ERC-3525では複数のTransferイベントが発生するため、新しいトークンを探す
        for (const event of transferEvents) {
          if (event.returnValues) {
            const from = event.returnValues._from || event.returnValues[0];
            const to = event.returnValues._to || event.returnValues[1];
            const tokenId = event.returnValues._tokenId || event.returnValues[2];
            
            // from が 0x0000... の場合はmintイベント
            if (from === '0x0000000000000000000000000000000000000000' && tokenId) {
              console.log('✅ TokenId extracted from mint Transfer event:', tokenId);
              return tokenId.toString();
            }
          }
        }
        
        // fallback: 最後のTransferイベントから取得
        const lastTransfer = transferEvents[transferEvents.length - 1];
        if (lastTransfer && lastTransfer.returnValues) {
          const tokenId = lastTransfer.returnValues._tokenId || 
                          lastTransfer.returnValues.tokenId || 
                          lastTransfer.returnValues[2];
          
          if (tokenId) {
            console.log('✅ TokenId extracted from last Transfer event:', tokenId);
            return tokenId.toString();
          }
        }
      }
      
      // ApprovalValueイベントからの取得を試行
      if (transaction.events && transaction.events.ApprovalValue) {
        const approvalEvent = Array.isArray(transaction.events.ApprovalValue) 
          ? transaction.events.ApprovalValue[0] 
          : transaction.events.ApprovalValue;
        
        if (approvalEvent && approvalEvent.returnValues) {
          const tokenId = approvalEvent.returnValues._tokenId || 
                          approvalEvent.returnValues.tokenId;
          if (tokenId) {
            console.log('✅ TokenId extracted from ApprovalValue event:', tokenId);
            return tokenId.toString();
          }
        }
      }
      
      // すべてのイベントをデバッグ出力
      if (transaction.events) {
        console.log('🔍 Available events:', Object.keys(transaction.events));
        for (const [eventName, eventData] of Object.entries(transaction.events)) {
          console.log(`   ${eventName}:`, eventData);
        }
      }
      
      // フォールバック: タイムスタンプベース
      console.log('⚠️ TokenId not found in events, using timestamp fallback');
      return Date.now().toString();
      
    } catch (error) {
      console.error('❌ Error extracting tokenId from events:', error.message);
      return Date.now().toString();
    }
  }

  /**
   * Mint NFT (improved with better event handling)
   */
  async mint(userAddress, slot, value) {
    if (this.mockMode) {
      console.log('🎭 Mock minting NFT...');
      console.log('📍 Target address:', userAddress);
      console.log('🎯 Slot:', slot);
      console.log('💎 Value:', value);

      await this.mockDelayFunc();
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

      // ガス推定
      const gasEstimate = await this.contract.methods
        .mint(userAddress, slot, value)
        .estimateGas({ from: this.account.address });

      const gasPrice = await this.web3.eth.getGasPrice();

      console.log('⛽ Gas estimate:', gasEstimate.toString());
      console.log('💰 Gas price:', gasPrice.toString());

      // mint実行
      const transaction = await this.contract.methods
        .mint(userAddress, slot, value)
        .send({
          from: this.account.address,
          gas: Math.floor(Number(gasEstimate) * 1.2),
          gasPrice: Number(gasPrice)
        });

      console.log('✅ Mint transaction successful');
      console.log('📝 Transaction hash:', transaction.transactionHash);
      console.log('📊 Gas used:', transaction.gasUsed);

      // 改善されたtokenId抽出
      const tokenId = this.extractTokenIdFromEvents(transaction);
      
      console.log('🎫 Final Token ID:', tokenId);
      return tokenId;
      
    } catch (error) {
      console.error('❌ Mint error details:', {
        message: error.message,
        code: error.code,
        data: error.data
      });
      throw new Error('NFTミント処理失敗: ' + error.message);
    }
  }

  /**
   * Set token URI (improved with better error handling)
   */
  async setTokenURI(tokenId, uri) {
    if (this.mockMode) {
      console.log('🎭 Mock setting token URI...');
      console.log('🎫 Token ID:', tokenId);
      console.log('📄 URI:', uri);

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
      console.log('🎫 Token ID:', tokenId);
      console.log('📄 URI:', uri);

      // Balance check (existing code compatibility)
      const balance = await this.web3.eth.getBalance(this.account.address);
      if (Number(this.web3.utils.fromWei(balance, "ether")) < 0.001) {
        console.log("⚠️ Low balance detected, but proceeding with setTokenURI");
      }

      // Token存在確認
      try {
        const exists = await this.contract.methods.exists(tokenId).call();
        if (!exists) {
          console.warn(`⚠️ Token ID ${tokenId} may not exist, but proceeding...`);
        } else {
          console.log('✅ Token existence confirmed');
        }
      } catch (existsError) {
        console.warn('⚠️ Token existence check failed:', existsError.message);
      }

      // ガス推定
      const gasEstimate = await this.contract.methods
        .setTokenURI(tokenId, uri)
        .estimateGas({ from: this.account.address });

      const gasPrice = await this.web3.eth.getGasPrice();

      console.log('⛽ SetTokenURI Gas estimate:', gasEstimate.toString());
      console.log('💰 Gas price:', gasPrice.toString());

      // setTokenURI実行
      const transaction = await this.contract.methods
        .setTokenURI(tokenId, uri)
        .send({
          from: this.account.address,
          gas: Math.floor(Number(gasEstimate) * 1.2),
          gasPrice: Number(gasPrice)
        });

      console.log('✅ SetTokenURI transaction successful');
      console.log('📝 Transaction hash:', transaction.transactionHash);
      console.log('📊 Gas used:', transaction.gasUsed);

      return transaction.transactionHash;
    } catch (error) {
      console.error('❌ SetTokenURI error details:', {
        message: error.message,
        code: error.code,
        data: error.data,
        tokenId: tokenId,
        uri: uri
      });
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
   * Get token owner (NEW)
   */
  async getOwnerOf(tokenId) {
    if (this.mockMode) {
      const tokenData = this.mockDatabase.get(tokenId);
      return tokenData?.owner || '0x0000000000000000000000000000000000000000';
    }

    try {
      if (!this.contract) {
        throw new Error('Smart contract not initialized');
      }
      const owner = await this.contract.methods.ownerOf(tokenId).call();
      return owner;
    } catch (error) {
      console.error('❌ GetOwnerOf error:', error.message);
      throw new Error('所有者取得処理失敗: ' + error.message);
    }
  }

  /**
   * Get token slot (NEW)
   */
  async getSlotOf(tokenId) {
    if (this.mockMode) {
      const tokenData = this.mockDatabase.get(tokenId);
      return tokenData?.slot?.toString() || '0';
    }

    try {
      if (!this.contract) {
        throw new Error('Smart contract not initialized');
      }
      const slot = await this.contract.methods.slotOf(tokenId).call();
      return slot.toString();
    } catch (error) {
      console.error('❌ GetSlotOf error:', error.message);
      throw new Error('スロット取得処理失敗: ' + error.message);
    }
  }

  /**
   * Get token balance/value (NEW)
   */
  async getTokenBalance(tokenId) {
    if (this.mockMode) {
      const tokenData = this.mockDatabase.get(tokenId);
      return tokenData?.value?.toString() || '0';
    }

    try {
      if (!this.contract) {
        throw new Error('Smart contract not initialized');
      }
      const balance = await this.contract.methods.balanceOf(tokenId).call();
      return balance.toString();
    } catch (error) {
      console.error('❌ GetTokenBalance error:', error.message);
      throw new Error('トークンバリュー取得処理失敗: ' + error.message);
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
   * Get total supply (NEW)
   */
  async getTotalSupply() {
    if (this.mockMode) {
      return this.mockDatabase.size.toString();
    }

    try {
      if (!this.contract) {
        throw new Error('Smart contract not initialized');
      }
      const supply = await this.contract.methods.totalSupply().call();
      return supply.toString();
    } catch (error) {
      console.error('❌ GetTotalSupply error:', error.message);
      throw new Error('総供給量取得処理失敗: ' + error.message);
    }
  }

  /**
   * Check if token exists (NEW)
   */
  async tokenExists(tokenId) {
    if (this.mockMode) {
      return this.mockDatabase.has(tokenId);
    }

    try {
      if (!this.contract) {
        throw new Error('Smart contract not initialized');
      }
      const exists = await this.contract.methods.exists(tokenId).call();
      return exists;
    } catch (error) {
      console.error('❌ TokenExists error:', error.message);
      return false;
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
