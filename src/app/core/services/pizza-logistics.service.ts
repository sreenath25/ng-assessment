import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Topping } from '../../shared/models/topping.model';
import { Driver } from 'src/app/shared/models/driver.model';
import { Order } from 'src/app/shared/models/order.model';
@Injectable({
    providedIn: 'root'
})
export class PizzaLogisticsService {

    private baseAddress: string = "http://localhost:3000";
    constructor(private http: HttpClient) { }

    public getDrivers(): Observable<Driver[]> {
        return this.http.get<Driver[]>(`${this.baseAddress}/drivers`);
    }

    public getOrders(): Observable<Order[]> {
        return this.http.get<Order[]>(`${this.baseAddress}/orders`);
    }

    public getToppings(): Observable<Topping[]> {
        return this.http.get<Topping[]>(`${this.baseAddress}/toppings`);
    }

    public addOrder(order: Order): Observable<Order> {
        return this.http.post<Order>(`${this.baseAddress}/orders`, order);
    }

    public updateOrder(order: Order): Observable<Order> {
        return this.http.put<Order>(`${this.baseAddress}/orders`, order);
    }

    public updateDriver(driver: Driver): Observable<Driver[]> {
        return this.http.put<Driver[]>(`${this.baseAddress}/drivers`, driver);
    }
}