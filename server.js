const express = require('express');
const mysql = require('mysql');
const path = require('path'); // Add this line
const app = express();
const port = 3006;
const cors = require('cors');

// Permitir todas as origens
app.use(cors());

const corsOptions = {
  origin: 'http://localhost:5173', // permitir apenas solicitações de http://localhost:5173
};

app.use(cors(corsOptions));


// Configurações do MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Haitou100*5%',
  database: 'FuteTrainDB'
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
// app.get('/users', (req, res) => {
//   db.query('SELECT * FROM users', (err, results) => {
//     if (err) {
//       console.error('Erro ao listar usuários:', err);
//       res.status(500).send('Erro ao listar usuários');
//       return;
//     }
//     res.json(results); // Envia os resultados como JSON
//   });
// });

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




// ======================================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Rota para registrar um novo usuário
app.post('/register', (req, res) => {
  const { nome, email, senha } = req.body;

  // Hash da senha antes de salvar no banco de dados
  bcrypt.hash(senha, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Erro ao hash da senha:', err);
      res.status(500).send('Erro ao registrar usuário');
      return;
    }

    // Inserir o usuário no banco de dados
    db.query('INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)', [nome, email, hashedPassword], (err, result) => {
      if (err) {
        console.error('Erro ao registrar usuário:', err);
        res.status(500).send('Erro ao registrar usuário');
        return;
      }
      res.status(201).send('Usuário registrado com sucesso');
    });
  });
});

// ======================================================================

// Chave secreta para assinar o token
const SECRET_KEY = 'asidjaisdjsaidjsaidja';

// Rota para login de usuário
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  // Verificar se o usuário existe
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err);
      res.status(500).send('Erro ao fazer login');
      return;
    }

    if (results.length === 0) {
      res.status(404).send('Usuário não encontrado');
      return;
    }

    const user = results[0];

    // Verificar a senha
    bcrypt.compare(senha, user.senha, (err, isMatch) => {
      if (err) {
        console.error('Erro ao comparar senha:', err);
        res.status(500).send('Erro ao fazer login');
        return;
      }

      if (!isMatch) {
        res.status(401).send('Senha incorreta');
        return;
      }

      // Gerar um token JWT
      const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ token });
    });
  });
});



// ======================================================================

// Middleware para verificar o token JWT
function authenticateToken(req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).send('Acesso negado');
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).send('Token inválido');
    }

    req.user = user;
    next();
  });
}

// Exemplo de rota protegida
app.get('/protected', authenticateToken, (req, res) => {
  res.send('Esta é uma rota protegida');
});

// ======================================================================




// Rota para retornar usuario

// app.get('/users', authenticateToken, (req, res) => {
//     const userId = req.user.id;

//     db.query('SELECT nome FROM users WHERE id = ?', [userId], (err, results) => {
//         if (err) throw err;
//         if (results.length > 0) {
//           res.json({ nome: results[0].nome });
//         } else {
//             res.sendStatus(404);
//         }
//     });
// });

app.get('/users', authenticateToken, (req, res) => {
  const userId = req.user.id;

  // Atualize a consulta SQL para selecionar nome, email e id
  db.query('SELECT nome, email, id, image FROM users WHERE id = ?', [userId], (err, results) => {
      if (err) throw err;
      if (results.length > 0) {
        // Retornando os campos nome, email e id
        res.json({ 
          nome: results[0].nome,
          email: results[0].email,
          id: results[0].id,
          image: results[0].image
        });
      } else {
          res.sendStatus(404);
      }
  });
});



//==================================================================

// Rota para listar as notícias
app.get('/news', (req, res) => {
  db.query('SELECT * FROM news', (err, results) => {
    if (err) {
      console.error('Erro ao listar notícias:', err);
      res.status(500).send('Erro ao listar notícias');
      return;
    }
    res.json(results); // Envia os resultados como JSON
  });
});


// Requisição de NEWS









// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});


