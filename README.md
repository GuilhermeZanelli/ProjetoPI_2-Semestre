# 🧪 Sistema de Gerenciamento de Laboratórios de Química - ETEC

Este projeto é um sistema web desenvolvido para otimizar o agendamento de aulas, a gestão de estoques e a preparação de kits de materiais nos laboratórios de química da ETEC. O sistema facilita a comunicação entre **Professores**, **Técnicos de Laboratório** e **Administradores**.

## 📋 Sobre o Projeto

O objetivo principal é substituir processos manuais ou em papel por uma solução digital que garante:
* Controle automático de estoque (baixa automática ao confirmar aulas).
* Histórico confiável de uso dos laboratórios.
* Facilidade para professores solicitarem materiais e kits.
* Ferramentas de acessibilidade integradas.

## 🚀 Funcionalidades Principais

### 👨‍🏫 Módulo do Professor
* **Dashboard Interativo:** Visualização rápida de próximas aulas e cards de ação rápida
* **Agendamento de Aulas:** Solicitação de laboratórios com data, horário e materiais necessários.
* **Gestão de Kits:** Criação e edição de "Kits de Materiais" personalizados para reutilização em aulas futuras.
* **Histórico:** Acompanhamento de todas as aulas realizadas ou canceladas, facilitando a recriação de aulas passadas.

### 👨‍🔬 Módulo do Técnico
* **Gestão de Solicitações:** Aprovar ou rejeitar agendamentos pendentes.
* **Controle de Estoque:** Visualização, adição e exclusão de itens. O sistema calcula automaticamente a disponibilidade baseada nos agendamentos.
* **Histórico:** Acompanhamento de todas as revisões anteriores.

### 👮 Módulo do Administrador
* **Dashboard Estatístico:** Métricas sobre laboratórios mais usados, horários de pico e professor mais ativo.
* **Gestão de Usuários:** Cadastro e remoção de professores, técnicos e administradores.
* **Visão Geral:** Acesso completo ao histórico e estoque.

### ♿ Acessibilidade
O sistema foi projetado pensando na inclusão:
* **VLibras:** Widget de tradução para Libras integrado.
* **Modo Escuro (Dark Mode):** Para conforto visual.
* **Ajuste de Fonte:** Controle de tamanho de texto.
* **Filtros de Daltonismo:** Modos para Protanopia, Deuteranopia e Tritanopia.

## ⚙️ Como Rodar o Projeto

* clone o repositório e utilize o comando npm init ou install
