const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const User = require('./models/User');
const Photo = require('./models/Photo');
const KaleidoBlockchainService = require('./services/blockchainService');

const app = express();
const port = process.env.PORT || 3000;

// ミドルウェア
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());

// レート制限
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000
});
app.use('/api/', limiter);

// MongoDB接続
const mongoUri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/nft_db';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Kaleido ブロックチェーンサービス初期化
const blockchainService = new KaleidoBlockchainService();

// テストデータ初期化（Kaleido用）
async function initializeTestData() {
  try {
    // Kaleido用のテストデータ（実際のアドレスに変更推奨）
    const testUsers = [
      {
        blockchain_account_address: '0x1234567890123456789012345678901234567890',
        nickname: 'Alice (Kaleido Test)'
      },
      {
        blockchain_account_address: '0x0987654321098765432109876543210987654321',
        nickname: 'Bob (Kaleido Test)'
      }
    ];

    const testPhotos = [
      {
        hash: 'kaleido_photo_hash_001',
        instagram_photo_url: 'https://instagram.com/p/kaleido_test_photo_001',
        blockchain_account_address: '0x1234567890123456789012345678901234567890',
        likes: 150,
        upload_status: 'pending'
      },
      {
        hash: 'kaleido_photo_hash_002',
        instagram_photo_url: 'https://instagram.com/p/kaleido_test_photo_002',
        blockchain_account_address: '0x0987654321098765432109876543210987654321',
        likes: 89,
        upload_status: 'pending'
      }
    ];

    for (const userData of testUsers) {
      const existingUser = await User.findOne({
        blockchain_account_address: userData.blockchain_account_address
      });
      if (!existingUser) {
        await User.create(userData);
        console.log('🧪 Test user created:', userData.nickname);
      }
    }

    for (const photoData of testPhotos) {
      const existingPhoto = await Photo.findOne({ hash: photoData.hash });
      if (!existingPhoto) {
        await Photo.create(photoData);
        console.log('🧪 Test photo created:', photoData.hash);
      }
    }

    console.log('=== Kaleido テストデータ初期化完了 ===');

  } catch (error) {
    console.error('❌ テストデータ初期化エラー:', error);
  }
}

// MongoDB接続時の初期化
mongoose.connection.once('open', async () => {
  console.log('🍃 MongoDB connected');
  await initializeTestData();

  // Kaleido接続確認
  const isConnected = await blockchainService.checkConnection();
  if (isConnected) {
    console.log('🌐 Kaleido blockchain connection verified');
  } else {
    console.warn('⚠️  Kaleido blockchain connection failed');
  }
});

// === API エンドポイント ===

// ユーザー登録API (Kaleido対応)
app.post('/api/users/register', async (req, res) => {
  try {
    const { blockchain_account_address, nickname } = req.body;

    // バリデーション
    if (!blockchain_account_address || !nickname) {
      return res.status(400).json({
        success: false,
        error: 'ブロックチェーンアカウントアドレスとニックネームは必須です'
      });
    }

    // アドレス形式チェック
    if (!/^0x[a-fA-F0-9]{40}$/.test(blockchain_account_address)) {
      return res.status(400).json({
        success: false,
        error: '無効なブロックチェーンアカウントアドレス形式です'
      });
    }

    // ニックネーム長さチェック
    if (nickname.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'ニックネームは50文字以内で入力してください'
      });
    }

    console.log('👤 User registration request:', { blockchain_account_address, nickname });

    // 重複チェック
    const existingUser = await User.findOne({ blockchain_account_address });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'このブロックチェーンアカウントアドレスは既に登録されています'
      });
    }

    // データベースにユーザー情報を保存（token_idは後で更新）
    const newUser = await User.create({
      blockchain_account_address,
      nickname
    });

    console.log('✅ User saved to database:', newUser._id);

    try {
      // Kaleidoブロックチェーンでユーザー用NFTをmint（slot:1, value:1）
      const tokenId = await blockchainService.mint(blockchain_account_address, 1, 1);
      console.log('✅ HitachiNebutaToken minted with tokenId:', tokenId);

      // token_idをデータベースに更新
      await User.findByIdAndUpdate(newUser._id, {
        token_id: tokenId.toString()
      });

      console.log('✅ Token ID updated in database');

      // setTokenURIでニックネームを設定
      await blockchainService.setTokenURI(tokenId, nickname);
      console.log('✅ Token URI set with nickname:', nickname);

      // 成功レスポンス
      res.json({
        success: true,
        message: 'ユーザー登録が完了しました（Kaleido）',
        user: {
          blockchain_account_address,
          nickname,
          token_id: tokenId.toString()
        },
        blockchain: {
          tokenId: tokenId,
          slot: 1,
          value: 1,
          network: 'Kaleido Blockchain',
          contractName: process.env.CONTRACT_NAME || 'HitachiNebutaToken',
          contractSymbol: process.env.CONTRACT_SYMBOL || 'HNT',
          chainId: process.env.CHAIN_ID || '23251219'
        }
      });

    } catch (blockchainError) {
      console.error('❌ Kaleido blockchain error during user registration:', blockchainError);

      // ブロックチェーン処理失敗時はデータベースからユーザーを削除（ロールバック）
      await User.findByIdAndDelete(newUser._id);
      console.log('🔄 User data rolled back due to blockchain error');

      res.status(500).json({
        success: false,
        error: 'Kaleidoブロックチェーン処理中にエラーが発生しました',
        details: blockchainError.message
      });
    }

  } catch (error) {
    console.error('❌ User registration API error:', error);
    res.status(500).json({
      success: false,
      error: 'ユーザー登録中にサーバーエラーが発生しました',
      details: error.message
    });
  }
});

