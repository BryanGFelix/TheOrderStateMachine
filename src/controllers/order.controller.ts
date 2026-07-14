import OrderService from '../services/order.service.ts';
import {Response, Request} from 'express';
import { AppError, handleError } from '../utility/handle-errors.ts';


export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  initialize = async (req: Request, res: Response) => {
    try {
      const order = await this.orderService.initialize();

      return res.status(201).json(order);
    } catch (error) {
      return handleError(error, res);
    }
  };

  advance = async (req: Request, res: Response) => {
    try {
        if (typeof req.body.id !== "string") {
            throw new AppError(400, "invalid_request", "id is required");
        }

        if (req.body.action !== "authorize_payment" && req.body.action !== "complete_order") {
            throw new AppError(400, "invalid_request", "action is invalid");
        }

        const order = await this.orderService.advance(req.body.id, req.body.action);

        return res.status(200).json(order);
    } catch (error) {
      return handleError(error, res);
    }
  };

  get = async (req: Request, res: Response) => {
    try {
        if (typeof req.params.id !== "string") {
            throw new AppError(400, "invalid_request", "id is required");
        }

        const order = await this.orderService.get(req.params.id);

        return res.status(200).json(order);
    } catch (error) {
        return handleError(error, res);
    }
  };
}