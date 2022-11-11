CREATE TABLE IF NOT EXISTS `event` (
  `name` char(20) DEFAULT NULL,
  `date` char(8) DEFAULT NULL,
  `admin` char(20) DEFAULT NULL,
  `limits` char(3) DEFAULT NULL,
  `description` char(255) DEFAULT NULL
)

INSERT INTO `event` (`name`, `date`, `admin`, `limits`, `description`) VALUES
	('test', '20180101', '名字', '40', 'no'),
	('full', '20180404', 'qwert', '1', 'only one'),
	('willdelete', '20180505', 'qwert', '10', 'haha'),
	('eeee', '20180303', '名字', '3', 'ewtghrver'),
	('eecs', '19960555', '名字', '100', 'ddddd'),
	('eesssss', '20180505', '名字', '30', 'how to write');

CREATE TABLE IF NOT EXISTS `matchs` (
  `account` char(10) DEFAULT NULL,
  `active` char(20) DEFAULT NULL
)

INSERT INTO `matchs` (`account`, `active`) VALUES
	('1234', 'test'),
	('aaaa', 'willdelete'),
	('1111', 'willdelete'),
	('aaaa', 'eecs'),
	('dddd', 'test');

CREATE TABLE IF NOT EXISTS `people` (
  `active` char(20) DEFAULT NULL,
  `number` char(3) DEFAULT NULL
)

INSERT INTO `people` (`active`, `number`) VALUES
	('test', '2'),
	('full', '0'),
	('willdelete', '2'),
	('eeee', '0'),
	('eecs', '1'),
	('eesssss', '0');

CREATE TABLE IF NOT EXISTS `user` (
  `name` char(20) DEFAULT NULL,
  `account` char(10) DEFAULT NULL,
  `password` char(10) DEFAULT NULL,
  `email` char(50) DEFAULT NULL
)

INSERT INTO `user` (`name`, `account`, `password`, `email`) VALUES
	('名字', 'aaaa', 'bbbb', 'h6871828@gmail.com'),
	('qwert', '1234', '1234', 'dauthtw4213.eecs03@g2.nctu.edu.tw'),
	('test', '1111', '2222', 'h6871828@yahoo.com.tw'),
	('dddd', 'dddd', 'ssss', 'kkread0101@yahoo.com.tw');
