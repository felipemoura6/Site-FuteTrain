const express = require('express');
const mysql = require('mysql');

const app = express();
const port = 3000;

// Configurações do MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'COLOCAR SENHA',
  database: 'COLOCAR DB'
});

// Conectar ao MySQL
db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao MySQL:', err);
    return;
  }
  console.log('Conectado ao MySQL');
});

// Middleware para parsing de JSON
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.send('Bem-vindo ao Futetrain!');
});

// Rota para adicionar um novo usuário
app.post('/users', (req, res) => {
  const newUser = req.body;
  const sql = 'INSERT INTO users SET ?';

  db.query(sql, newUser, (err, result) => {
    if (err) {
      console.error('Erro ao adicionar usuário:', err);
      res.status(500).send('Erro ao adicionar usuário');
      return;
    }
    res.status(201).send('Usuário adicionado com sucesso');
  });
});


// Rota para listar todos os usuários
app.get('/users', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) {
      console.error('Erro ao listar usuários:', err);
      res.status(500).send('Erro ao listar usuários');
      return;
    }
    res.json(results); // Envia os resultados como JSON
  });
});

// Rota para obter um usuário pelo ID
app.get('/users/:id', (req, res) => {
  const userId = req.params.id;

  // Executa a query SELECT no banco de dados para obter o usuário com o ID especificado
  db.query('SELECT * FROM users WHERE id = ?', userId, (err, results) => {
    if (err) {
      console.error('Erro ao obter usuário:', err);
      res.status(500).send('Erro ao obter usuário');
      return;
    }
    
    // Verifica se o usuário foi encontrado
    if (results.length === 0) {
      res.status(404).send('Usuário não encontrado');
      return;
    }

    // Retorna os dados do usuário encontrado
    res.json(results[0]);
  });
});

// Rota para deletar um usuário pelo ID
app.delete('/users/:id', (req, res) => {
  const userId = req.params.id;

  // Executa a query DELETE no banco de dados para deletar o usuário com o ID especificado
  db.query('DELETE FROM users WHERE id = ?', userId, (err, result) => {
    if (err) {
      console.error('Erro ao deletar usuário:', err);
      res.status(500).send('Erro ao deletar usuário');
      return;
    }
    
    // Verifica se o usuário foi deletado com sucesso
    if (result.affectedRows === 0) {
      res.status(404).send('Usuário não encontrado');
      return;
    }

    // Retorna uma resposta indicando que o usuário foi deletado com sucesso
    res.status(200).send('Usuário deletado com sucesso');
  });
});

// Rota para atualizar um usuário pelo ID
app.put('/users/:id', (req, res) => {
  const userId = req.params.id;
  const updatedUserData = req.body; // Dados atualizados do usuário

  // Executa a query UPDATE no banco de dados para atualizar o usuário com o ID especificado
  db.query('UPDATE users SET ? WHERE id = ?', [updatedUserData, userId], (err, result) => {
    if (err) {
      console.error('Erro ao atualizar usuário:', err);
      res.status(500).send('Erro ao atualizar usuário');
      return;
    }
    
    // Verifica se o usuário foi encontrado e atualizado
    if (result.affectedRows === 0) {
      res.status(404).send('Usuário não encontrado');
      return;
    }

    // Retorna uma resposta indicando que o usuário foi atualizado com sucesso
    res.status(200).send('Usuário atualizado com sucesso');
  });
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

