# VetRP Web

Sistema web para clínica veterinária (MVP acadêmico). O tutor cadastra seus animais e agenda consultas e exames; a equipe da clínica acompanha a agenda, os pacientes e libera os horários de atendimento.

## Estrutura

```
vetrp-web/
├── README.md
├── backend/     API em Java (Spring Boot) + banco MySQL com Flyway
│   ├── pom.xml
│   └── src/main/
│       ├── java/br/com/vetrp/vetrp_web/   config, controller, model, repository
│       └── resources/                     application.properties e db/migration (V1, V2, V3)
└── frontend/    Interface em React (Vite)
    ├── package.json
    ├── .env.example
    ├── public/  privacidade.html e vídeo da página inicial
    └── src/     App.jsx, style.css e assets
```

## Requisitos

- JDK 21 (ou superior)
- MySQL 8
- Node.js 20 ou superior

## 1. Banco de dados

Crie o banco vazio (as tabelas são criadas sozinhas pelo Flyway ao iniciar o backend):

```sql
CREATE DATABASE vetrp CHARACTER SET utf8mb4;
```

## 2. Backend

Variáveis de ambiente (no IntelliJ: **Edit Configurations > Environment variables**, uma linha por variável; ou no terminal):

| Variável | Para que serve |
|---|---|
| `DB_PASSWORD` | senha do MySQL (obrigatória) |
| `DB_USER` | usuário do MySQL (opcional, padrão `root`) |
| `VETRP_ADMIN_EMAIL` | e-mail do primeiro administrador da clínica |
| `VETRP_ADMIN_PASSWORD` | senha do administrador: mínimo de 10 caracteres, com maiúscula, minúscula, número e símbolo |

O administrador só é criado se as duas últimas variáveis existirem e ainda não houver usuário com esse e-mail. Nenhuma senha fica escrita no código.

Para rodar, abra `backend/` no IntelliJ e execute `VetrpWebApplication`, ou:

```
cd backend
./mvnw spring-boot:run
```

A API sobe em `http://localhost:8080`.

## 3. Frontend

```
cd frontend
copy .env.example .env      (no Linux/Mac: cp .env.example .env)
npm install
npm run dev
```

Abra `http://127.0.0.1:5173`.

## Primeiro uso (passo a passo)

1. Entre em **Área dos profissionais** com o e-mail e a senha do administrador.
2. Em **Funcionários**, cadastre a equipe (recepção e veterinários). Só o administrador vê essa opção.
3. Em **Liberar horários**, crie os horários de atendimento. Sem isso, o tutor não vê nenhum horário disponível.
4. Como tutor, use **Criar conta de tutor**, entre, cadastre o animal e agende consulta ou exame.
5. A equipe acompanha tudo em **Agenda da clínica**, **Pacientes**, **Prontuários** e **Relatórios**.

## Perfis

| Perfil | O que faz |
|---|---|
| `TUTOR` | cadastra animais, agenda e cancela os próprios atendimentos |
| `RECEPCAO` e `VETERINARIO` | agenda, pacientes, horários, prontuários e relatórios |
| `ADMIN` | tudo o que a equipe faz, mais o cadastro de funcionários |

## Política de privacidade

A página fica em `frontend/public/privacidade.html` e é ligada no rodapé da página inicial, no rodapé da área logada e no aceite do cadastro do tutor. Troque o e-mail de contato antes de apresentar.

## Cuidados

- **Não edite** as migrations já aplicadas (`V1`, `V2`, `V3`). Para mudar o banco, crie um arquivo novo (`V4__descricao.sql`). Se o Flyway acusar *checksum mismatch* em um banco de testes, apague e recrie o banco.
- O backend aceita requisições do frontend apenas em `localhost:5173` e `127.0.0.1:5173` (CORS). Para publicar em outro endereço, ajuste em `config/SecurityConfig.java`.
- Os contatos do rodapé da página inicial são ilustrativos.
- Confirme que o vídeo `frontend/public/videos/vetrp-hero.mp4` pode ser usado no projeto. Se não houver autorização, troque por imagem ou vídeo de uso livre.