// 写真のHitachiNebutaToken登録 (Kaleido対応)
app.post('/api/register-photo', async (req, res) => {
  try {
    const { blockchain_account_address, instaPhotoUrl, likeCount } = req.body;

    if (!blockchain_account_address || !instaPhotoUrl || likeCount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'アカウントアドレス、Instagram写真URL、いいね数は必須です'
      });
    }

    console.log('📸 Photo registration request:', { blockchain_account_address, instaPhotoUrl, likeCount });

    const userAddress = blockchain_account_address;
    console.log('👤 User address:', userAddress);

    try {
      // Kaleidoブロックチェーンで写真用NFTをmint（slot:2, value:likeCount）
      const tokenId = await blockchainService.mint(userAddress, 2, likeCount);
      await blockchainService.setTokenURI(tokenId, instaPhotoUrl);

      // 写真情報をMongoDBに保存
      const newPhoto = await Photo.create({
        hash: `photo_${Date.now()}`,  // ユニークな識別子として現在時刻を使用
        blockchain_account_address: userAddress,
        token_id: tokenId.toString(),
        upload_status: 'completed',
        likes: likeCount,
        instagram_photo_url: instaPhotoUrl
      });

      res.json({
        success: true,
        message: '写真のNFT登録が完了しました（Kaleido）',
        tokenId: tokenId,
        userAddress: userAddress,
        slot: 2,
        value: likeCount,
        instaPhotoUrl: instaPhotoUrl,
        photoId: newPhoto._id,
        blockchain: {
          network: 'Kaleido Blockchain',
          contractName: process.env.CONTRACT_NAME || 'HitachiNebutaToken',
          contractSymbol: process.env.CONTRACT_SYMBOL || 'HNT',
          chainId: process.env.CHAIN_ID || '23251219'
        }
      });

    } catch (blockchainError) {
      console.error('❌ Kaleido blockchain error:', blockchainError);
      res.status(500).json({
        success: false,
        error: 'Kaleidoブロックチェーン処理中にエラーが発生しました',
        details: blockchainError.message
      });
    }

  } catch (error) {
    console.error('❌ Photo registration API error:', error);
    res.status(500).json({
      success: false,
      error: 'サーバーエラーが発生しました',
      details: error.message
    });
  }
});

// 写真一覧取得
app.get('/api/photos', async (req, res) => {
  try {
    const photos = await Photo.find().sort({ created_at: -1 });
    res.json({ success: true, photos });
  } catch (error) {
    res.status(500).json({ success: false, error: '写真取得エラー' });
  }
});

// ユーザー一覧取得
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().sort({ nickname: 1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'ユーザー取得エラー' });
  }
});

// Kaleido ネットワーク情報取得
app.get('/api/network', async (req, res) => {
  try {
    const networkInfo = await blockchainService.getNetworkInfo();
    res.json({ success: true, networkInfo });
  } catch (error) {
    res.status(500).json({ success: false, error: 'ネットワーク情報取得エラー' });
  }
});

// ヘルスチェック (Kaleido対応)
app.get('/health', async (req, res) => {
  try {
    const networkInfo = await blockchainService.getNetworkInfo();
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      blockchain: {
        network: 'Kaleido Blockchain',
        chainId: process.env.CHAIN_ID || '23251219',
        contractAddress: process.env.CONTRACT_ADDRESS,
        contractName: process.env.CONTRACT_NAME || 'HitachiNebutaToken',
        contractSymbol: process.env.CONTRACT_SYMBOL || 'HNT',
        blockNumber: networkInfo?.blockNumber || 'N/A',
        isKaleido: true
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString(),
      blockchain: {
        network: 'Kaleido Blockchain',
        chainId: process.env.CHAIN_ID || '23251219',
        isKaleido: true
      }
    });
  }
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'サーバー内部エラーが発生しました'
  });
});

// サーバー起動
app.listen(port, '0.0.0.0', () => {
  console.log('🚀 NFT Photo Server (Kaleido) running on port ' + port);
  console.log('🌐 Environment: ' + (process.env.NODE_ENV || 'production'));
  console.log('🎯 Contract: ' + (process.env.CONTRACT_NAME || 'HitachiNebutaToken'));
  console.log('🔗 Chain ID: ' + (process.env.CHAIN_ID || '23251219'));
});
