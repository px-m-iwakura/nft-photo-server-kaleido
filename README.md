# NFT Photo Server - Kaleido Edition 🌐

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Kaleido](https://img.shields.io/badge/Blockchain-Kaleido-blue.svg)](https://www.kaleido.io/)
[![HitachiNebutaToken](https://img.shields.io/badge/Contract-HNT-orange.svg)](https://github.com)

NFT写真登録サーバーのKaleido Blockchain版です。Instagram写真をHitachiNebutaToken（HNT）として本格的なブロックチェーンネットワークに登録できます。

## 🎯 概要

### 機能
- **ユーザー登録**: ブロックチェーンアカウントとニックネームでユーザー用NFT作成
- **写真登録**: Instagram写真URLといいね数で写真用NFT作成
- **本格運用**: Kaleidoブロックチェーンで実際のトランザクション実行
- **RESTful API**: 標準的なHTTP APIでアクセス可能

### 技術スタック
- **フロントエンド**: RESTful API（任意のクライアントで利用可能）
- **バックエンド**: Node.js + Express.js
- **ブロックチェーン**: Kaleido + Web3.js（本格運用）
- **データベース**: MongoDB
- **インフラ**: Docker + Docker Compose

## 🌐 ブロックチェーン情報

### Kaleido Network
- **Chain ID**: `23251219`
- **RPC Endpoint**: `https://u1q4aby0zt:0HHfp9Fj9YnShcVwSsgaPKz9HkZJbqazpDQfyFOisHk@u1cyktimmj-u1ed8q3cmw-rpc.us1-azure.kaleido.io/`

### HitachiNebutaToken (HNT)
- **Contract Name**: HitachiNebutaToken
- **Symbol**: HNT
- **Address**: `0x4a223B8a4fcE1aBEa7b15089B1201B7750825d0f`
- **Functions**:
  - `mint(address mintTo_, uint256 slot_, uint256 value_)`
  - `setTokenURI(uint256 tokenId_, string memory uri_)`

## 🏗️ システム構成

```
                        Docker Compose Environment                          

   NFT Server        MongoDB               Kaleido Blockchain             
   (Port 3000)     (Port 27017)          (External Network)               

  Express API     Users Collection        HitachiNebutaToken             
  Web3.js         Photos Collection       (0x4a22...5d0f)                
  KaleidoService                                                          

                     ↕ HTTP API                                            

                   Client Applications                                     
                   (PowerShell/curl/etc)                                   
```

## 🚀 セットアップ

### 前提条件
- Docker Desktop（インストール済み）
- Node.js 18.x LTS以上（ローカル開発の場合）
- Git（リポジトリクローン用）
- **Kaleidoアカウント用のプライベートキー**

### 1. リポジトリクローン
```bash
git clone https://github.com/px-m-iwakura/nft-photo-server-kaleido.git
cd nft-photo-server-kaleido
```

### 2. 環境変数設定
```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

**.env ファイルを編集**:
```env
# === Kaleido Blockchain Configuration ===
BLOCKCHAIN_RPC=https://u1q4aby0zt:0HHfp9Fj9YnShcVwSsgaPKz9HkZJbqazpDQfyFOisHk@u1cyktimmj-u1ed8q3cmw-rpc.us1-azure.kaleido.io/
CHAIN_ID=23251219
CONTRACT_ADDRESS=0x4a223B8a4fcE1aBEa7b15089B1201B7750825d0f

# === 重要: あなたのプライベートキーを設定 ===
PRIVATE_KEY=your_actual_private_key_here
```

⚠️ **重要**: `PRIVATE_KEY`には実際のKaleidoアカウント用プライベートキーを設定してください

### 3. Docker起動
```bash
docker-compose up -d
```

### 4. 動作確認
```bash
# ヘルスチェック
curl http://localhost:3000/health

# 期待されるレスポンス
{
  "status": "OK",
  "environment": "production",
  "blockchain": {
    "network": "Kaleido Blockchain",
    "chainId": "23251219",
    "contractName": "HitachiNebutaToken",
    "isKaleido": true
  }
}
```

## 📝 API使用方法

### ユーザー登録API
HitachiNebutaToken（HNT）でユーザー用NFT（slot:1）を作成

```bash
POST http://localhost:3000/api/users/register
Content-Type: application/json

{
  "blockchain_account_address": "0x1234567890123456789012345678901234567890",
  "nickname": "テストユーザー"
}
```

**成功レスポンス例**:
```json
{
  "success": true,
  "message": "ユーザー登録が完了しました（Kaleido）",
  "user": {
    "blockchain_account_address": "0x1234567890123456789012345678901234567890",
    "nickname": "テストユーザー",
    "token_id": "1737123456789"
  },
  "blockchain": {
    "tokenId": 1737123456789,
    "slot": 1,
    "value": 1,
    "network": "Kaleido Blockchain",
    "contractName": "HitachiNebutaToken",
    "contractSymbol": "HNT",
    "chainId": "23251219"
  }
}
```

### 写真登録API
HitachiNebutaToken（HNT）で写真用NFT（slot:2）を作成

```bash
POST http://localhost:3000/api/register-photo
Content-Type: application/json

{
  "hash": "kaleido_photo_hash_001",
  "instaPhotoUrl": "https://instagram.com/p/example",
  "likeCount": 150
}
```

### その他のAPI
- `GET /api/users` - ユーザー一覧取得
- `GET /api/photos` - 写真一覧取得
- `GET /api/network` - Kaleidoネットワーク情報取得
- `GET /health` - サーバーヘルスチェック

## 🧪 PowerShellテスト例

```powershell
# ユーザー登録テスト
$userBody = @{
    blockchain_account_address = "0x1234567890123456789012345678901234567890"
    nickname = "PowerShellテストユーザー"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/users/register" `
  -Method POST -ContentType "application/json" -Body $userBody

# 写真登録テスト
$photoBody = @{
    hash = "kaleido_test_hash_001"
    instaPhotoUrl = "https://instagram.com/p/kaleido_test"
    likeCount = 250
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/register-photo" `
  -Method POST -ContentType "application/json" -Body $photoBody

# ネットワーク情報確認
Invoke-RestMethod -Uri "http://localhost:3000/api/network"
```

## 🔧 開発・運用

### Docker管理コマンド
```bash
# サーバー起動
docker-compose up -d

# サーバー停止
docker-compose down

# ログ確認
docker-compose logs -f app

# サーバー再起動
docker-compose restart app

# データベース完全リセット
docker-compose down -v
```

### ログ監視
```bash
# アプリケーションログ
docker-compose logs -f app

# MongoDB ログ
docker-compose logs -f mongodb

# 全体ログ
docker-compose logs -f
```

## 🔐 セキュリティ

### 本格運用時の注意点
1. **プライベートキー管理**: `.env`ファイルは**絶対に**Gitにコミットしない
2. **アクセス制限**: 本番環境では適切なファイアウォール設定
3. **HTTPS化**: 本番環境では必ずHTTPS通信を使用
4. **レート制限**: API呼び出し頻度の監視と制限
5. **バックアップ**: MongoDB データの定期バックアップ

### 環境変数セキュリティ
```bash
# プライベートキーの権限設定（Linux/macOS）
chmod 600 .env
```

## 🚨 トラブルシューティング

### よくある問題

**1. Kaleido接続エラー**
```
❌ Kaleido network connection error
```
**解決方法**:
- `BLOCKCHAIN_RPC` URLが正しいか確認
- `PRIVATE_KEY` が設定されているか確認
- Kaleidoネットワークの状態確認

**2. Contract initialization error**
```
❌ Contract initialization error: CONTRACT_ADDRESS not configured
```
**解決方法**:
- `.env` ファイルの `CONTRACT_ADDRESS` を確認
- 設定後にサーバー再起動

**3. Account setup error**
```
❌ Account setup error: invalid private key
```
**解決方法**:
- プライベートキー形式確認（0x付きまたは無しどちらでも対応）
- 秘密鍵の有効性確認

### デバッグ方法
```bash
# 詳細ログの確認
docker-compose logs -f app | grep -E "(error|Error|ERROR|❌)"

# コンテナ内での直接確認
docker-compose exec app sh
cat .env
node -e "console.log(process.env.PRIVATE_KEY ? 'PRIVATE_KEY configured' : 'PRIVATE_KEY missing')"
```

## 📈 監視・メトリクス

### ヘルスチェック監視
```bash
# 定期的なヘルスチェック
watch -n 30 'curl -s http://localhost:3000/health | jq .'
```

### ブロックチェーン状態監視
```bash
# ネットワーク情報の定期確認
watch -n 60 'curl -s http://localhost:3000/api/network | jq .networkInfo'
```

## 🔄 Local版からの移行差分

### 主な変更点
- ✅ **Ganache削除**: ローカルブロックチェーンを削除
- ✅ **Kaleido統合**: 本格的なブロックチェーンネットワーク接続
- ✅ **HNT契約**: HitachiNebutaToken使用
- ✅ **認証機能**: プライベートキー認証
- ✅ **ガス管理**: 実際のガス使用量とガス価格
- ✅ **本番対応**: セキュリティとパフォーマンス強化

## 📞 サポート

### 問題報告
問題が発生した場合は、以下の情報と合わせて報告してください：

1. **エラーメッセージ**: 完全なエラーログ
2. **環境情報**: OS、Docker version
3. **設定情報**: `.env` ファイル（プライベートキー除く）
4. **再現手順**: 問題が発生するまでの手順

### リソース
- [Kaleido Documentation](https://docs.kaleido.io/)
- [Web3.js Documentation](https://web3js.readthedocs.io/)
- [Express.js Documentation](https://expressjs.com/)

---

**🎉 NFT Photo Server - Kaleido Edition へようこそ！**

本格的なブロックチェーンネットワークでのNFT作成をお楽しみください。
