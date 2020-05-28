import { Pipe, PipeTransform } from '@angular/core';
import { PizzaState } from '../enums/pizza-state.enum';
import { Order } from '../models/order.model';

@Pipe({
    name: 'pizzaFilter',
    pure: false
})
export class filterPipe implements PipeTransform {

    transform(items: Order[], field: Order, value: PizzaState): any[] {

        if (items == undefined) return [];
        if (value == undefined) return items;


        return items.filter(ord => {
            return ord.state == value;
        });
    }
} 
