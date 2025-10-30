-- Active: 1761682441709@@127.0.0.1@3306@etec
-- =============================================
-- Sistema de Laboratórios - ETEC
-- Script de criação do banco de dados etec
-- =============================================

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('administrador', 'professor', 'tecnico') NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Laboratórios
CREATE TABLE IF NOT EXISTS laboratorios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    capacidade INT NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    professor_id INT NOT NULL,
    laboratorio_id INT NOT NULL,
    disciplina VARCHAR(100),
    turma VARCHAR(50),
    titulo VARCHAR(200) NOT NULL,
    data_agendamento DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    num_alunos INT,
    observacoes TEXT,
    status ENUM('pendente', 'confirmado', 'preparado', 'em_andamento', 'concluido', 'cancelado') DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (professor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (laboratorio_id) REFERENCES laboratorios(id) ON DELETE CASCADE,
    INDEX idx_data (data_agendamento),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Kits
CREATE TABLE IF NOT EXISTS kits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    professor_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    num_itens INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (professor_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Itens de Estoque
CREATE TABLE IF NOT EXISTS itens_estoque (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    categoria VARCHAR(100),
    descricao TEXT,
    quantidade INT NOT NULL DEFAULT 0,
    unidade VARCHAR(50),
    localizacao VARCHAR(100),
    validade DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Relação Kit x Item
CREATE TABLE IF NOT EXISTS kit_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kit_id INT NOT NULL,
    item_estoque_id INT NOT NULL,
    quantidade_necessaria INT DEFAULT 1,
    FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE CASCADE,
    FOREIGN KEY (item_estoque_id) REFERENCES itens_estoque(id) ON DELETE CASCADE,
    UNIQUE KEY unique_kit_item (kit_id, item_estoque_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Laboratórios
INSERT INTO laboratorios (nome, descricao, capacidade) VALUES
('Laboratório 1', 'Química Geral', 35),
('Laboratório 2', 'Química Orgânica', 20),
('Laboratório 3', 'Química Analítica', 25);

INSERT INTO itens_estoque (nome, categoria, descricao, quantidade, unidade, localizacao, validade) VALUES
('Ácido Clorídrico', 'Reagente Químico', 'Frasco de 1L, 37%', 5, 'Litros', 'Lab. de Química 01', '2026-12-31'),
('Béquer de Vidro', 'Vidraria', 'Capacidade 500ml', 25, 'Peças', 'Lab. de Química 01', NULL),
('Pipeta Graduada', 'Vidraria', 'Capacidade 10ml', 40, 'Peças', 'Lab. de Química 02', NULL),
('Hidróxido de Sódio', 'Reagente Químico', 'Pote de 500g, em escamas', 8, 'Gramas', 'Lab. de Química 02', '2025-06-30'),
('Papel Filtro', 'Material de Apoio', NULL, 250, 'Unidades', 'Prateleira 1C', NULL),
('Luvas Nitrílicas', 'EPIs', NULL, 100, 'Pares', 'Armário de Segurança', NULL);

