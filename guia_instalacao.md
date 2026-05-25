# 🚀 Guia de Instalação e Configuração do SIGMAT

Este documento serve como um passo a passo completo para configurar o ambiente de desenvolvimento e executar o projeto **SIGMAT** em uma nova máquina do zero.

---

## 📋 1. Programas Necessários para Instalação

Você precisará instalar as seguintes ferramentas na nova máquina:

### 1.1. Obrigatórios (Core)
1. **Node.js (Versão LTS)**
   * **O que é:** O ambiente de execução JavaScript no qual o Backend (NestJS) e o Frontend (Angular) são executados.
   * **Versão Recomendada:** **v20.x** ou **v22.x** (LTS).
   * **Como baixar:** Acesse [nodejs.org](https://nodejs.org/) e faça o download do instalador para o seu sistema operacional (recomenda-se a versão LTS). O instalador já inclui o `npm` (gerenciador de pacotes).

2. **Git**
   * **O que é:** O sistema de controle de versão usado para baixar (clonar) e gerenciar o código do projeto.
   * **Como baixar:** Acesse [git-scm.com](https://git-scm.com/) e faça o download para Windows/Linux/macOS.

### 1.2. Editores e Ferramentas de Desenvolvimento (Recomendado)
3. **Visual Studio Code (VS Code)**
   * **O que é:** O editor de código recomendado.
   * **Como baixar:** Acesse [code.visualstudio.com](https://code.visualstudio.com/).
   * **Extensões sugeridas no VS Code:**
     * *Angular Language Service* (para suporte a templates Angular)
     * *Prisma* (para realce de sintaxe do schema de banco de dados)
     * *Prettier - Code formatter* (para formatação de código)

### 1.3. Opcional (Banco de Dados Local)
4. **Docker Desktop**
   * **O que é:** Permite rodar o banco de dados PostgreSQL localmente de maneira isolada e rápida, sem precisar instalar o PostgreSQL diretamente na máquina.
   * **Como baixar:** Acesse [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/).
   * *(Nota: Se você optar por usar o banco de dados na nuvem via NeonDB, a instalação do Docker é opcional).*

---

## 🚚 2. Como Baixar o Projeto na Nova Máquina

Siga estas instruções passo a passo para baixar e rodar o projeto:

### Passo 1: Clonar o Repositório
Abra o seu terminal (PowerShell, CMD ou terminal do VS Code) na pasta onde deseja salvar o projeto e execute o comando:

```bash
git clone https://github.com/PabloRacl/sigmat.git
```

Depois de clonar, entre na pasta do projeto:

```bash
cd sigmat
```

O projeto é dividido em duas partes principais: **sigmat-backend** e **sigmat-frontend**. Vamos configurar cada uma delas.

---

## ⚙️ 3. Configurando o Backend (`sigmat-backend`)

### Passo 3.1: Entrar na pasta e instalar as dependências
No terminal, execute:

```bash
cd sigmat-backend
npm install
```

### Passo 3.2: Configurar as Variáveis de Ambiente (`.env`)
Você precisa criar um arquivo chamado `.env` na raiz da pasta `sigmat-backend`. 

Crie o arquivo `.env` e adicione as seguintes configurações:

```env
# URL de conexão com o banco de dados PostgreSQL (Exemplo com NeonDB Cloud)
DATABASE_URL="postgresql://neondb_owner:npg_5ChjNKHrTD0i@ep-twilight-poetry-acz3eind-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Segredo usado para assinar os tokens JWT (Use uma chave segura)
JWT_SECRET="sigmat_pmpe_2026_chave_secreta_troque_em_producao"

# Porta em que o backend vai rodar localmente
PORT=3001

# Endereço do frontend para permitir requisições CORS
FRONTEND_URL="http://localhost:4200"
```

> [!TIP]
> **Como rodar o Banco de Dados Localmente (Alternativa com Docker):**
> Se preferir não usar o banco na nuvem e rodar um PostgreSQL localmente:
> 1. Certifique-se de que o **Docker Desktop** está aberto.
> 2. Na pasta `sigmat-backend`, execute o comando:
>    ```bash
>    docker-compose up -d
>    ```
> 3. Altere a linha `DATABASE_URL` no seu arquivo `.env` para:
>    ```env
>    DATABASE_URL="postgresql://sigmat_user:sigmat_password@localhost:5433/sigmat_db?schema=public"
>    ```

### Passo 3.3: Preparar o Banco de Dados (Prisma)
Com o arquivo `.env` devidamente configurado e o banco de dados acessível, execute os comandos do Prisma para gerar o cliente e aplicar as migrações/popular o banco:

```bash
# 1. Gerar os tipos do cliente Prisma
npx prisma generate

# 2. Executar as migrações (cria as tabelas no banco de dados)
npx prisma migrate dev

# 3. (Opcional) Popular o banco com dados iniciais (Seed)
npx prisma db seed
```

### Passo 3.4: Iniciar o Backend
Para rodar o servidor backend em modo de desenvolvimento (com recarregamento automático a cada alteração):

```bash
npm run start:dev
```
O backend estará ativo em: **`http://localhost:3001`**

---

## 💻 4. Configurando o Frontend (`sigmat-frontend`)

Abra um **novo terminal** (deixando o backend rodando no terminal anterior), acesse a pasta do frontend e configure-o.

### Passo 4.1: Entrar na pasta e instalar as dependências
```bash
cd sigmat-frontend
npm install
```

### Passo 4.2: Instalar o Angular CLI Globalmente (Opcional, mas recomendado)
Para rodar os comandos do Angular nativamente no terminal:
```bash
npm install -g @angular/cli@18
```

### Passo 4.3: Iniciar o Frontend
Para rodar o servidor do frontend em modo de desenvolvimento:

```bash
npm run start
```
*(Ou use o comando `ng serve` se você instalou o Angular CLI globalmente).*

O frontend estará ativo e acessível em seu navegador no endereço:
👉 **`http://localhost:4200`**

---

## 🛠️ Resumo de Comandos Rápidos (Dia a Dia)

Depois que tudo estiver instalado e configurado, para trabalhar no projeto diariamente, você só precisa fazer:

1. **Abrir o Backend (`sigmat-backend`):**
   ```bash
   npm run start:dev
   ```
2. **Abrir o Frontend (`sigmat-frontend`):**
   ```bash
   npm run start
   ```
3. Acessar `http://localhost:4200` no navegador.
