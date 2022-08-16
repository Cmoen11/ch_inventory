/*
Navicat MySQL Data Transfer

Source Server         : fivem.no
Source Server Version : 100329
Source Host           : fivem.no:3306
Source Database       : essentialmode

Target Server Type    : MYSQL
Target Server Version : 100329
File Encoding         : 65001

Date: 2022-08-16 08:08:27
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for inventories
-- ----------------------------
DROP TABLE IF EXISTS `inventories`;
CREATE TABLE `inventories` (
  `inventory` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL DEFAULT '',
  `slots` longtext DEFAULT NULL,
  PRIMARY KEY (`inventory`,`owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
SET FOREIGN_KEY_CHECKS=1;
