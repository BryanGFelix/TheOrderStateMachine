import { Order } from "../../types/order";

export interface OrderRepository {
  initialize(order: Order): Promise<Order>;
  get(id: string): Promise<Order | null>;
  save(order: Order): Promise<Order>;
}