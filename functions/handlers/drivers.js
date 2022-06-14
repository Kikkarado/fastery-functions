const { admin, db } = require("../util/admin");

exports.getAllDrivers = (req, res) => {
	let drivers = [];
	db.collection('drivers').get()
		.then(snapshot => {
			snapshot.forEach(doc => {
				drivers.push({
					idDriver: doc.id,
					...doc.data()
				});
			});
			return res.json(drivers);
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		})
};

exports.addDriver = (req, res) => {
	const driver = {
		name: req.body.name,
		surname: req.body.surname,
		patronymic: req.body.patronymic,
		phone: req.body.phone,
		email: req.body.email,
		completedOrders: 0,
		currentOrderId: "",
		salary: "0.0",
		premium: "0.0",
		employed: true,
	}
	db.collection('drivers').add(driver)
		.then(() => {
			return res.json({ message: 'Driver added successfully' });
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		})
};

exports.addDriverToOrder = (req, res) => {
	db.collection('orders').doc(req.params.id).get()
		.then(doc => {
			if (doc.exists) {
				if (doc.data().approved) {
					return res.status(400).json({ error: 'Нельзя добавить водителя к подтвержденному заказу' });
				} else {
					db.collection('orders').doc(req.params.id).update({
						drivers: {
							firstDriverId: req.body.firstDriverId,
							secondDriverId: req.body.secondDriverId,
						}
					})
						.then(() => {
							db.collection('drivers').doc(req.body.firstDriverId).update({
								currentOrderId: req.params.id
							})
							if (req.body.secondDriverId || req.body.secondDriverId !== '') {
								db.collection('drivers').doc(req.body.secondDriverId).update({
									currentOrderId: req.params.id
								})
							}
							return res.json({ message: 'Order updated successfully' });
						})
						.catch(err => {
							console.error(err);
							return res.status(500).json({ error: err.code });
						})
				}
			} else {
				return res.status(404).json({ error: 'Order not found' });
			}
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		})
};

exports.getEmployedDrivers = (req, res) => {
	let drivers = [];
	db.collection('drivers').where('employed', '==', true).where('currentOrderId', '==', '').get()
		.then(snapshot => {
			snapshot.forEach(doc => {
				drivers.push({
					idDriver: doc.id,
					fullName: doc.data().surname + ' ' + doc.data().name + ' ' + doc.data().patronymic,
					email: doc.data().email,
				});
			});
			return res.json(drivers);
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		})
};

exports.getDriverData = (req, res) => {
	db.collection('drivers').doc(req.params.id).get()
		.then(doc => {
			if (doc.exists) {
				return res.json({
					idDriver: doc.id,
					...doc.data()
				});
			} else {
				return res.status(404).json({ error: 'Driver not found' });
			}
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		})
};

exports.updateDriver = (req, res) => {
	db.collection('drivers').doc(req.params.id).get()
		.then(doc => {
			if (doc.exists) {
				db.collection('drivers').doc(req.params.id).update({
					name: req.body.name,
					surname: req.body.surname,
					patronymic: req.body.patronymic,
					phone: req.body.phone,
					email: req.body.email,
				})
					.then(() => {
						return res.json({ message: 'Driver updated successfully' });
					})
					.catch(err => {
						console.error(err);
						return res.status(500).json({ error: err.code });
					})
			} else {
				return res.status(404).json({ error: 'Driver not found' });
			}
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		})
};

exports.dismissDriver = (req, res) => {
	db.collection('drivers').doc(req.params.id).get()
		.then(doc => {
			if (doc.exists) {
				db.collection('drivers').doc(req.params.id).update({
					employed: !doc.data().employed
				})
					.then(() => {
						return res.json({ message: 'Driver dismissed successfully' });
					})
					.catch(err => {
						console.error(err);
						return res.status(500).json({ error: err.code });
					})
			} else {
				return res.status(404).json({ error: 'Driver not found' });
			}
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		})
};

exports.paySalary = (req, res) => {
	db.collection('drivers').doc(req.params.id).get()
		.then(doc => {
			if (doc.exists) {
				db.collection('drivers').doc(req.params.id).update({
					salary: 0.0,
					premium: 0.0,
				})
					.then(() => {
						return res.json({ message: 'Salary paid successfully' });
					})
					.catch(err => {
						console.error(err);
						return res.status(500).json({ error: err.code });
					})
			} else {
				return res.status(404).json({ error: 'Driver not found' });
			}
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		})
};