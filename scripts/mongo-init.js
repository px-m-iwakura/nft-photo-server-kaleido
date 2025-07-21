// MongoDB initialization script for NFT Photo Server - Kaleido Edition
// This script is executed when MongoDB container starts for the first time

print('🍃 Initializing NFT Database for Kaleido...');

// Switch to nft_db database
db = db.getSiblingDB('nft_db');

// Create users collection with indexes
db.createCollection('users');
db.users.createIndex({ "blockchain_account_address": 1 }, { unique: true });
db.users.createIndex({ "nickname": 1 });
db.users.createIndex({ "token_id": 1 });

print('✅ Users collection created with indexes');

// Create photos collection with indexes
db.createCollection('photos');
db.photos.createIndex({ "hash": 1 }, { unique: true });
db.photos.createIndex({ "blockchain_account_address": 1 });
db.photos.createIndex({ "token_id": 1 });
db.photos.createIndex({ "created_at": -1 });
db.photos.createIndex({ "upload_status": 1 });

print('✅ Photos collection created with indexes');

// Create initial admin user if needed
// db.users.insertOne({
//   blockchain_account_address: "0x0000000000000000000000000000000000000001",
//   nickname: "System Admin",
//   token_id: null,
//   created_at: new Date()
// });

print('🎯 NFT Database initialization completed for Kaleido blockchain');
print('📋 Collections: users, photos');
print('🔗 Network: Kaleido Blockchain (Chain ID: 23251219)');
print('🎨 Contract: HitachiNebutaToken (HNT)');
