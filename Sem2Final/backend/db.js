require('dotenv').config();
const mysql = require('mysql2/promise');

// Configuração do Pool de Conexões
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, // <-- CORRIGIDO: Deve ser DB_NAME, como no seu .env
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Teste de Conexão
pool.getConnection()
  .then(connection => {
    console.log('Conexão com o banco de dados MySQL estabelecida com sucesso!');
    connection.release();
  })
  .catch(err => {
    console.error('Erro ao conectar ao banco de dados:', err);
  });

module.exports = pool;
