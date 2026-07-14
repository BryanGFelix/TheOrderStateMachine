import express from "express";
import { OrderController } from "./src/controllers/order.controller.ts";
import InMemoryOrderRepository from "./src/repositories/storage.ts";
import OrderService from "./src/services/order.service.ts";
import StubPaymentGateway from "./src/services/payment.service.ts";

const app = express();
const port = process.env.PORT ?? 3000;

app.use(express.json());

const repository = new InMemoryOrderRepository();
const paymentGateway = new StubPaymentGateway();
const orderService = new OrderService(repository, paymentGateway);
const orderController = new OrderController(orderService);

app.post("/orders/initialize", orderController.initialize);
app.post("/orders/update", orderController.advance);
app.get("/orders/status/:id", orderController.get);

app.listen(port, () => {
  console.log(`Order service listening on port ${port}`);
});

export default app;
