# ðŸš€ Guia de InstalaÃ§Ã£o e ConfiguraÃ§Ã£o do atlas

Este documento serve como um passo a passo completo para configurar o ambiente de desenvolvimento e executar o projeto **atlas** em uma nova mÃ¡quina do zero.

---

## ðŸ“‹ 1. Programas NecessÃ¡rios para InstalaÃ§Ã£o

VocÃª precisarÃ¡ instalar as seguintes ferramentas na nova mÃ¡quina:

### 1.1. ObrigatÃ³rios (Core)
1. **Node.js (VersÃ£o LTS)**
   * **O que Ã©:** O ambiente de execuÃ§Ã£o JavaScript no qual o Backend (NestJS) e o Frontend (Angular) sÃ£o executados.
   * **VersÃ£o Recomendada:** **v20.x** ou **v22.x** (LTS).
   * **Como baixar:** Acesse [nodejs.org](https://nodejs.org/) e faÃ§a o download do instalador para o seu sistema operacional (recomenda-se a versÃ£o LTS). O instalador jÃ¡ inclui o `npm` (gerenciador de pacotes).

2. **Git**
   * **O que Ã©:** O sistema de controle de versÃ£o usado para baixar (clonar) e gerenciar o cÃ³digo do projeto.
   * **Como baixar:** Acesse [git-scm.com](https://git-scm.com/) e faÃ§a o download para Windows/Linux/macOS.

### 1.2. Editores e Ferramentas de Desenvolvimento (Recomendado)
3. **Visual Studio Code (VS Code)**
   * **O que Ã©:** O editor de cÃ³digo recomendado.
   * **Como baixar:** Acesse [code.visualstudio.com](https://code.visualstudio.com/).
   * **ExtensÃµes sugeridas no VS Code:**
     * *Angular Language Service* (para suporte a templates Angular)
     * *Prisma* (para realce de sintaxe do schema de banco de dados)
     * *Prettier - Code formatter* (para formataÃ§Ã£o de cÃ³digo)

### 1.3. Opcional (Banco de Dados Local)
4. **Docker Desktop**
   * **O que Ã©:** Permite rodar o banco de dados PostgreSQL localmente de maneira isolada e rÃ¡pida, sem precisar instalar o PostgreSQL diretamente na mÃ¡quina.
   * **Como baixar:** Acesse [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/).
   * *(Nota: Se vocÃª optar por usar o banco de dados na nuvem via NeonDB, a instalaÃ§Ã£o do Docker Ã© opcional).*

---

## ðŸšš 2. Como Baixar o Projeto na Nova MÃ¡quina

Siga estas instruÃ§Ãµes passo a passo para baixar e rodar o projeto:

### Passo 1: Clonar o RepositÃ³rio
Abra o seu terminal (PowerShell, CMD ou terminal do VS Code) na pasta onde deseja salvar o projeto e execute o comando:

```bash
git clone https://github.com/PabloRacl/atlas.git
```

Depois de clonar, entre na pasta do projeto:

```bash
cd atlas
```

O projeto Ã© dividido em duas partes principais: **atlas-backend** e **atlas-frontend**. Vamos configurar cada uma delas.

---

## âš™ï¸ 3. Configurando o Backend (`atlas-backend`)

### Passo 3.1: Entrar na pasta e instalar as dependÃªncias
No terminal, execute:

```bash
cd atlas-backend
npm install
```

### Passo 3.2: Configurar as VariÃ¡veis de Ambiente (`.env`)
VocÃª precisa criar um arquivo chamado `.env` na raiz da pasta `atlas-backend`. 

Crie o arquivo `.env` e adicione as seguintes configuraÃ§Ãµes:

```env
# URL de conexÃ£o com o banco de dados PostgreSQL (Exemplo com NeonDB Cloud)
DATABASE_URL="postgresql://neondb_owner:npg_5ChjNKHrTD0i@ep-twilight-poetry-acz3eind-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Segredo usado para assinar os tokens JWT (Use uma chave segura)
JWT_SECRET="atlas_pmpe_2026_chave_secreta_troque_em_producao"

# Porta em que o backend vai rodar localmente
PORT=3001

# EndereÃ§o do frontend para permitir requisiÃ§Ãµes CORS
FRONTEND_URL="http://localhost:4200"
```

> [!TIP]
> **Como rodar o Banco de Dados Localmente (Alternativa com Docker):**
> Se preferir nÃ£o usar o banco na nuvem e rodar um PostgreSQL localmente:
> 1. Certifique-se de que o **Docker Desktop** estÃ¡ aberto.
> 2. Na pasta `atlas-backend`, execute o comando:
>    ```bash
>    docker-compose up -d
>    ```
> 3. Altere a linha `DATABASE_URL` no seu arquivo `.env` para:
>    ```env
>    DATABASE_URL="postgresql://atlas_user:atlas_password@localhost:5433/atlas_db?schema=public"
>    ```

### Passo 3.3: Preparar o Banco de Dados (Prisma)
Com o arquivo `.env` devidamente configurado e o banco de dados acessÃ­vel, execute os comandos do Prisma para gerar o cliente e aplicar as migraÃ§Ãµes/popular o banco:

```bash
# 1. Gerar os tipos do cliente Prisma
npx prisma generate

# 2. Executar as migraÃ§Ãµes (cria as tabelas no banco de dados)
npx prisma migrate dev

# 3. (Opcional) Popular o banco com dados iniciais (Seed)
npx prisma db seed
```

### Passo 3.4: Iniciar o Backend
Para rodar o servidor backend em modo de desenvolvimento (com recarregamento automÃ¡tico a cada alteraÃ§Ã£o):

```bash
npm run start:dev
```
O backend estarÃ¡ ativo em: **`http://localhost:3001`**

---

## ðŸ’» 4. Configurando o Frontend (`atlas-frontend`)

Abra um **novo terminal** (deixando o backend rodando no terminal anterior), acesse a pasta do frontend e configure-o.

### Passo 4.1: Entrar na pasta e instalar as dependÃªncias
```bash
cd atlas-frontend
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
*(Ou use o comando `ng serve` se vocÃª instalou o Angular CLI globalmente).*

O frontend estarÃ¡ ativo e acessÃ­vel em seu navegador no endereÃ§o:
ðŸ‘‰ **`http://localhost:4200`**

---

## ðŸ› ï¸ Resumo de Comandos RÃ¡pidos (Dia a Dia)

Depois que tudo estiver instalado e configurado, para trabalhar no projeto diariamente, vocÃª sÃ³ precisa fazer:

1. **Abrir o Backend (`atlas-backend`):**
   ```bash
   npm run start:dev
   ```
2. **Abrir o Frontend (`atlas-frontend`):**
   ```bash
   npm run start
   ```
3. Acessar `http://localhost:4200` no navegador.



