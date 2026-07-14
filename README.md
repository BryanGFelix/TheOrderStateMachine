# Order State Machine

## Description
I built a lightweight order state machine using layered architecture in Node.js and TypeScript. The system is designed to handle stage dependent transaction recovery and isolate critical partial failures during ticket purchases.

I chose this design because it keeps the prototype focused on the core problem: enforcing valid order transitions and handling failure recovery based on the current stage of the order. Since this was a time-boxed exercise, I kept the architecture lightweight instead of introducing things like dynamic state classes and introducing a real database.

The layered structure keeps the responsibilities clear. The controller handles HTTP requests and responses, the service owns the state machine and recovery logic, the repository handles storage, and the payment gateway is stubbed behind an interface. This made the important behavior easy to test while still leaving clear places to replace the prototype pieces with production-ready implementations later.


## Tradeoffs
```Multi-purpose endpoint vs Semantic routing (for advancing state routes)```
- Choice: I routed authorized payment and complete order through the same endpoint
- Tradeoff: Keeps route management simple and quick to implement. But, it makes it difficult and messy to add distinct logic like middleware vs dedicated routes.

```In memory storage vs Real database```
- Choice: In memory storage
- Tradeoff: Quick and easy implementation for limited time. But, it does not persist data.

```Static validation map vs Dynamic state classes```
- Choice: I managed state transition rules using Typescript interfaces and a static validation map.
- Tradeoff: It's clean, readable, and easy to implement. Doesn't need constant rehydration. But, it can lead to code bloat with conditional handling and does not isolate state specific issues.

```Synchronous transactions vs. Asynchronous queuing```
- Choice: Handle payment void synchronously after receiving order completion failure.
- Tradeoff: Keeps state machine deterministic and simple to test. But, in a live application, this would make it so connections stay open longer and give users a slower response time.

## Potential Improvements
- Real database
- Webhook and background job processing
- Add retry logic for recoverable failures
- Semantic routing
- Dynamic state classes
- Idempotency and concurrency logic
- Detailed Logging

## How to run it

Install dependencies:

```bash
npm install
```

Run the tests:

```bash
npm test
```

Start the API server:

```bash
npm run dev
```

The server runs on:

```txt
http://localhost:3000
```

## API endpoints

Create an order:

```http
POST /orders/initialize
```

Advance an order to payment authorization:

```http
POST /orders/update
Content-Type: application/json

{
  "id": "ORDER_ID",
  "action": "authorize_payment"
}
```

Advance an authorized order to completion:

```http
POST /orders/update
Content-Type: application/json

{
  "id": "ORDER_ID",
  "action": "complete_order"
}
```

Get the current order status and history:

```http
GET /orders/status/ORDER_ID
```
