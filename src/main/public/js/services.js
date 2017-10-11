// Service Application

var ServicesAjax = {
  postToAPI: function (data) {
    if (typeof data === 'undefined')
      data = {};

    return ($.ajax({
      url: '',
      method: 'POST',
      data: data
    }))
  }
};


var ServicesApplication = {
  servicesAndSubServices: [],
  form: document.querySelector('form#service-form'),
  errors: [],

  initialize: function () {
    this.servicesAndSubServices = SubServices.value;
    this.setEvents();
  },

  setEvents: function () {
    this.form.elements.namedItem('service').addEventListener('change', this.onServiceChange.bind(this));
    this.form.elements.namedItem('addToLog').addEventListener('click', this.onAddToLog.bind(this));
    this.form.elements.namedItem('paymentType').addEventListener('change', this.onPaymentTypeChange.bind(this));
  },

  // START: event triggered methods goes here
  onServiceChange: function (ev) {
    var serviceId = parseInt(ev.currentTarget.value);
    this.getSubServicesById(serviceId);
  },

  onAddToLog: function (ev) {
    ev.preventDefault();
    var data = this.obtainValuesFromFields(this.form.elements);
    // console.log(data);
    ServicesAjax.postToAPI(data).then(function (response) {
      if (typeof response.validationErrors !== 'undefined') {
        this.errors = response.validationErrors;
      }

      if (this.errors.length > 0) {
        // render the errors
        console.log( this.errors );
        this.renderErrors();
        return;
      }

      this.resetErrors();
    }.bind(this));
  },

  onPaymentTypeChange: function () {
    this.togglePaymentDisplay();
  },
  // END: event triggered methods goes here

  getSubServicesById: function (serviceId) {
    serviceId--; // since an array starts from 0, decrease by one
    this.populateSubServices(this.servicesAndSubServices.services[serviceId].subServices);
  },

  obtainValuesFromFields: function (elements) {
    var data = {};
    var numberOfElements = elements.length;
    for (var i = 0; i < numberOfElements; i++) {
      var elementName = elements[i].getAttribute('name');
      if (elementName !== 'addToLog') {
        data[elementName] = elements[i].value;
      }
    }
    return data;
  },

  populateSubServices: function (subServices) {
    this.form.elements.namedItem('subService').innerHTML = '';
    subServices.forEach(function (subService) {
      var text = document.createTextNode(subService.name);
      var option = document.createElement('option');
      option.setAttribute('value', subService.value);
      option.appendChild(text);
      this.form.elements.namedItem('subService').appendChild(option);
    }.bind(this))
  },

  togglePaymentDisplay: function () {
    var paymentType = this.form.elements.namedItem('paymentType');
    var template = _.template(document.getElementById('paymentType-' + paymentType.value).innerHTML);
    document.querySelector('.paymentType-option').innerHTML = template();

    console.log( error );
    console.log( error.fieldName );
  },

  renderErrors: function () {
    this.errors.forEach(function (error) {
      var formGroup = this.form.elements.namedItem( error.fieldName ).parentElement;
      formGroup.classList.add('form-group-error');

      // check if there's an error
      formGroup.querySelector('span.error-message').classList.add('error-message');

      // this.form.elements.namedItem( error.fieldName ).parentElement.getAttribute('class').className.remove('form-group-error');
    }.bind(this));
  },

  resetErrors: function () {
    this.errors = [];
  },

  toggleFormGroupItem: function () {

  }
};


// once page is ready, initialize the application, binding "this" to itself
window.onload = ServicesApplication.initialize.bind(ServicesApplication);
