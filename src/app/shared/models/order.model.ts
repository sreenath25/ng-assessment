import { Topping } from './topping.model';

export class Order {
    id: number;
    customerName: string;
    toppings: Topping[];
    state: number;
    size: number;
    toppingNames: string;
}