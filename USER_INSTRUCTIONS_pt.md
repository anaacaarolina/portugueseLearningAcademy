# Instruções do Utilizador - Portuguese Learning Academy

Este guia explica como usar a aplicação através da prespetiva do proprietário/administrador. Cobre o painel do administrador e do estudante, e algumas páginas principais como os cursos, inscrições e pagamentos.

## Índice

- [Instruções do Utilizador - Portuguese Learning Academy](#instruções-do-utilizador---portuguese-learning-academy)
  - [Índice](#índice)
  - [Público alvo](#público-alvo)
  - [Acesso e Perfis](#acesso-e-perfis)
  - [Navegção Rápida](#navegção-rápida)
  - [Painel de Administração](#painel-de-administração)
    - [1. Resumo de KPI](#1-resumo-de-kpi)
    - [2. Calendário de Aulas Agendadas](#2-calendário-de-aulas-agendadas)
    - [3. Gestão de Professores](#3-gestão-de-professores)
    - [4. Gestão de Alunos](#4-gestão-de-alunos)
    - [5. Detalhes do Aluno (Apenas Admin)](#5-detalhes-do-aluno-apenas-admin)
    - [6. Gerir Conteudos](#6-gerir-conteudos)
      - [Orientações para cursos (importante)](#orientações-para-cursos-importante)
      - [Orientações para curiosidades](#orientações-para-curiosidades)
      - [Orientações para Comentarios (testemunhos)](#orientações-para-comentarios-testemunhos)
    - [7. Enviar Email (Admin)](#7-enviar-email-admin)
  - [Painel do Aluno](#painel-do-aluno)
    - [1. Aulas e Calendário](#1-aulas-e-calendário)
    - [2. Agendar Aula (Apenas Cursos Individuais)](#2-agendar-aula-apenas-cursos-individuais)
    - [3. Painel de Estatísticas](#3-painel-de-estatísticas)
  - [Site Público (Voltado para Alunos)](#site-público-voltado-para-alunos)
    - [Homepage (/)](#homepage-)
    - [Catálogo de Cursos (/courses)](#catálogo-de-cursos-courses)
    - [Detalhe do Curso (/courses/:courseSlug)](#detalhe-do-curso-coursescourseslug)
    - [Inscricao (/enrollment)](#inscricao-enrollment)
    - [Pagamento (/payment)](#pagamento-payment)
    - [Resultados de Pagamento](#resultados-de-pagamento)
    - [Curiosidades](#curiosidades)
  - [Resolução de Problemas Comuns](#resolução-de-problemas-comuns)
  - [Notas de Suporte](#notas-de-suporte)

## Público alvo

- Utilizadores admin (proprietários/gestores da escola) que gerem cursos, professores, alunos, conteúdos e comunicações.
- Utilizadores alunos que consultam horários, marcam aulas (quando elegíveis) e acompanham horas.

## Acesso e Perfis

- Utilizadores admin acedem ao Painel de Administração em /admin-dashboard.
- Utilizadores alunos acedem ao Painel do Aluno em /student-dashboard.
- Alunos sem inscrição ativa são tratados como unrolled_student na UI e vêem opções de agendamento limitadas.

Para iniciar sessão, use /login. Se estiver a configurar localmente, certifique-se de que:

- O frontend esta a correr (predefinição: `http://localhost:5173`)
- O backend esta a correr (predefinição: `http://localhost:8000`)

## Navegção Rápida

- Páginas publicas
  - / (Homepage)
  - /courses (Catálogo de cursos)
  - /courses/:courseSlug (Detalhe do curso)
  - /fun-facts (Curiosidades)
  - /fun-facts/:slug (Detalhe de curiosidade)
  - /enrollment (Escolher curso + pacote)
  - /payment (Checkout)
- Autenticação
  - /login
  - /register
- Admin
  - /admin-dashboard
  - /student-details/:id
- Aluno
  - /student-dashboard

## Painel de Administração

O Painel de Administração e o centro de controlo para alunos, professores, aulas e conteudos.

### 1. Resumo de KPI

No topo verá:

- Alunos Ativos
- Total de Cursos
- Receita Total (EUR)

Estes valores ajudam a monitorizar a saúde geral da escola.

### 2. Calendário de Aulas Agendadas

O calendário resume as aulas agendadas do mês.

**Como utilizar:**

1. Use as setas esquerda/direita para mudar de mês.
2. Clique em qualquer dia para ver as aulas agendadas nessa data.
3. O painel da direita mostra a lista de aulas para o dia selecionado.
4. Dias destacados indicam o numero de aulas agendadas.

---

**Notas:**

- Os horários de cursos de grupo sao incluidos automaticamente com base nos horarios semanais e excecoes.
- As marcações individuais aparecem assim que são agendadas.

### 3. Gestão de Professores

A secção de Professores permite:

- Criar professores
- Definir e ver disponibilidade
- Eliminar professores

---

**Criar um professor:**

1. Clique em `Create Teacher`.
2. Preencha nome, email, biografia (opcional) e URL da foto (opcional).
3. Clique em `Create Teacher` para guardar.

---

**Definir disponibilidade:**

1. Clique em `Set Availability` para um professor.
2. Adicione data, hora de início, hora de fim e estado de disponibilidade.
3. Use `Add Slot` para criar uma lista.
4. Clique em `Save Availability` para confirmar.

---

**Ver detalhes de disponibilidade:**

1. Clique em `View Details`.
2. Use o calendário para inspecionar slots disponíveis/indisponíveis por data.

---

**Eliminar um professor:**

- Use `Delete` apenas quando necessário. O sistema pode bloquear a eliminacao se houver aulas marcadas.

### 4. Gestão de Alunos

A tabela de Alunos lista todos os alunos com:

- Nome, email, telefone, curso, data de inscrição, estado

**Ações principais:**

- `View Details`: Abre o ecrã completo de gestão do aluno.
- `Schedule Class`: Aparece apenas para alunos num curso individual com professor atribuido.

---

**Criar um aluno:**

1. Clique em `Create Student`.
2. Preencha nome, email, telefone, curso (opcional) e estado.
3. Clique em `Create Student` para guardar.
4. Uma palavra-passe temporaria e mostrada num popup. Partilhe-a com o aluno.

### 5. Detalhes do Aluno (Apenas Admin)

Esta página é a área mais detalhada de gestão do aluno.

**Secção de perfil:**

- Clique em `Edit profile` para atualizar nome, email ou telefone.
- Clique em `Apply Changes` para guardar as atualizações.

---

**Gestão de inscricao e pacotes de horas:**

- Clique em `Edit Enrollment` para alterar:
  - Curso atribuido
  - Pacote de horas
  - Adicionar horas
  - Agendar uma aula (escolher professor e slot disponível)

---

**Registo de presencas:**

- Cada marcação inclui um menu de estado:
  - Agendada
  - Frequentada
  - Falta
  - Cancelada
- Clique em ``Save attendace`` depois de alterar o estado.

---

**Notas:**

- Escreva notas internas sobre o aluno.
- Use `Clear Notes` para remover texto.
- Clique em ``Apply changes`` para guardar as atualizações.

---

**Importante:**

- O botão ``Apply changes`` confirma todas as edições pendentes de uma vez.

### 6. Gerir Conteudos

Esta secao controla os conteúdos visíveis no site público.

**Tipos de conteúdo:**

- Cursos
- Curiosidades
- Tags de Curiosidades
- Pacotes de Horas
- Comentarios (Testemunhos)

---

**Criar conteúdo:**

1. Clique em ``Create`` para o tipo de conteúdo pretendido.
2. Preencha o formulário.
3. Clique em ``Create`` para guardar.

**Editar conteúdo:**

1. Clique em ``Edit`` para o tipo de conteúdo pretendido.
2. Selecione um item da lista.
3. Clique em ``Confirm``.
4. Faca as alterações e clique em ``Save``.

---

**Eliminar conteudo:**

- Use Eliminar no popup de edição para remover itens.

---

#### Orientações para cursos (importante)

- Cursos de grupo exigem horários semanais e podem incluir exceções pontuais.
- Cursos individuais não usam horarios semanais.
- Para cursos de grupo, preencha:
  - Dia da semana, hora de inicio/fim
  - Datas de vigeêcia
  - Alterações pontuais para sessões remarcadas ou cancelada

#### Orientações para curiosidades

- Apenas curiosidades publicadas aparecem na pagina pública de Fun Facts.
- As tags devem existir antes de as atribuir a uma curiosidade.
- O slug e usado no URL. Mantenha-o único.

#### Orientações para Comentarios (testemunhos)

- Apenas comentários Publicados aparecem na homepage.

### 7. Enviar Email (Admin)

Use ``Send Email`` para contactar alunos ou professores.

**Passos:**

1. Clique em ``Send Email``.
2. Escolha um template (opcional).
3. Selecione destinatários da lista da plataforma.
4. Adicione quaisquer emails manuais (separados por vírgula ou nova linha).
5. Introduza o assunto e a mensagem.
6. Clique em ``Send``.

## Painel do Aluno

O Painel do Aluno ajuda os alunos a acompanhar as suas aulas e a marcar sessõees quando elegiveis.

### 1. Aulas e Calendário

Os alunos podem ver as próximas sessões de duas formas:

- Vista de Calendário: Clique em qualquer dia para ver aulas.
- Vista de Lista: Lista completa de itens agendados.

Se o aluno não tiver inscrição ativa, o painel mostra um aviso e ações limitadas.

### 2. Agendar Aula (Apenas Cursos Individuais)

O botão ``Schedule Class`` aparece apenas quando:

- O aluno esta inscrito num curso individual, E
- O curso tem um professor atribuido, E
- O professor tem slots de disponibilidade.

**Para agendar:**

1. Clique em ``Schedule Class``.
2. Selecione uma data com horários disponíveis.
3. Escolha uma hora.
4. Clique em ``Confirm``.

### 3. Painel de Estatísticas

Os alunos podem ver:

- Curso atual
- Horas concluídas vs total
- Percentagem de presenças
- Próxima aula

## Site Público (Voltado para Alunos)

### Homepage (/)

- Destaca cursos e testemunhos publicados.
- Os testemunhos vêm de Comentários com estado Publicado.

### Catálogo de Cursos (/courses)

- Filtrar por tipo de curso e localização.
- Clique num curso para ver detalhes.

### Detalhe do Curso (/courses/:courseSlug)

- Mostra nível, horário, tamanho da turma e resumo do curso.
- ``Enroll Now`` abre o fluxo de inscricao com o curso preselecionado.

### Inscricao (/enrollment)

- Selecionar um curso e um pacote de horas.
- Clique em ``Buy Now`` para seguir para o checkout.

### Pagamento (/payment)

- Mostra um resumo do curso e pacote escolhidos.
- Clicar em ``Complete Purchase`` redireciona para o checkout do *Stripe*.
- Se o utilizador tiver sessão iniciada, o sistema associa a compra a conta.

### Resultados de Pagamento

- /payment-success redireciona os alunos para o painel deles.
- /payment-cancelled volta a inscrição.

### Curiosidades

- /fun-facts lista todas as curiosidades Publicadas.
- /fun-facts/:slug mostra o artigo completo.

## Resolução de Problemas Comuns

- "No courses" ou catálogo vazio: criar cursos em Gerir Conteudos.
- "No available slots": definir disponibilidade de professores na secção Professores.
- "Schedule Class" não visível: o curso deve ser individual e ter professor atribuido.
- Curiosidades não visíveis: garantir que a curiosidade está Publicada e tem uma tag.
- Testemunhos em falta: definir comentário como Publicado.

## Notas de Suporte

Se algo parecer errado (dados em falta, erros ou comportamento inesperado), as correções mais comuns são:

- Verificar se a API backend esta a correr.
- Confirmar que o conteudo relevante foi criado e marcado como ativo/publicado.
- Verificar se o aluno tem uma inscrição ativa e um pacote de horas válido.
