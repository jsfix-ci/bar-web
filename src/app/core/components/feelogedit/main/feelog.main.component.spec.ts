import { FeelogMainComponent, ActionTypes } from './feelog.main.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';
import { createPaymentInstruction } from '../../../../test-utils/test-utils';
import { FeeDetailEventMessage, EditTypes } from '../detail/feedetail.event.message';
import * as _ from 'lodash';
import { FeeDetailModel } from '../../../models/feedetail.model';
import { FeelogService } from '../../../services/feelog/feelog.service';
import { FeelogServiceMock } from '../../../test-mocks/feelog.service.mock';
import { PaymentStatus } from '../../../models/paymentstatus.model';
import { PaymentInstructionModel } from '../../../models/paymentinstruction.model';
import { BarHttpClient } from '../../../../shared/services/httpclient/bar.http.client';

describe('Component: FeelogMainComponent', () => {
  let component: FeelogMainComponent;
  let fixture: ComponentFixture<FeelogMainComponent>;
  let rootEl: DebugElement;
  let paymentTableEl: DebugElement;
  let feeDetailTableEl: DebugElement;
  let actionSelectEl: DebugElement;

  beforeEach(() => {

    TestBed.configureTestingModule({
      imports: [ RouterTestingModule, HttpModule, HttpClientModule ],
      declarations: [FeelogMainComponent],
      providers: [
        BarHttpClient
      ]
    });

    TestBed.overrideComponent(FeelogMainComponent, {
      set: {
        providers: [
          { provide: FeelogService, useClass: FeelogServiceMock }
        ]
      }
    });

    // create component and test fixture
    fixture = TestBed.createComponent(FeelogMainComponent);

    // get test component from the fixture
    component = fixture.componentInstance;
    rootEl = fixture.debugElement.query(By.css('div:first-of-type'));
    paymentTableEl = fixture.debugElement.query(By.css('#payment-instruction'));
    feeDetailTableEl = fixture.debugElement.query(By.css('#fee-details'));
    actionSelectEl = fixture.debugElement.query(By.css('#action'));
  });

  it('Setting component visibility', () => {
    component.isVisible = false;

    component.model = createPaymentInstruction();
    fixture.detectChanges();
    expect(rootEl.nativeElement.hidden).toBeTruthy();

    component.isVisible = true;
    fixture.detectChanges();
    expect(rootEl.nativeElement.hidden).toBeFalsy();
  });

  it('check if payment-instruction displayed correctly', () => {
    component.model = createPaymentInstruction();
    fixture.detectChanges();

    const rows = paymentTableEl.nativeElement.querySelector('tr');
    const rowCells = paymentTableEl.nativeElement.children[1].children[0].cells;

    expect(paymentTableEl.nativeElement.children.length).toBe(2);
    expect(rowCells.length).toBe(7);
    expect(rowCells[0].textContent.trim()).toBe('2');
    expect(rowCells[1].textContent.trim()).toBe('Jane Doe');
    expect(rowCells[2].textContent.trim()).toBe('Cheque');
    expect(rowCells[3].textContent.trim()).toBe('123456');
    expect(rowCells[4].textContent.trim()).toBe('£650.00');
  });

  it ('if there is no fee attached to pi then the special section should be shwon', () => {
    const model = createPaymentInstruction();
    component.model = model;
    fixture.detectChanges();
    let pageText = rootEl.nativeElement.textContent;
    expect(pageText.includes('No fee details on payment')).toBeFalsy();

    model.case_fee_details = [];
    component.model = model;
    fixture.detectChanges();
    pageText = rootEl.nativeElement.textContent;
    expect(pageText.includes('No fee details on payment')).toBeTruthy();
  });

  it('check if feedetails displayed correctly if there is any fee', () => {

    expect(feeDetailTableEl).toBeFalsy();
    component.model = createPaymentInstruction();
    fixture.detectChanges();

    feeDetailTableEl = fixture.debugElement.query(By.css('#fee-details'));
    expect(feeDetailTableEl).toBeTruthy();
    const rows = feeDetailTableEl.nativeElement.children[1];
    expect(rows.children.length).toBe(2);
    expect(rows.children[0].cells[0].textContent.trim()).toBe('ccc111');
    expect(rows.children[0].cells[1].textContent.trim()).toBe('Recovery of Land - High Court');
    expect(rows.children[0].cells[2].textContent.trim()).toBe('£480.00');
    expect(rows.children[0].cells[3].textContent.trim()).toBe('£30.00');
    expect(rows.children[0].cells[4].textContent.trim()).toBe('');
    expect(rows.children[0].cells[5].textContent.trim()).toContain('Edit');
    expect(rows.children[0].cells[5].textContent.trim()).toContain('Remove');

    expect(rows.children[1].cells[0].textContent.trim()).toBe('ccc111');
    expect(rows.children[1].cells[1].textContent.trim()).toBe('Special guardianship orders (section 14A(3) or (6)(a), 14C(3) or 14D(1))');
    expect(rows.children[1].cells[2].textContent.trim()).toBe('£215.00');
    expect(rows.children[1].cells[3].textContent.trim()).toBe('£15.00');
    expect(rows.children[1].cells[4].textContent.trim()).toBe('');
    expect(rows.children[1].cells[5].textContent.trim()).toContain('Edit');
    expect(rows.children[1].cells[5].textContent.trim()).toContain('Remove');
  });

  it('process action is disabled when unallocated amount is not zero', () => {
    component.model = createPaymentInstruction();
    fixture.detectChanges();
    let options = actionSelectEl.nativeElement.children;
    expect(options[0].disabled).toBeTruthy();
    expect(options[1].disabled).toBeFalsy();
    expect(options[2].disabled).toBeFalsy();
    expect(options[3].disabled).toBeFalsy();

    const newModel = createPaymentInstruction();
    newModel.unallocated_amount = 30;
    component.model = newModel;
    fixture.detectChanges();
    actionSelectEl = fixture.debugElement.query(By.css('#action'));
    options = actionSelectEl.nativeElement.children;
    expect(options[0].disabled).toBeTruthy();
    expect(options[1].disabled).toBeTruthy();
    expect(options[2].disabled).toBeFalsy();
    expect(options[3].disabled).toBeFalsy();

  });

  it('Clicking on the edit button the the details page is loaded', () => {
    let message = new FeeDetailEventMessage();
    const model = createPaymentInstruction();
    component.onShowDetail.subscribe((value) => message = value);
    component.model = model;
    fixture.detectChanges();

    feeDetailTableEl = fixture.debugElement.query(By.css('#fee-details'));
    expect(feeDetailTableEl).toBeTruthy();
    const buttons = feeDetailTableEl.queryAll(By.css('button'));
    buttons[0].triggerEventHandler('click', null);
    expect(message.editType).toBe(EditTypes.UPDATE);
    expect(_.isEqual(message.feeDetail, model.case_fee_details[0])).toBeTruthy();

    buttons[1].triggerEventHandler('click', null);
    expect(message.editType).toBe(EditTypes.UPDATE);
    expect(_.isEqual(message.feeDetail, model.case_fee_details[1])).toBeTruthy();
  });

  it('clicking add fee button loads the details page with the correct settings', () => {
    let message = new FeeDetailEventMessage();
    const model = createPaymentInstruction();
    component.onShowDetail.subscribe((value) => message = value);
    component.model = model;
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const addFeeBtn = buttons.find(it => it.nativeElement.textContent === 'Add case and fee details');

    addFeeBtn.triggerEventHandler('click', null);
    expect(message.editType).toBe(EditTypes.CREATE);
    expect(_.isEqual(message.feeDetail, new FeeDetailModel())).toBeTruthy();
  });

  it('clicking to remove link then the remove service is called and reload is requested', (done) => {
    let sentModelId: number;
    const model = createPaymentInstruction();
    component.onReloadModel.subscribe((value) => {
      sentModelId = value;
      expect(_.isEqual(sentModelId, model.id)).toBeTruthy();
      done();
    });
    component.model = model;
    fixture.detectChanges();

    const removeLinks = fixture.debugElement.queryAll(By.css('a')).filter(it => it.nativeElement.textContent === 'Remove');
    removeLinks[0].triggerEventHandler('click', null);
  });

  it('submit process fails to call out as no action is set', () => {
    let paymentInstruction: PaymentInstructionModel;
    const model = createPaymentInstruction();
    component.model = model;
    component.onProcess.subscribe(value => paymentInstruction = value);
    const button = fixture.debugElement.query(By.css('.button'));
    button.triggerEventHandler('click', null);
    fixture.detectChanges();
    expect(paymentInstruction).toBe(undefined);
    expect(component.showError).toBe(true);
    const actionDiv = fixture.debugElement.query(By.css('.action-form'));
    expect(actionDiv.nativeElement.className).toContain('form-group-error');
  });

  it('submit process calls out for processing the pi', () => {
    let paymentInstruction: PaymentInstructionModel;
    const model = createPaymentInstruction();
    component.model = model;
    component.onProcess.subscribe(value => paymentInstruction = value);
    component.selectedAction = ActionTypes.PROCESS;
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('.button'));
    button.triggerEventHandler('click', null);
    expect(paymentInstruction).toBe(model);
  });

  it('submit return calls out for returning the pi', () => {
    let onReturnIsCalled = false;
    const model = createPaymentInstruction();
    component.model = model;
    component.onReturn.subscribe(value => onReturnIsCalled = true);
    component.selectedAction = ActionTypes.RETURN;
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('.button'));
    button.triggerEventHandler('click', null);
    expect(onReturnIsCalled).toBeTruthy();
  });

  it('suspense calls out for suspensing the pi', () => {
    let onSuspenseIsCalled = false;
    const model = createPaymentInstruction();
    component.model = model;
    component.onSuspense.subscribe(value => onSuspenseIsCalled = true);
    component.selectedAction = ActionTypes.SUSPENSE;
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('.button'));
    button.triggerEventHandler('click', null);
    expect(onSuspenseIsCalled).toBeTruthy();
  });

  it('Should return false if payment status is not "Pending", "Validated", or "Rejected"', () => {
    const paymentStatus = PaymentStatus.PENDINGAPPROVAL;
    expect(component.checkIfValidForReturn(paymentStatus)).toBeFalsy();
  });

  it('Should ensure that false is returned since PaymentInstructionModel status is not set to TTB', () => {
    component.model = createPaymentInstruction();
    fixture.detectChanges();
    expect(component.checkIfRefundExists()).toBeFalsy();
  });

  it('should return that refund exists when pi status is TTB and there is a refund', () => {
    const model = createPaymentInstruction();
    model.status = PaymentStatus.TRANSFERREDTOBAR;
    model.case_fee_details[0].refund_amount = 10;

    component.model = model;
    fixture.detectChanges();

    expect(component.checkIfRefundExists()).toBeTruthy();
  });

});
