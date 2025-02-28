# Action Bronks Ação Bot 

Um bot do Discord para gerenciar ações, solicitações de participação e aprovações.

## Funcionalidades

- Criar novas ações com nome, data, rádio e vagas
- Gerenciar solicitações de participação
- Aprovar, recusar ou colocar usuários como reserva
- Encerrar ações quando finalizadas

## Configuração

1. Clone este repositório
2. Execute `npm install` para instalar as dependências
3. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
TOKEN=seu_token_do_bot_discord
MONGODB_URI=sua_uri_de_conexao_mongodb
CLIENT_ID=id_do_aplicativo_do_bot
```

4. Configure o arquivo `config.json` com os IDs dos cargos de administração e canais:

```json
{
  "adminRoleIds": ["ID_DO_CARGO_ADMIN_1", "ID_DO_CARGO_ADMIN_2"],
  "actionCategory": "ID_DA_CATEGORIA_PARA_TOPICOS",
  "mainActionChannel": "ID_DO_CANAL_PRINCIPAL_PARA_ACOES"
}
```

5. Execute `npm run deploy` para registrar os comandos slash
6. Inicie o bot com `npm start`

## Comandos

- `/iniciaracao` - Inicia uma nova ação através de um modal

## Fluxo de Trabalho

1. Um administrador usa o comando `/iniciaracao` para criar uma nova ação
2. Os usuários podem clicar no botão "Participar da ação" para solicitar participação
3. Administradores podem aprovar, recusar ou colocar solicitações como reserva
4. Quando a ação terminar, um administrador pode clicar em "Encerrar Ação"

## Estrutura do Banco de Dados

```javascript
{
  "acao_id": "id_unico_da_acao",
  "nome": "Nome da Ação",
  "data": "Data da Ação",
  "radio": "Rádio da Ação",
  "vagas": {
    "total": 10,
    "reservas": 5
  },
  "participantes": {
    "aprovados": ["user_id1", "user_id2"],
    "reservas": ["user_id3"]
  },
  "solicitacoes": [
    {
      "user_id": "user_id4",
      "status": "pendente"
    }
  ],
  "status": "ativa",
  "embed_message_id": "id_da_mensagem_embed",
  "topic_channel_id": "id_do_canal_topico",
  "guild_id": "id_do_servidor"
}
```
