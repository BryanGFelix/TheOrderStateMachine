
import { Order } from "../types/order";
import {OrderRepository} from './interfaces/storage'

export default class InMemoryOrderRepository implements OrderRepository {
  private orders = new Map<string, Order>();

  async initialize(order: Order): Promise<Order> {
    this.orders.set(order.id, order);
    return order;
  }

  async save(order: Order): Promise<Order> {
    this.orders.set(order.id, order);
    return order;
  }

  async get(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }
}