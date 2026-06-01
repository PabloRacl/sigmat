# 🚀 Deploy - Visão Geral

O SIGMAT V2 utiliza uma arquitetura de microserviços distribuídos para garantir alta disponibilidade e custo zero (planos gratuitos).

## 🌍 Arquitetura em Nuvem

| Componente | Plataforma | Função | Link |
| :--- | :--- | :--- | :--- |
| **Frontend** | [[Hospedagem - Vercel|Vercel]] | Interface Angular (UI) | [sigmat.vercel.app](https://sigmat.vercel.app) |
| **Backend** | [[Hospedagem - Render|Render]] | API NestJS (Lógica) | [sigmat.onrender.com](https://sigmat.onrender.com) |
| **Banco de Dados** | [[Banco de Dados - Neon|Neon]] | PostgreSQL (Dados) | [neon.tech](https://neon.tech) |

## 🔗 Como eles se conectam?
1. O **Frontend** na Vercel envia requisições para o **Backend** no Render.
2. O **Backend** processa a lógica e consulta/salva dados no **Neon**.
3. O **Neon** armazena os 12.000+ equipamentos e retorna as informações.

## 🛠️ Ciclo de Atualização (CI/CD)
Toda vez que um `git push` é feito para o [[Repositório GitHub]], tanto a Vercel quanto o Render detectam a mudança e atualizam o sistema automaticamente.

---
#links: [[SIGMAT V2 - Mapa de Conteúdo]], [[Variáveis de Ambiente]]



