-- TheDeep CleanerZ Database Schema Setup Script
-- You can import this file directly into your Hostinger phpMyAdmin SQL tab.

CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(255) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `tagline` VARCHAR(255),
  `emoji` VARCHAR(50),
  `image` VARCHAR(1000) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `services` (
  `id` VARCHAR(255) PRIMARY KEY,
  `categoryId` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `price` INT NOT NULL DEFAULT 0,
  `description` TEXT,
  `includes` JSON,
  FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `bookings` (
  `id` VARCHAR(255) PRIMARY KEY,
  `createdAt` VARCHAR(255) NOT NULL,
  `customer` JSON NOT NULL,
  `schedule` JSON NOT NULL,
  `notes` TEXT,
  `coupon` VARCHAR(100),
  `discount` INT DEFAULT 0,
  `total` INT NOT NULL,
  `items` JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
