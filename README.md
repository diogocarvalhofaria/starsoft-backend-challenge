# Sistema de Venda de Ingressos

API REST projetada para resolver o problema de concorrência na venda de ingressos, garantindo que múltiplos usuários não possam comprar simultaneamente o mesmo assento.

## Tecnologias e Decisões Técnicas

* **MySQL (TypeORM):** Escolhi o MySQL por ser um banco de dados relacional consolidado, tendo como propriedades ACID (Atomicidade, Consistência, Isolamento e Durabilidade), fundamentais em cenários que envolvem:
- Controle de assentos finito;
- Transações;
- Consistência de dados;
- Também pelo fato de ter mais familiaridade com a ferramenta, permitindo desenvolver com mais segurança e produtividade.
* **Redis + BullMQ:** Utilizei o BullMQ com redis para gerenciar o processamento assincrono
- Implementado tempo de expiração da reserva;
- Separar a regra de expiração da requisição HTTP;
- Permitir escalabilidade, podendo rodar o worker em uma instância diferente do serviço principal.
- O Redis foi escolhido por ser leve e utilizado bastante em sistemas distribuidos.

---

## Como Executar

### Pré-requisitos
* Docker e Docker Compose instalados.

### Passos
1.  Na raiz do projeto, execute:
    ```bash
    docker-compose up --build
    ```

### Acessar Documentação
* **Swagger (API):** [http://localhost:8000/api-docs](http://localhost:8000/api-docs)
* **Bull Dashboard (Filas):** [http://localhost:8001/admin/queues](http://localhost:8001/admin/queues)

---

## Roteiro de Teste

Para facilitar a validação, siga este fluxo:

### 1. Popular o Banco
Execute este comando no terminal para criar uma Sessão e gerar 60 assentos (Fileiras A-F) automaticamente:

```bash
curl -X 'POST' \
  'http://localhost:8000/api/v1/sessions' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "movieTitle": "filme-teste-01",
  "startTime": "2026-12-25T20:00:00Z",
  "price": 21.00,
  "roomId": "Sala teste"
}'
```

### 2. Escolhendo um Assento

O EndPoint responsavel seria `POST /api/v1/reservation`
- URL: http://localhost:8000/api/v1/reservation
- Executando esse comando abaixo o status do assento irá para LOCKED

``` bash
curl -X 'POST' \
'http://localhost:8000/api/v1/reservation' \
-H 'Content-Type: application/json' \
-d '{
"userId": "usuario-teste-01",
"seatId": "id-assento"
}'
```
Caso tente realizar uma nova reserva irá receber um 409 Conflict

### 3. Expiração automatica
O Worker é um serviço separado rodando em background
- Com o worker rodando é apenas executar o mesmo EndPoint do passo 2

### 4. Fluxo com pagamento
- Dentro de 30 segundos que executou o passo 3 copie o ID da reserva.

Execute esse comando

```bash
curl -X 'POST' \
  'http://localhost:8000/api/v1/reservation/reservationId/pay' \
  -H 'Content-Type: application/json' \
  -d ''
  ```
 - Caso passe dos 30 segundos irá apresentar uma mensagem de tempo limite excedido

### Estratégia implementada para resolver o problema de concorrência na venda de ingressos:

1. **Como resolvi race conditions:** Utilizei o lock: 'pessimistic_write' do TypeORM dentro de uma transação, assim quando alguem tenta realizar uma reserva o banco bloqueia aquela linha até a transação finalizar. Se outra pessoa tentar reservar esse mesmo assento ela precisa esperar. O metodos de reserva e pagamento ficam dentro de uma transação, se algo falhar nada é salvo no banco. Tambem utilizei o @VersionColumn como uma ajuda para detectar conflitos.
2. **Como garanti a coordenação entre múltiplas instâncias:** Quem está controlando o lock é o banco de dados, o banco garante que só uma transação consiga alterar o assento por vez. Utilizei o BullMQ e redis para lidar com expirações automaticas, mesmo com multiplas instancias, os jobs continuam organizados.
3. **Como previni deadlocks:** Mantive os metodos com transações menores possiveis, tendo somente o necessario dentro deles.


### EndPoints disponíveis:

- `POST /api/v1/sessions`: Criar uma nova sessão de filme.
- `GET /api/v1/sessions`: Listar todas as sessões.
- `POST /api/v1/reservation`: Reservar um assento.
- `POST /api/v1/{reservationId}/payments`: Confirmar pagamento de uma reserva.
- `GET /api/v1/reservation`: Listar todas as reservas.
- `GET /api/v1/reservation/user/{userId}`: Historico de reservas de um usuário específico.

### Decisões técnicas:
- Optei por uma arquitetura modular, organizando o projeto em features, facilitando a manutenção. Essa abordagem melhora o isolamento de responsabilidades e torna o código mais escalável.
- Common: Criei um módulo "common" para centralizar classes reutilizaveis, como DTOs, e loggers, evitando duplicação.
- database: Isolei a configuração do banco de dados em um módulo específico, facilitando futuras mudanças de banco ou ajustes na configuração. E com intuito de separar responsabilidades.
- queues: Criei um modulo separado para centralizar a configuração do BullMQ mantendo separado a infra da regra de negocio.
- worker.ts: Criei um worker dedicado para evitar sobrecarga dentro de um único serviço, permitindo que rodem em instancias diferentes.


### Limitações Conhecidas:
- Os testes unitarios só verificam se o metodo está funcionando, não testam concorrência e cenarios mais complexos. Não possuo muito conhecimento em testes, mas pretendo estudar mais e implementar futuramente.
- Não foi implementado cadastro de usuarios. Optei por fazer algo mais simples, sendo somente necessario um id qualquer para testes.

### Possíveis Melhorias Futuras:
- Implementar autenticação e autorização (JWT).
- Adicionar testes unitarios e de integração mais robustos, incluindo cenarios de concorrência.
- Implementar WebSocket ou SSE para notificar os usuários sobre o status de suas reservas em tempo real.
- Adicionar cache para melhorar a performance em consultas frequentes, como disponibilidade de assentos.
- Implementar datadog, grafana para monitoramento