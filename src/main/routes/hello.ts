import * as express from 'express'
import rq from 'client/request'


// export the express.Router object with defined routes
export default express.Router()

	// Home URL
	.get('/hello', (req: express.Request, res: express.Response) => {
		
		// make request to this URL, and return "promise" / "error"
		rq.get('http://localhost:8080/hello')
			.then(response => {
				res.status(200).render('bar/views/hello', { 
					title: 'BARS Project', 
					message: response 
				})
			})
			.catch(error => {
				res.status(404).render('bar/views/error', { 
					title: 'BARS Project', 
					message: 'Unable to get data from API.', 
					information: JSON.stringify(error) 
				})
			})
	})
