import mysql from "mysql2";

const mysqlConfigs = GetConvar("mysql_connection_string", "")
	.split(";")
	.map((v) => v.split("="))
	.map((row) => ({ [row[0]]: row[1] }))
	.reduce((obj, item) => Object.assign(obj, item, {}));

const pool = mysql.createPool({
	host: mysqlConfigs.server,
	user: mysqlConfigs.uid,
	port: 3306,
	database: mysqlConfigs.database,
	password: mysqlConfigs.password,
});

const promisePool = pool.promise();
export default promisePool;
