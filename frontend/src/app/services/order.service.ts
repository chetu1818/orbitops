import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { resolveApiUrl } from '../utils/api';

export interface Order {
  id: string;
  userId?: string;
  workflowType: string;
  sourceSystem: string;
  destinationSystem: string;
  sourceCredentials: Record<string, string>;
  destinationCredentials: Record<string, string>;
  price: number;
  instructions: string;
  engineerName: string;
  engineerRating: number;
  status: string;
  estimatedCompletionTime?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = resolveApiUrl('/api/orders', 'http://localhost:5015/api/orders');

  private getHeaders() {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', token ? `Bearer ${token}` : '');
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      catchError(() => {
        // Fallback to localStorage for resilient offline/local demonstration
        const local = localStorage.getItem(`orbitops_orders_${this.authService.currentUser()?.id}`);
        if (local) {
          try {
            return of(JSON.parse(local));
          } catch {
            return of([]);
          }
        }
        return of(this.getMockOrders());
      })
    );
  }

  createOrder(orderData: Partial<Order>): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, orderData, { headers: this.getHeaders() }).pipe(
      tap(newOrder => {
        // Persist to local storage fallback
        const userId = this.authService.currentUser()?.id;
        const localKey = `orbitops_orders_${userId}`;
        const existing = localStorage.getItem(localKey);
        let orders: Order[] = [];
        if (existing) {
          try {
            orders = JSON.parse(existing);
          } catch {
            orders = [];
          }
        }
        orders.unshift(newOrder);
        localStorage.setItem(localKey, JSON.stringify(orders));
      }),
      catchError(err => {
        console.warn('Backend API order creation failed, falling back to simulated order registration:', err);
        // Simulate a successful order response locally
        const simulatedOrder: Order = {
          id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
          workflowType: orderData.workflowType || 'Unknown Workflow',
          sourceSystem: orderData.sourceSystem || 'Unknown Source',
          destinationSystem: orderData.destinationSystem || 'Unknown Destination',
          sourceCredentials: orderData.sourceCredentials || {},
          destinationCredentials: orderData.destinationCredentials || {},
          price: orderData.price || 0,
          instructions: orderData.instructions || '',
          engineerName: orderData.engineerName || 'Sarah Jenkins',
          engineerRating: orderData.engineerRating || 5.0,
          status: 'Awaiting Admin Review',
          estimatedCompletionTime: 'Awaiting Review',
          createdAt: new Date().toISOString()
        };

        const userId = this.authService.currentUser()?.id;
        if (userId) {
          const localKey = `orbitops_orders_${userId}`;
          const existing = localStorage.getItem(localKey);
          let orders: Order[] = [];
          if (existing) {
            try {
              orders = JSON.parse(existing);
            } catch {
              orders = [];
            }
          }
          orders.unshift(simulatedOrder);
          localStorage.setItem(localKey, JSON.stringify(orders));
        }

        return of(simulatedOrder);
      })
    );
  }

  getPendingWorkflows(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/pending`, { headers: this.getHeaders() }).pipe(
      catchError(() => {
        // Fallback to local filtering of pending orders
        const userId = this.authService.currentUser()?.id;
        const local = localStorage.getItem(`orbitops_orders_${userId}`);
        if (local) {
          try {
            const list: Order[] = JSON.parse(local);
            return of(list.filter(o => o.status === 'Awaiting Admin Review'));
          } catch {
            return of([]);
          }
        }
        return of([]);
      })
    );
  }

  approveCosting(orderId: string, price: number, estimatedCompletionTime: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/approve`, { orderId, price, estimatedCompletionTime }, { headers: this.getHeaders() }).pipe(
      tap(() => {
        const userId = this.authService.currentUser()?.id;
        const localKey = `orbitops_orders_${userId}`;
        const existing = localStorage.getItem(localKey);
        if (existing) {
          try {
            const orders: Order[] = JSON.parse(existing);
            const order = orders.find(o => o.id === orderId);
            if (order) {
              order.price = price;
              order.estimatedCompletionTime = estimatedCompletionTime;
              order.status = 'Cost Proposed by Admin';
              localStorage.setItem(localKey, JSON.stringify(orders));
            }
          } catch {}
        }
      }),
      catchError(err => {
        console.warn('Backend API costing approval failed, running simulated fallback:', err);
        return of({ success: true });
      })
    );
  }

  clientApproveCosting(orderId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/client-approve`, { orderId }, { headers: this.getHeaders() }).pipe(
      tap(() => {
        const userId = this.authService.currentUser()?.id;
        const localKey = `orbitops_orders_${userId}`;
        const existing = localStorage.getItem(localKey);
        if (existing) {
          try {
            const orders: Order[] = JSON.parse(existing);
            const order = orders.find(o => o.id === orderId);
            if (order) {
              order.status = 'Awaiting Payment';
              localStorage.setItem(localKey, JSON.stringify(orders));
            }
          } catch {}
        }
      }),
      catchError(err => {
        console.error('Backend API client costing approval failed:', err);
        return throwError(() => err);
      })
    );
  }

  clientDeclineCosting(orderId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/client-decline`, { orderId }, { headers: this.getHeaders() }).pipe(
      tap(() => {
        const userId = this.authService.currentUser()?.id;
        const localKey = `orbitops_orders_${userId}`;
        const existing = localStorage.getItem(localKey);
        if (existing) {
          try {
            const orders: Order[] = JSON.parse(existing);
            const order = orders.find(o => o.id === orderId);
            if (order) {
              order.status = 'Declined';
              localStorage.setItem(localKey, JSON.stringify(orders));
            }
          } catch {}
        }
      }),
      catchError(err => {
        console.error('Backend API client costing decline failed:', err);
        return throwError(() => err);
      })
    );
  }

  clientCounterCosting(orderId: string, counterPrice: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/client-counter`, { orderId, counterPrice }, { headers: this.getHeaders() }).pipe(
      tap(() => {
        const userId = this.authService.currentUser()?.id;
        const localKey = `orbitops_orders_${userId}`;
        const existing = localStorage.getItem(localKey);
        if (existing) {
          try {
            const orders: Order[] = JSON.parse(existing);
            const order = orders.find(o => o.id === orderId);
            if (order) {
              order.price = counterPrice;
              order.status = 'Awaiting Admin Review';
              localStorage.setItem(localKey, JSON.stringify(orders));
            }
          } catch {}
        }
      }),
      catchError(err => {
        console.error('Backend API client costing counter failed:', err);
        return throwError(() => err);
      })
    );
  }

  confirmPayment(orderId: string): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/pay`, { orderId }, { headers: this.getHeaders() }).pipe(
      tap(updatedOrder => {
        const userId = this.authService.currentUser()?.id;
        const localKey = `orbitops_orders_${userId}`;
        const existing = localStorage.getItem(localKey);
        if (existing) {
          try {
            const orders: Order[] = JSON.parse(existing);
            const index = orders.findIndex(o => o.id === orderId);
            if (index !== -1) {
              orders[index].status = 'Awaiting Assignment';
              localStorage.setItem(localKey, JSON.stringify(orders));
            }
          } catch {}
        }
      }),
      catchError(err => {
        console.error('Backend API payment confirmation failed:', err);
        return throwError(() => err);
      })
    );
  }

  private getMockOrders(): Order[] {
    const userId = this.authService.currentUser()?.id;
    const mock: Order[] = [
      {
        id: 'ORD-5892',
        workflowType: 'HR Employee Sync',
        sourceSystem: 'BambooHR',
        destinationSystem: 'HiBob',
        sourceCredentials: { 'Subdomain': 'company', 'API Key': '••••••••••••' },
        destinationCredentials: { 'API Key': '••••••••••••' },
        price: 299,
        instructions: 'Sync all active employee records on hourly basis.',
        engineerName: 'Sarah Jenkins',
        engineerRating: 5.0,
        status: 'Completed',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'ORD-7241',
        workflowType: 'Payroll Automation',
        sourceSystem: 'Personio',
        destinationSystem: 'ADP Payroll',
        sourceCredentials: { 'Client ID': 'p_client_id', 'Client Secret': '••••••••••••' },
        destinationCredentials: { 'Username': 'adp_user', 'Password': '••••••••••••' },
        price: 799,
        instructions: 'Deploy delta payroll updates monthly on 28th.',
        engineerName: 'Alex Chen',
        engineerRating: 4.9,
        status: 'In Progress',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    if (userId) {
      localStorage.setItem(`orbitops_orders_${userId}`, JSON.stringify(mock));
    }
    return mock;
  }
}
