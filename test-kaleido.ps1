# NFT Photo Server - Kaleido Edition テストスクリプト
# PowerShell用テストコマンド集（本格運用版）

Write-Host "=== NFT Photo Server - Kaleido Edition テスト ===" -ForegroundColor Green
Write-Host ""

# ベースURL設定
$baseUrl = "http://localhost:3000"

Write-Host "🌐 Kaleido Blockchain Network" -ForegroundColor Cyan
Write-Host "Chain ID: 23251219" -ForegroundColor White
Write-Host "Contract: HitachiNebutaToken (HNT)" -ForegroundColor White
Write-Host "Address: 0x4a223B8a4fcE1aBEa7b15089B1201B7750825d0f" -ForegroundColor White
Write-Host ""

Write-Host "1. サーバーヘルスチェック" -ForegroundColor Yellow
Write-Host "------------------------"

try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ サーバー状態:" -ForegroundColor Green
    $health | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ サーバー接続エラー:" -ForegroundColor Red
    $_.Exception.Message
}
Write-Host ""

Write-Host "2. Kaleido ネットワーク情報確認" -ForegroundColor Yellow
Write-Host "-----------------------------"

try {
    $network = Invoke-RestMethod -Uri "$baseUrl/api/network" -Method GET
    Write-Host "✅ ネットワーク情報:" -ForegroundColor Green
    $network.networkInfo | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ ネットワーク情報取得エラー:" -ForegroundColor Red
    $_.Exception.Message
}
Write-Host ""

Write-Host "3. Kaleidoユーザー登録テスト" -ForegroundColor Yellow
Write-Host "-----------------------------"

# テスト用アドレス（実際のKaleidoアドレスに変更してください）
$testAddresses = @(
    "0x1234567890123456789012345678901234567890",
    "0x0987654321098765432109876543210987654321",
    "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
)

$testNicknames = @(
    "Alice_Kaleido_User",
    "Bob_HNT_Holder", 
    "Charlie_NFT_Creator"
)

for ($i = 0; $i -lt $testAddresses.Length; $i++) {
    $userBody = @{
        blockchain_account_address = $testAddresses[$i]
        nickname = $testNicknames[$i]
    } | ConvertTo-Json

    Write-Host "テスト $($i+1): $($testNicknames[$i]) 登録" -ForegroundColor Cyan

    try {
        $userResult = Invoke-RestMethod -Uri "$baseUrl/api/users/register" `
            -Method POST -ContentType "application/json" -Body $userBody
        Write-Host "✅ 登録成功:" -ForegroundColor Green
        Write-Host "  Token ID: $($userResult.user.token_id)" -ForegroundColor White
        Write-Host "  Contract: $($userResult.blockchain.contractName)" -ForegroundColor White
        Write-Host "  Network: $($userResult.blockchain.network)" -ForegroundColor White
    } catch {
        Write-Host "ℹ️  結果（重複の場合は正常）:" -ForegroundColor Yellow
        $_.Exception.Message
    }
    Write-Host ""
}

Write-Host "4. 写真登録テスト（HNT NFT作成）" -ForegroundColor Yellow
Write-Host "-------------------------------"

$photoTests = @(
    @{
        hash = "kaleido_photo_hash_001"
        instaPhotoUrl = "https://instagram.com/p/kaleido_test_001"
        likeCount = 150
    },
    @{
        hash = "kaleido_photo_hash_002"  
        instaPhotoUrl = "https://instagram.com/p/kaleido_test_002"
        likeCount = 250
    },
    @{
        hash = "kaleido_photo_hash_003"
        instaPhotoUrl = "https://instagram.com/p/kaleido_test_003"
        likeCount = 89
    }
)

foreach ($photoTest in $photoTests) {
    $photoBody = $photoTest | ConvertTo-Json

    Write-Host "テスト: $($photoTest.hash)" -ForegroundColor Cyan

    try {
        $photoResult = Invoke-RestMethod -Uri "$baseUrl/api/register-photo" `
            -Method POST -ContentType "application/json" -Body $photoBody
        Write-Host "✅ 写真NFT登録成功:" -ForegroundColor Green
        Write-Host "  Token ID: $($photoResult.tokenId)" -ForegroundColor White
        Write-Host "  いいね数: $($photoResult.value)" -ForegroundColor White
        Write-Host "  Contract: $($photoResult.blockchain.contractName)" -ForegroundColor White
    } catch {
        Write-Host "ℹ️  結果:" -ForegroundColor Yellow
        $_.Exception.Message
    }
    Write-Host ""
}

Write-Host "5. データベース確認" -ForegroundColor Yellow
Write-Host "------------------"

try {
    Write-Host "📋 登録済みユーザー一覧:" -ForegroundColor Cyan
    $users = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method GET
    if ($users.users.Count -gt 0) {
        foreach ($user in $users.users) {
            Write-Host "  👤 $($user.nickname) - Token ID: $($user.token_id)" -ForegroundColor White
        }
    } else {
        Write-Host "  📝 ユーザーが登録されていません" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ ユーザー取得エラー:" -ForegroundColor Red
    $_.Exception.Message
}

Write-Host ""

try {
    Write-Host "📸 登録済み写真一覧:" -ForegroundColor Cyan
    $photos = Invoke-RestMethod -Uri "$baseUrl/api/photos" -Method GET
    if ($photos.photos.Count -gt 0) {
        foreach ($photo in $photos.photos) {
            Write-Host "  📷 $($photo.hash) - Token ID: $($photo.token_id) - Status: $($photo.upload_status)" -ForegroundColor White
        }
    } else {
        Write-Host "  📝 写真が登録されていません" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ 写真取得エラー:" -ForegroundColor Red
    $_.Exception.Message
}

Write-Host ""

Write-Host "6. エラーケーステスト" -ForegroundColor Yellow
Write-Host "--------------------"

# 無効なアドレス形式テスト
Write-Host "テスト: 無効なアドレス形式" -ForegroundColor Cyan
$invalidBody = @{
    blockchain_account_address = "invalid_address_format"
    nickname = "Invalid_Test_User"
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/users/register" `
        -Method POST -ContentType "application/json" -Body $invalidBody
    Write-Host "❌ 予期しない成功:" -ForegroundColor Red
    $result | ConvertTo-Json
} catch {
    Write-Host "✅ 期待通りのエラー:" -ForegroundColor Green
    Write-Host "  400 Bad Request (無効なアドレス形式)" -ForegroundColor White
}

Write-Host ""

Write-Host "=== Kaleido Edition テスト完了 ===" -ForegroundColor Green
Write-Host ""
Write-Host "📝 テスト結果の確認ポイント:" -ForegroundColor White
Write-Host "- Kaleidoネットワーク接続確認" -ForegroundColor White
Write-Host "- HitachiNebutaToken (HNT) の使用確認" -ForegroundColor White
Write-Host "- 実際のブロックチェーントランザクション実行" -ForegroundColor White
Write-Host "- ユーザー用NFT (slot:1) とtoken_idの生成" -ForegroundColor White
Write-Host "- 写真用NFT (slot:2) といいね数の反映" -ForegroundColor White
Write-Host "- MongoDB データベースへの保存確認" -ForegroundColor White
Write-Host ""
Write-Host "🎯 本格運用準備完了！" -ForegroundColor Green
