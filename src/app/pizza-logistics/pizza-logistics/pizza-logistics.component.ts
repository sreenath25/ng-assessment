import { Component, OnInit, ViewChild, ElementRef} from '@angular/core';
import { Subscription } from 'rxjs';
import { BehaviorSubject, Subject, Observable, forkJoin } from 'rxjs';
import { DriverState } from '../../shared/enums/driver-state.enum';
import { PizzaState } from '../../shared/enums/pizza-state.enum';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PizzaLogisticsService } from 'src/app/core/services/pizza-logistics.service';
import { Topping } from 'src/app/shared/models/topping.model';
import { Driver } from 'src/app/shared/models/driver.model';
import { Order } from 'src/app/shared/models/order.model';
import { MatSnackBar, MatSelectionList } from '@angular/material';

@Component({
  selector: 'app-pizza-logistics',
  templateUrl: './pizza-logistics.component.html',
  styleUrls: ['./pizza-logistics.component.scss']
})
export class PizzaLogisticsComponent implements OnInit {
  private ordersForm: FormGroup;
  private toppings: Topping[] = [];
  private drivers: Driver[] = [];
  private orders: Order[];
  private ordersQueue: Order[] = [];
  get PizzaState() { return PizzaState; }
  @ViewChild('selectDriver', { static: false }) selectedDriver: MatSelectionList;

  constructor(private pizzaLogisticService: PizzaLogisticsService,
    private _snackBar: MatSnackBar,
    private _formBuilder: FormBuilder) {
    this.ordersForm = this._formBuilder.group({
      customerName: ['', [Validators.required, Validators.pattern("^[a-zA-Z0-9]+$")]],
      toppings: ['', Validators.required],
      size: ['', Validators.required],
    });
  }

  public ngOnInit(): void {
    let driverData$: Observable<Driver[]> = this.pizzaLogisticService.getDrivers();
    let orderData$: Observable<Order[]> = this.pizzaLogisticService.getOrders();
    let toppingData$: Observable<Topping[]> = this.pizzaLogisticService.getToppings();
    forkJoin(driverData$, orderData$, toppingData$).subscribe(data => {
      this.drivers = data[0];
      this.orders = data[1];
      this.toppings = data[2];
      console.log(this.drivers);
      console.log(this.orders);
      this.orders.map(or => {
        if (or.toppings == undefined)
          or.toppings = [];
        let tempToppings = [];
        or.toppings.map(tpn => {
          tpn = this.toppings.find(x => x.id == tpn.id);
          if (tpn != undefined)
            tempToppings.push(tpn);
        })

        or.toppings = tempToppings;
        or.toppingNames = or.toppings.map(x => x.name).join(', ');
      });
    });
  }

  public preparePizza(order: Order): void {
    let totalTime: number = order.toppings.map(a => a.time).reduce(function (a, b) {
      return a + b;
    });

    order.state = PizzaState.cooking;
    totalTime = totalTime + 5;//Default 5 seconds to cook;
    this.displayMessage(`Your Order ${order.id} is in process. Kinldy wait for ${totalTime} seconds`);
    //TODO: make service call to save data
    setTimeout(() => {
      order.state = PizzaState.ready;
      this.updateOrder(order);
      this.displayMessage(`Your Order ${order.id} prepared and ready to ship`);
      //TODO: make service call to save data
    }, totalTime * 1000);
  }

  private placeOrder(): void {
    if (this.ordersForm.valid) {
      let order: Order = this.ordersForm.value;
      order.id = this.getNewOrderId();
      order.state = PizzaState.open;
      let tempToppings: Topping[] = [];
      this.ordersForm.value.toppings.map(tpn => {
        tpn = this.toppings.find(x => x.id == tpn);
        if (tpn != undefined)
          tempToppings.push(tpn);
      })

      order.toppings = tempToppings;
      order.toppingNames = order.toppings.map(x => x.name).join(', ');
      this.updateOrder(order);
      this.ordersForm = this._formBuilder.group({
        customerName: ['', [Validators.required, Validators.pattern("^[a-zA-Z0-9]+$")]],
        toppings: ['', Validators.required],
        size: ['', Validators.required],
      });
    }
  }

  private assignDriver(order: Order) {
    console.log(this.selectedDriver._value);
    if (this.selectedDriver._value == undefined) {
      this.displayMessage(`Select driver to assign`);
      return;
    }

    let index = this.drivers.findIndex(x => x.id == Number.parseInt(this.selectedDriver._value.toString()));
    let driver = this.drivers[index];
    if (driver.state != DriverState.ready) {
      order.state = PizzaState.enRoute;
      this.updateOrder(order);
      this.ordersQueue.push(order);
      this.displayMessage(`Order ${order.id} is enroute, order may reach greater than expected time.`);
      return;
    }

    driver.state = DriverState.enRoute;
    this.updateDriver(driver);
    order.state = PizzaState.enRoute;
    this.updateOrder(order);
    this.displayMessage(`Order ${order.id} is enroute, it will take 15 seconds to deliver`);
    setTimeout(() => {
      order.state = PizzaState.delivered;
      this.updateOrder(order);
      driver.state = DriverState.ready;
      this.updateDriver(driver);
      this.displayMessage(`Order ${order.id} is delivered`);
      if (this.ordersQueue.length > 0) {
        this.assignDriver(this.ordersQueue[0])
        this.ordersQueue.splice(0, 1);
      }
      //TODO: make service call to save data
    }, 15 * 1000);
  }

  private updateOrder(order: Order): void {
    let position = this.orders.findIndex(x => x.id == order.id);
    if (position != -1) {
      this.orders.splice(position, 1);
      this.orders.push(order);
      this.pizzaLogisticService.updateOrder(order).subscribe(data => {
        //Success message or alternative flow
      });
    } else {
      this.orders.push(order);
      this.pizzaLogisticService.addOrder(order).subscribe(data => {
        //Success message or alternative flow
      });
    }
  }

  private updateDriver(driver: Driver): void {
    let position = this.drivers.findIndex(x => x.id == driver.id);
    this.drivers.splice(position, 1);
    this.drivers.push(driver);
    this.drivers = this.drivers.sort((x, y) => { return x.firstName > y.firstName ? 0 : -1; });
    this.pizzaLogisticService.updateDriver(driver).subscribe(data => {
      //Success message or alternative flow
    });
  }

  private displayMessage(message: string) {
    this._snackBar.open(message, 'close', {
      duration: 5 * 1000,
    });
  }

  private getNewOrderId(): number {
    return Math.max.apply(Math, this.orders.map(function (o) { return o.id; })) + 1;
  }
}