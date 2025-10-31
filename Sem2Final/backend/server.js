const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // Para autenticação
const pool = require('./db'); // Importa o pool de conexão MySQL

const app = express();
const port = 3000;
const JWT_SECRET = 'seu-segredo-jwt-super-secreto'; // Mude isso para algo seguro

// Middlewares
app.use(cors());
app.use(express.json());

// --- Middleware de Autenticação ---
const autenticarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

  if (token == null) {
    console.warn("Acesso negado: Token não fornecido.");
    return res.sendStatus(401); // Não autorizado (sem token)
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.warn("Acesso negado: Token inválido ou expirado.");
      return res.sendStatus(403); // Proibido (token inválido)
    }
    req.user = user; // Adiciona os dados do usuário (id, nome, tipo_usuario) ao request
    next(); // Continua para a rota
  });
};

// --- ROTAS PÚBLICAS (Login / Recuperação de Senha) ---

// [LOGIN]
app.post('/api/login', async (req, res) => {
  const { email, password, tipo_usuario } = req.body;

  if (!email || !password || !tipo_usuario) {
    return res.status(400).json({ error: 'E-mail, senha e tipo de usuário são obrigatórios.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE email = ? AND senha_hash = ? AND tipo_usuario = ?',
      [email, password, tipo_usuario]
    );

    if (rows.length > 0) {
      const user = rows[0];
      
      const payload = { 
        id: user.id_usuario, 
        nome: user.nome, 
        tipo_usuario: user.tipo_usuario 
      };
      
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

      let redirectTo = '';
      switch (user.tipo_usuario) {
        case 'admin': redirectTo = 'telaAdmin.html'; break;
        case 'professor': redirectTo = 'telaProfessor.html'; break;
        case 'tecnico': redirectTo = 'telaTecnico.html'; break;
        default: redirectTo = 'telaLogin.html';
      }
      
      res.json({ 
        success: true, 
        redirectTo: redirectTo, 
        token: token, 
        userId: user.id_usuario, // ADICIONADO: Envia o ID do usuário
        userName: user.nome, // ADICIONADO: Envia o Nome
        userType: user.tipo_usuario
      });

    } else {
      res.status(401).json({ error: 'Credenciais inválidas. Verifique seu e-mail, senha e tipo de usuário.' });
    }
  } catch (err) {
    console.error('Erro na rota /api/login:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// [ESQUECEU SENHA] - Passo 1: Verificar E-mail
app.post('/api/recuperar-senha', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'E-mail é obrigatório.' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE email = ?',
      [email]
    );
    if (rows.length > 0) {
      res.json({ success: true, message: 'E-mail encontrado.' });
    } else {
      res.status(404).json({ error: 'E-mail não cadastrado no sistema.' });
    }
  } catch (err) {
    console.error('Erro na rota /api/recuperar-senha:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// [ESQUECEU SENHA] - Passo 2: Definir Nova Senha
app.post('/api/nova-senha', async (req, res) => {
  const { email, novaSenha } = req.body;
  if (!email || !novaSenha) {
    return res.status(400).json({ error: 'E-mail e nova senha são obrigatórios.' });
  }
  try {
    const [result] = await pool.query(
      'UPDATE usuarios SET senha_hash = ? WHERE email = ?',
      [novaSenha, email]
    );
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Senha alterada com sucesso!' });
    } else {
      res.status(404).json({ error: 'E-mail não encontrado.' });
    }
  } catch (err) {
    console.error('Erro na rota /api/nova-senha:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// [LABORATORIOS] - Rota pública para carregar labs nos formulários
// ATUALIZADO: Protegida, pois só usuários logados precisam dela.
app.get('/api/laboratorios', autenticarToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT *, id_laboratorio as id FROM laboratorios ORDER BY nome_laboratorio');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// --- ROTAS PROTEGIDAS (Exigem autenticação) ---

// [PROFESSOR] Obter agendamentos do professor logado
app.get('/api/professor/agendamentos', autenticarToken, async (req, res) => {
  if (req.user.tipo_usuario !== 'professor') {
    return res.status(403).json({ error: 'Acesso negado.' });
  }
  try {
    // CORRIGIDO: Query atualizada para o novo schema SQL (sem titulo_aula, etc.)
    const [rows] = await pool.query(
      `SELECT a.*, l.nome_laboratorio, k.nome_kit
       FROM agendamentos a
       LEFT JOIN laboratorios l ON a.fk_laboratorio = l.id_laboratorio
       LEFT JOIN kits k ON a.fk_kit = k.id_kit
       WHERE a.fk_usuario = ?
       ORDER BY a.data_hora_inicio DESC`,
      [req.user.id] // ID do usuário vem do token
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// [PROFESSOR] Criar novo agendamento
app.post('/api/professor/agendamentos', autenticarToken, async (req, res) => {
  if (req.user.tipo_usuario !== 'professor') {
    return res.status(403).json({ error: 'Acesso negado.' });
  }
  
  // CORRIGIDO: Removido campos que não existem no SQL (disciplina, turma, titulo_aula, num_alunos)
  const {
    data_hora_inicio, data_hora_fim,
    fk_laboratorio, fk_kit, observacoes
  } = req.body;
  
  // Validação simples
  if (!data_hora_inicio || !data_hora_fim || !fk_laboratorio) {
      return res.status(400).json({ error: 'Data, horário e laboratório são obrigatórios.' });
  }
  
  try {
    // CORRIGIDO: Query atualizada para o novo schema SQL
    const [result] = await pool.query(
      `INSERT INTO agendamentos 
        (fk_usuario, data_hora_inicio, data_hora_fim, fk_laboratorio, fk_kit, observacoes, status_agendamento)
       VALUES (?, ?, ?, ?, ?, ?, 'pendente')`, // Status inicial é 'pendente'
      [req.user.id, data_hora_inicio, data_hora_fim, fk_laboratorio, fk_kit, observacoes]
    );
    // Retorna o agendamento criado (buscando ele)
    const [novoAgendamento] = await pool.query('SELECT * FROM agendamentos WHERE id_agendamento = ?', [result.insertId]);
    res.status(201).json(novoAgendamento[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// [PROFESSOR] Cancelar um agendamento
app.put('/api/professor/agendamentos/:id/cancelar', autenticarToken, async (req, res) => {
    if (req.user.tipo_usuario !== 'professor' && req.user.tipo_usuario !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    const { id } = req.params;
    try {
        // CORREÇÃO: Admin também pode cancelar, professor só pode cancelar o seu
        let query = 'UPDATE agendamentos SET status_agendamento = ? WHERE id_agendamento = ?';
        const params = ['cancelado', id];

        if (req.user.tipo_usuario === 'professor') {
            query += ' AND fk_usuario = ?';
            params.push(req.user.id);
        }

        const [result] = await pool.query(query, params);
        
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Agendamento cancelado.' });
        } else {
            res.status(404).json({ error: 'Agendamento não encontrado ou não pertence a você.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


// [PROFESSOR] Obter kits (Professor e Admin podem ver)
app.get('/api/professor/kits', autenticarToken, async (req, res) => {
  if (req.user.tipo_usuario !== 'professor' && req.user.tipo_usuario !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado.' });
  }
  try {
    // Busca todos os kits (simplificado, como no script SQL)
    const [rows] = await pool.query(
        `SELECT *, id_kit as id FROM kits ORDER BY nome_kit`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// [PROFESSOR] Criar novo kit
app.post('/api/professor/kits', autenticarToken, async (req, res) => {
  if (req.user.tipo_usuario !== 'professor') {
    return res.status(403).json({ error: 'Acesso negado.' });
  }
  const { nome_kit, descricao_kit } = req.body;
  if (!nome_kit || !descricao_kit) {
      return res.status(400).json({ error: 'Nome e descrição do kit são obrigatórios.'});
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO kits (nome_kit, descricao_kit) VALUES (?, ?)`,
      [nome_kit, descricao_kit]
    );
    const [novoKit] = await pool.query('SELECT *, id_kit as id FROM kits WHERE id_kit = ?', [result.insertId]);
    res.status(201).json(novoKit[0]);
  } catch (err) {
    console.error(err);
     if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Um kit com este nome já existe.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// [PROFESSOR] Atualizar kit
app.put('/api/professor/kits/:id', autenticarToken, async (req, res) => {
    if (req.user.tipo_usuario !== 'professor') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    const { id } = req.params;
    const { nome_kit, descricao_kit } = req.body;
    try {
        const [result] = await pool.query(
            'UPDATE kits SET nome_kit = ?, descricao_kit = ? WHERE id_kit = ?',
            [nome_kit, descricao_kit, id]
        );
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Kit atualizado.' });
        } else {
            res.status(404).json({ error: 'Kit não encontrado.' });
        }
    } catch (err) {
        console.error(err);
         if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Um kit com este nome já existe.' });
        }
        res.status(500).json({ error: err.message });
    }
});

// [PROFESSOR] Excluir kit
app.delete('/api/professor/kits/:id', autenticarToken, async (req, res) => {
    if (req.user.tipo_usuario !== 'professor' && req.user.tipo_usuario !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    const { id } = req.params;
    try {
        // Primeiro, remova as associações deste kit (importante!)
        await pool.query('DELETE FROM kit_materiais WHERE fk_kit = ?', [id]);
        
        // Depois, exclua o kit
        const [result] = await pool.query(
            'DELETE FROM kits WHERE id_kit = ?',
            [id]
        );
        
        if (result.affectedRows > 0) {
            res.sendStatus(204); // Sucesso (sem conteúdo)
        } else {
            res.status(404).json({ error: 'Kit não encontrado.' });
        }
    } catch (err) {
        console.error(err);
        // Se o kit estiver em uso em 'agendamentos', o DB pode bloquear
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(409).json({ error: 'Este kit não pode ser excluído pois está sendo usado em agendamentos.' });
        }
        res.status(500).json({ error: err.message });
    }
});


// --- ROTAS DO ADMIN ---
// (Requerem autenticação E que o usuário seja 'admin')

// [ADMIN] Obter todos os usuários
app.get('/api/admin/usuarios', autenticarToken, async (req, res) => {
  if (req.user.tipo_usuario !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado.' });
  }
  try {
    const [rows] = await pool.query('SELECT id_usuario as id, nome, email, tipo_usuario FROM usuarios ORDER BY nome');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// [ADMIN] Criar novo usuário
app.post('/api/admin/usuarios', autenticarToken, async (req, res) => {
  if (req.user.tipo_usuario !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado.' });
  }
  const { nome, email, tipo_usuario, senha } = req.body;
  if (!nome || !email || !tipo_usuario || !senha) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.'});
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO usuarios (nome, email, tipo_usuario, senha_hash) VALUES (?, ?, ?, ?)`,
      [nome, email, tipo_usuario, senha] // ATENÇÃO: Senha em texto puro
    );
    res.status(201).json({ id: result.insertId, nome, email, tipo_usuario });
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// [ADMIN] Excluir usuário
app.delete('/api/admin/usuarios/:id', autenticarToken, async (req, res) => {
    if (req.user.tipo_usuario !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    const { id } = req.params;
    if (req.user.id == id) {
        return res.status(400).json({ error: 'Você não pode excluir a si mesmo.'});
    }
    try {
        const [result] = await pool.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
        if (result.affectedRows > 0) {
            res.sendStatus(204);
        } else {
            res.status(404).json({ error: 'Usuário não encontrado.' });
        }
    } catch (err) {
        console.error('Erro ao excluir usuário:', err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(409).json({ error: 'Este usuário não pode ser excluído pois possui agendamentos ou movimentações registradas.' });
        }
        res.status(500).json({ error: err.message });
    }
});


// [ADMIN/TECNICO] Obter todos os materiais (Estoque)
app.get('/api/materiais', autenticarToken, async (req, res) => {
    if (req.user.tipo_usuario !== 'admin' && req.user.tipo_usuario !== 'tecnico') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    try {
        const [rows] = await pool.query('SELECT *, id_material as id FROM materiais ORDER BY nome');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// [ADMIN/TECNICO] Criar novo material (Estoque)
app.post('/api/materiais', autenticarToken, async (req, res) => {
    if (req.user.tipo_usuario !== 'admin' && req.user.tipo_usuario !== 'tecnico') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    
    // CORRIGIDO: Campos do form do admin (tipoUnidade, valor)
    const { nome, descricao, localizacao, tipoUnidade, valor } = req.body;

    if (!nome || !tipoUnidade || !valor) {
         return res.status(400).json({ error: 'Nome, Tipo e Valor/Quantidade são obrigatórios.'});
    }

    let tipo_material = 'consumivel';
    let unidade = 'UN';

    if (tipoUnidade === 'peso') {
        tipo_material = 'reagente';
        unidade = 'g';
    } else if (tipoUnidade === 'litros') {
        tipo_material = 'reagente';
        unidade = 'ml';
    } else if (tipoUnidade === 'unidade') {
        tipo_material = 'vidraria'; // Assumindo que 'unidade' é vidraria/equipamento
        unidade = 'UN';
    }
    
    try {
        const [result] = await pool.query(
            `INSERT INTO materiais (nome, descricao, localizacao, tipo_material, quantidade, unidade, status) 
             VALUES (?, ?, ?, ?, ?, ?, 'disponivel')`,
            [nome, descricao, localizacao, tipo_material, valor, unidade]
        );
        const [novoMaterial] = await pool.query('SELECT *, id_material as id FROM materiais WHERE id_material = ?', [result.insertId]);
        res.status(201).json(novoMaterial[0]);
    } catch (err) {
        console.error('Erro ao criar material:', err);
        res.status(500).json({ error: err.message });
    }
});

// [ADMIN] Obter todos os agendamentos (para visão geral)
app.get('/api/admin/agendamentos', autenticarToken, async (req, res) => {
    if (req.user.tipo_usuario !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    try {
        // CORRIGIDO: Query atualizada para o novo schema SQL
        const [rows] = await pool.query(
          `SELECT 
             a.*, 
             l.nome_laboratorio, 
             k.nome_kit,
             u.nome as nome_professor
           FROM agendamentos a
           LEFT JOIN laboratorios l ON a.fk_laboratorio = l.id_laboratorio
           LEFT JOIN kits k ON a.fk_kit = k.id_kit
           LEFT JOIN usuarios u ON a.fk_usuario = u.id_usuario
           ORDER BY a.data_hora_inicio DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


// --- ROTAS DO TÉCNICO ---
// (Requerem autenticação E que o usuário seja 'tecnico')

// [TECNICO] Obter agendamentos pendentes
app.get('/api/tecnico/agendamentos/pendentes', autenticarToken, async (req, res) => {
  if (req.user.tipo_usuario !== 'tecnico' && req.user.tipo_usuario !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado.' });
  }
  try {
    // CORRIGIDO: Query atualizada para o novo schema SQL
    const [rows] = await pool.query(
      `SELECT 
         a.*, 
         l.nome_laboratorio, 
         k.nome_kit,
         k.descricao_kit,
         u.nome as nome_professor
       FROM agendamentos a
       LEFT JOIN laboratorios l ON a.fk_laboratorio = l.id_laboratorio
       LEFT JOIN kits k ON a.fk_kit = k.id_kit
       LEFT JOIN usuarios u ON a.fk_usuario = u.id_usuario
       WHERE a.status_agendamento = 'pendente'
       ORDER BY a.data_hora_inicio ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// [TECNICO] Atualizar status de um agendamento (Aprovar/Rejeitar)
app.put('/api/tecnico/agendamentos/:id/status', autenticarToken, async (req, res) => {
    if (req.user.tipo_usuario !== 'tecnico' && req.user.tipo_usuario !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    const { id } = req.params;
    const { status } = req.body; // 'confirmado' ou 'cancelado'

    if (!status || (status !== 'confirmado' && status !== 'cancelado')) {
        return res.status(400).json({ error: "Status inválido." });
    }
    try {
        const [result] = await pool.query(
            'UPDATE agendamentos SET status_agendamento = ? WHERE id_agendamento = ?',
            [status, id]
        );
        if (result.affectedRows > 0) {
            res.json({ success: true, message: `Agendamento ${status}.` });
        } else {
            res.status(404).json({ error: 'Agendamento não encontrado.' });
        }
    } catch (err) {
        console.error('Erro ao atualizar status:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});


// [TECNICO/ADMIN] Obter histórico de agendamentos (Todos que não estão pendentes)
app.get('/api/agendamentos/historico', autenticarToken, async (req, res) => {
    if (req.user.tipo_usuario !== 'tecnico' && req.user.tipo_usuario !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    try {
        // CORRIGIDO: Query atualizada para o novo schema SQL
        const [rows] = await pool.query(
          `SELECT 
             a.*, 
             l.nome_laboratorio, 
             u.nome as nome_professor
           FROM agendamentos a
           LEFT JOIN laboratorios l ON a.fk_laboratorio = l.id_laboratorio
           LEFT JOIN usuarios u ON a.fk_usuario = u.id_usuario
           WHERE a.status_agendamento != 'pendente'
           ORDER BY a.data_hora_inicio DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


// Inicia o servidor
app.listen(port, () => {
  console.log(`Backend rodando em http://localhost:${port}`);
});

