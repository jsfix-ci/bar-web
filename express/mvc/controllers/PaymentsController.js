// import the payment service
const PaymentService = require('../../services').PaymentService;

class PaymentsController {

	get_index(req, res) {
		PaymentService.getPaymentTypes()
	    	.then(response => res.json(response.body))
		    .catch(error => res.json({ error: error.message }));
	}

	post_index(req, res) {
		const data = req.body;
		const paymentType = req.params.type;

		PaymentService.sendPaymentDetails(data, paymentType)
		    .then(response => { console.log( response.body ); res.json(response.body) })
		    .catch(error => res.json({ error: error.message }));
	}

}

module.exports = PaymentsController;
