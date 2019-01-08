import { Component, OnInit, HostListener } from '@angular/core';
import { BarHttpClient } from '../../../shared/services/httpclient/bar.http.client';
import { PaymentsOverviewService } from '../../services/paymentoverview/paymentsoverview.service';
import { ActivatedRoute } from '@angular/router';
import { combineLatest } from 'rxjs';
import { IPaymentStatistics } from '../../interfaces/payment.statistics';
import { PaymenttypeService } from '../../services/paymenttype/paymenttype.service';
import { PaymentStateService } from '../../../shared/services/state/paymentstate.service';
import { Observable } from 'rxjs';
import { IPaymentAction } from '../../interfaces/payment-actions';
import {IResponse} from '../../interfaces';
import {PaymentAction} from '../../models/paymentaction.model';

@Component({
  selector: 'app-payment-summary-review',
  templateUrl: './payment-review-summary.component.html',
  styleUrls: ['./payment-review-summary.component.scss'],
  providers: [PaymenttypeService, BarHttpClient, PaymentsOverviewService]
})
export class PaymentReviewSummaryComponent implements OnInit {
  paymentActions$: Observable<IPaymentAction[]>;
  fullName: string;
  status: string;
  oldStatus: string;
  userId: string;
  numOfPaymentInstructions = {};
  activeAction: IPaymentAction;
  stats = null;
  showStats = true;
  showDetails = false;
  query: string;

  constructor(
    private _paymentOverviewService: PaymentsOverviewService,
    private _paymentStateService: PaymentStateService,
    private _route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.paymentActions$ = this._paymentStateService.paymentActions$;
    this.onPopState({
      state: {
        navigationId: 1
      }
    });
    combineLatest(this._route.params, this._route.queryParams, (params, qparams) => ({ params, qparams }))
      .subscribe(val => {
        if (val) {
          this.userId = val.params.id;
          this.status = val.qparams.status;
          this.oldStatus = val.qparams.old_status;
          this.fullName = val.qparams.fullName;
          this._paymentOverviewService
            .getPaymentStatsByUserAndStatus(this.userId, this.status, this.oldStatus)
            .subscribe((resp: IResponse) => this.processData(resp));
        }
      });
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event) {
    if (event.state && event.state.navigationId) {
      const hash = decodeURIComponent(window.location.hash.substr(1)).split('/');
      this.paymentActions$.subscribe(actions => {
        const currentAction = actions.find(action => {
          return action.action === hash[0];
        });
        this.activeAction = currentAction ? currentAction : actions[0];
        if (hash.length < 2) {
          this.showStats = true;
          this.showDetails = false;
        } else {
          this.loadDetails({ query: hash[1] });
        }
      });
    }
  }

  makeActionActive(action: IPaymentAction) {
    window.location.hash = action.action;
    this.activeAction = action;
    this.showStats = true;
    this.showDetails = false;
  }

  findActionCount(action: string): number {
    return this.numOfPaymentInstructions[action] ? this.numOfPaymentInstructions[action] : 0;
  }

  loadDetails(event) {
    this.query = event.query.substr(event.query.indexOf('?'));
    this.showStats = false;
    this.showDetails = true;
    window.location.hash = `${this.activeAction.action}/${this.query}`;
  }

  reloadStats(event) {
    this._paymentOverviewService
      .getPaymentStatsByUserAndStatus(this.userId, this.status)
      .subscribe((resp: IResponse) => this.processData(resp));
  }

  private processData(resp: IResponse) {
    this.stats = resp.data.content;
    this.numOfPaymentInstructions = {};
    Object.keys(resp.data.content).forEach(key => resp.data.content[key].forEach(element => {
      const stat = <IPaymentStatistics> element;
      if (this.numOfPaymentInstructions[stat.action]) {
        this.numOfPaymentInstructions[stat.action] += stat.count;
      } else {
        this.numOfPaymentInstructions[stat.action] = stat.count;
      }
    }));
  }
}
