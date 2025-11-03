-- ====================================================================================
-- SCRIPT COMPLETO PARA CRIAÇÃO E POPULAÇÃO DO BANCO DE DADOS
-- ETAPA 1: CRIAÇÃO DO BANCO DE DADOS E TABELAS
-- ====================================================================================

-- Cria o banco de dados se ele ainda não existir, com suporte a caracteres especiais
CREATE DATABASE IF NOT EXISTS `etec_laboratorio` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Define o banco de dados recém-criado como o padrão para os comandos a seguir
USE `etec_laboratorio`;

-- Tabela para gerenciar os usuários do sistema (COM ALTERAÇÕES)
CREATE TABLE `usuarios` (
  `id_usuario` INT AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `senha_hash` VARCHAR(255) NOT NULL,
  `tipo_usuario` ENUM('professor', 'admin', 'tecnico') NOT NULL DEFAULT 'professor', -- ALTERADO
  `data_criacao` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabela central para todos os materiais: equipamentos, vidrarias e reagentes
CREATE TABLE `materiais` (
  `id_material` INT AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(255) NOT NULL,
  `descricao` TEXT,
  `tipo_material` ENUM('equipamento', 'vidraria', 'reagente', 'consumivel') NOT NULL,
  `quantidade` DECIMAL(10,2) NOT NULL,
  `unidade` VARCHAR(20),
  `localizacao` VARCHAR(255),
  `status` ENUM('disponivel', 'em_uso', 'manutencao', 'quebrado') NOT NULL DEFAULT 'disponivel',
  `observacoes` TEXT
) ENGINE=InnoDB;

-- Tabela para definir os kits
CREATE TABLE `kits` (
  `id_kit` INT AUTO_INCREMENT PRIMARY KEY,
  `nome_kit` VARCHAR(255) NOT NULL UNIQUE,
  `descricao_kit` TEXT
) ENGINE=InnoDB;

-- Tabela de associação para definir quais materiais compõem um kit
CREATE TABLE `kit_materiais` (
  `id_kit_material` INT AUTO_INCREMENT PRIMARY KEY,
  `fk_kit` INT NOT NULL,
  `fk_material` INT NOT NULL,
  `quantidade_no_kit` INT NOT NULL,
  FOREIGN KEY (`fk_kit`) REFERENCES `kits`(`id_kit`) ON DELETE CASCADE,
  FOREIGN KEY (`fk_material`) REFERENCES `materiais`(`id_material`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabela para registrar movimentações de estoque
CREATE TABLE `movimentacoes` (
  `id_movimentacao` INT AUTO_INCREMENT PRIMARY KEY,
  `fk_material` INT NOT NULL,
  `fk_usuario` INT,
  `tipo_movimentacao` ENUM('entrada', 'saida', 'baixa_quebra', 'ajuste') NOT NULL,
  `quantidade` DECIMAL(10,2) NOT NULL,
  `data_movimentacao` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `observacoes` TEXT,
  FOREIGN KEY (`fk_material`) REFERENCES `materiais`(`id_material`),
  FOREIGN KEY (`fk_usuario`) REFERENCES `usuarios`(`id_usuario`)
) ENGINE=InnoDB;

-- Tabela para gerenciar os laboratórios
CREATE TABLE `laboratorios` (
  `id_laboratorio` INT AUTO_INCREMENT PRIMARY KEY,
  `nome_laboratorio` VARCHAR(100) NOT NULL UNIQUE,
  `localizacao_sala` VARCHAR(100),
  `descricao` TEXT
) ENGINE=InnoDB;

-- Tabela de agendamentos
CREATE TABLE `agendamentos` (
  `id_agendamento` INT AUTO_INCREMENT PRIMARY KEY,
  `fk_usuario` INT NOT NULL,
  `fk_laboratorio` INT NOT NULL,
  `fk_material` INT,
  `fk_kit` INT,
  `data_hora_inicio` DATETIME NOT NULL,
  `data_hora_fim` DATETIME NOT NULL,
  `status_agendamento` ENUM('confirmado', 'pendente', 'cancelado', 'concluido') NOT NULL DEFAULT 'pendente',
  `observacoes` TEXT,
  FOREIGN KEY (`fk_usuario`) REFERENCES `usuarios`(`id_usuario`),
  FOREIGN KEY (`fk_laboratorio`) REFERENCES `laboratorios`(`id_laboratorio`),
  FOREIGN KEY (`fk_material`) REFERENCES `materiais`(`id_material`),
  FOREIGN KEY (`fk_kit`) REFERENCES `kits`(`id_kit`),
  CONSTRAINT `chk_datas` CHECK (`data_hora_fim` > `data_hora_inicio`)
) ENGINE=InnoDB;


-- ====================================================================================
-- ETAPA 2: INSERÇÃO DE DADOS NAS TABELAS (POPULAÇÃO)
-- ====================================================================================

-- A TABELA DE USUÁRIOS NÃO SERÁ MAIS POPULADA AQUI

-- Populando a tabela de MATERIAIS com base nos seus arquivos
INSERT INTO `materiais` (`nome`, `tipo_material`, `quantidade`, `unidade`, `localizacao`, `status`) VALUES
('Balança Analitica', 'equipamento', 2, 'unidades', 'Lab. 1 - Bancada', 'disponivel'),
('Balança Semi analitica', 'equipamento', 1, 'unidades', 'Lab. 1 - Bancada', 'disponivel'),
('pHmetro', 'equipamento', 4, 'unidades', 'Lab. 1 - Bancada', 'disponivel'),
('Mufla', 'equipamento', 1, 'unidades', 'Lab. 2 - Bancada', 'disponivel'),
('Estufa', 'equipamento', 2, 'unidades', 'Lab. 1 e 2 - Bancada', 'disponivel'),
('Capela', 'equipamento', 2, 'unidades', 'Lab. 1 e 2 - Bancada', 'disponivel'),
('Dessecador', 'equipamento', 4, 'unidades', 'Lab. 2 - Bancada', 'disponivel'),
('Deionizador', 'equipamento', 1, 'unidades', 'Lab. 1 - Bancada', 'disponivel'),
('Condutivímetro', 'equipamento', 2, 'unidades', 'Lab. 3 - Bancada', 'disponivel'),
('Prensa', 'equipamento', 1, 'unidades', 'Lab. 2', 'disponivel'),
('Liquidificador Industrial', 'equipamento', 1, 'unidades', 'Lab. 2', 'disponivel'),
('Destilador de Nitrogênio', 'equipamento', 1, 'unidades', 'Lab. 1 - Bancada', 'disponivel'),
('Espectrofotômetro', 'equipamento', 2, 'unidades', 'Lab. 3 - Bancada', 'disponivel'),
('Fotômetro de Chamas', 'equipamento', 1, 'unidades', 'Lab. 3 - Bancada', 'disponivel'),
('HPLC', 'equipamento', 1, 'unidades', 'Lab. 3 - Bancada', 'disponivel'),
('Refratômetro', 'equipamento', 3, 'unidades', 'Lab. 3 - Bancada', 'disponivel'),
('Viscosimetro Brookfield', 'equipamento', 1, 'unidades', 'Lab. 2 - Bancada', 'disponivel'),
('Forno', 'equipamento', 1, 'unidades', 'Lab. 2 - Bancada', 'disponivel'),
('Estufa Thermosolda', 'equipamento', 1, 'unidades', 'Lab. 2 - Bancada', 'disponivel'),
('Agitador Mecânico', 'equipamento', 3, 'unidades', 'Lab. 2 - Bancada', 'disponivel'),
('Bateria para Extração Soxhlet', 'equipamento', 1, 'unidades', 'Lab. 2 - Bancada', 'disponivel'),
('Ponto de Fusão', 'equipamento', 1, 'unidades', 'Lab. 1 - Bancada', 'disponivel'),
('Banho de Ultrassom', 'equipamento', 1, 'unidades', 'Lab. 3 - Bancada', 'disponivel'),
('Banho Maria', 'equipamento', 2, 'unidades', 'Lab. 3 - Bancada', 'quebrado'),
('Manta Aquecedora 250mL', 'equipamento', 1, 'unidades', 'Armário 7', 'disponivel'),
('Manta Aquecedora 500mL', 'equipamento', 6, 'unidades', 'Armário 7', 'disponivel'),
('Manta Aquecedora 1000mL', 'equipamento', 1, 'unidades', 'Armário 7', 'disponivel');

-- Fonte: Vidrarias lab.xlsx - Estoque.csv
INSERT INTO `materiais` (`nome`, `descricao`, `tipo_material`, `quantidade`, `unidade`, `localizacao`, `status`) VALUES
('Béquer de vidro', '250mL', 'vidraria', 44, 'unidades', 'Estoque', 'disponivel'),
('Béquer de vidro', '100mL', 'vidraria', 36, 'unidades', 'Estoque', 'disponivel'),
('Balão volumétrico', '100mL', 'vidraria', 12, 'unidades', 'Estoque', 'disponivel'),
('Balão volumétrico', '250mL', 'vidraria', 15, 'unidades', 'Estoque', 'disponivel'),
('Pipeta volumétrica', '10mL', 'vidraria', 25, 'unidades', 'Estoque', 'disponivel'),
('Pipeta volumétrica', '25mL', 'vidraria', 7, 'unidades', 'Estoque', 'disponivel'),
('Proveta graduada de vidro', '100mL', 'vidraria', 8, 'unidades', 'Estoque', 'disponivel'),
('Bureta', '25 mL', 'vidraria', 0, 'unidades', 'Estoque', 'disponivel'),
('Pipetador Pump', '25 mL', 'consumivel', 0, 'unidades', 'Estoque', 'disponivel'),
('Termômetro', 'Digital', 'equipamento', 4, 'unidades', 'Em uso', 'disponivel'),
('Termômetro', 'Mercúrio', 'equipamento', 1, 'unidades', 'Em uso', 'disponivel'),
('Papel de Filtro', 'Azul 12,5 cm', 'consumivel', 100, 'folhas', 'Estoque', 'disponivel'),
('Papel de Filtro', 'Preto', 'consumivel', 0, 'caixas', 'Estoque', 'disponivel');

-- Fonte: Reagentes.xlsx - Reagentes.csv
INSERT INTO `materiais` (`nome`, `tipo_material`, `quantidade`, `unidade`, `localizacao`) VALUES
('Acetona', 'reagente', 650, 'mL', 'A6 - Álcoois e Cetonas'),
('Ácido Acético Glacial', 'reagente', 400, 'mL', 'A20 - Ácidos'),
('Ácido Clorídrico', 'reagente', 1000, 'mL', 'A20 - Ácidos'),
('Hidróxido de Sódio', 'reagente', 1000, 'g', 'A19 - Bases'),
('Sulfato de Cobre II', 'reagente', 100, 'g', 'XXVI - Sais de Cobre'),
('Cloreto de Sódio', 'reagente', 1000, 'g', 'XXVII - Sais de Sódio');

-- Criando um Kit de Titulação como exemplo
INSERT INTO `kits` (`id_kit`, `nome_kit`, `descricao_kit`) VALUES
(1, 'Kit de Titulação Padrão', 'Contém os materiais básicos para realizar uma titulação ácido-base.');

-- Associando os materiais ao Kit de Titulação
INSERT INTO `kit_materiais` (`fk_kit`, `fk_material`, `quantidade_no_kit`) VALUES
(1, 35, 1), -- 1x Bureta 25 mL
(1, 28, 2), -- 2x Béquer de vidro 250mL
(1, 32, 1); -- 1x Pipeta volumétrica 10mL

-- Populando a nova tabela de laboratórios
INSERT INTO `laboratorios` (`nome_laboratorio`, `localizacao_sala`) VALUES
('Laboratório 1', 'Bloco A - Sala 101'),
('Laboratório 2', 'Bloco A - Sala 102'),
('Laboratório 3', 'Bloco B - Sala 205');

-- Populando os usuários default
INSERT INTO `usuarios` (`nome`, `email`, `senha_hash`, `tipo_usuario`) values
('coordenador','adm@etec.org.br','adm123','admin'),
('professor','prof@etec.org.br','prof123','professor'),
('tecnico','tec@etec.org.br','tec123','tecnico');
