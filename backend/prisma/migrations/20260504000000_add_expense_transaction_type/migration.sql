-- Add 'expense' value to TransactionType enum
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'expense';
