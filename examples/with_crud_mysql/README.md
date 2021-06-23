## Dero with basic CRUD MySQL.
This is a simple crud dero featuring mysql database.

### Create database and table

```sql
CREATE DATABASE IF NOT EXISTS `dero-crud`;
USE `dero-crud`;
CREATE TABLE IF NOT EXISTS `items` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(100) NOT NULL,
	`brand` VARCHAR(100) NOT NULL,
	`price` INT(11) NOT NULL,
	PRIMARY KEY (`id`)
)
ENGINE=InnoDB DEFAULT CHARSET=latin1;
```

### Run deno
```bash
deno run --allow-net --allow-read app.ts
```

### Rest APIs
```bash
GET     /api/v1/items
GET     /api/v1/items/search
GET     /api/v1/items/:id
POST    /api/v1/items
PUT     /api/v1/items/:id
DELETE  /api/v1/items/:id
```