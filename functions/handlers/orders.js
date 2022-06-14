const { admin, db } = require("../util/admin");

exports.getAllOrders = (req, res) => {
	let orders = [];
	db.collection('orders')
		.orderBy('approved', 'asc')
		.get()
		.then(snapshot => {
			snapshot.forEach(doc => {
				orders.push({
					orderId: doc.id,
					...doc.data()
				});
			});
			return res.json(orders);
		})
		.catch(err => console.error(err));
};

exports.makeOrder = (req, res) => {
	const order = {
		userId: req.body.uid,
		origin: req.body.origin,
		destination: req.body.destination,
		product: req.body.product,
		weight: req.body.weight,
		description: req.body.description,
		distance: req.body.distance,
		price: req.body.price,
		drivers: {
			firstDriverId: '',
			secondDriverId: '',
		},
		status: 0,
		approved: false,
		openingDate: admin.firestore.Timestamp.fromDate(new Date()),
		closingDate: null,
	};
	db.collection('orders').add(order)
		.then(() => {
			return res.json({ message: 'Order added successfully' });
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		})
};

exports.deleteOrder = (req, res) => {
	db.collection('orders').doc(req.params.id).get()
		.then(doc => {
			if (doc.exists) {
				if (doc.data().approved && doc.data().status !== 6) {
					return res.status(400).json({ error: 'Нельзя удалить подтвержденный заказ' });
				} else {
					db.collection('orders').doc(req.params.id).delete()
						.then(() => {
							return res.json({ message: 'Order deleted successfully' });
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

exports.rejectOrder = (req, res) => {
	db.collection('orders').doc(req.params.id).get()
		.then(doc => {
			if (doc.exists) {
				if (doc.data().approved) {
					return res.status(400).json({ error: 'Нельзя отклонить подтвержденный заказ' });
				} else {
					db.collection('orders').doc(req.params.id).update({
						approved: true,
						closingDate: admin.firestore.Timestamp.fromDate(new Date()),
						status: 6
					})
						.then(() => {
							return res.json({ message: 'Order rejected successfully' });
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

exports.approvedOrder = (req, res) => {
	db.collection('orders').doc(req.params.id).get()
		.then(doc => {
			if (doc.exists) {
				if (doc.data().approved) {
					return res.status(400).json({ error: 'Нельзя подтвердить подтвержденный заказ' });
				} else {
					db.collection('orders').doc(req.params.id).update({
						approved: true,
						status: 1
					})
						.then(() => {
							return res.json({ message: 'Order approved successfully' });
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

exports.closeOrder = (req, res) => {
	db.collection('orders').doc(req.params.id).get()
		.then(doc => {
			if (doc.exists) {
				if (doc.data().status < 5) {
					db.collection('orders').doc(req.params.id).update({
						closingDate: admin.firestore.Timestamp.fromDate(new Date()),
						status: 5,
					})
						.then(() => {
							db.collection('drivers').doc(doc.data().drivers.firstDriverId).get()
								.then(firstDriver => {
									db.collection('drivers').doc(firstDriver.id).update({
										currentOrderId: "",
										completedOrders: admin.firestore.FieldValue.increment(1),
										salary: admin.firestore.FieldValue.increment(parseFloat(doc.data().price) * 0.2),
										premium: firstDriver.data().completedOrders % 10 === 0
											? admin.firestore.FieldValue.increment(parseFloat(firstDriver.data().salary) * 0.1)
											: admin.firestore.FieldValue.increment(0)
									})
								}).catch(err => {
									console.error(err);
									return res.status(500).json({ error: err.code });
								});
							if (doc.data().drivers.secondDriverId !== '') {
								db.collection('drivers').doc(doc.data().drivers.secondDriverId).get()
									.then(secondDriver => {
										db.collection('drivers').doc(secondDriver.id).update({
											currentOrderId: "",
											completedOrders: admin.firestore.FieldValue.increment(1),
											salary: admin.firestore.FieldValue.increment(parseFloat(doc.data().price) * 0.2),
											premium: secondDriver.data().completedOrders % 10 === 0
												? admin.firestore.FieldValue.increment(parseFloat(secondDriver.data().salary) * 0.1)
												: admin.firestore.FieldValue.increment(0)
										})
									}).catch(err => {
										console.error(err);
										return res.status(500).json({ error: err.code });
									});
							}
							return res.json({ message: 'Order closed successfully' });
						})
						.catch(err => {
							console.error(err);
							return res.status(500).json({ error: err.code });
						})
				} else {
					return res.status(400).json({ error: 'Нельзя закрыть выполненный заказ' });
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

exports.changeOrderStatus = (req, res) => {
	db.collection('orders').doc(req.params.id).get()
		.then(doc => {
			if (doc.exists) {
				if (doc.data().status === 4) {
					return res.status(400).json({ error: 'Нельзя изменить статус выполненного заказа' });
				} else {
					db.collection('orders').doc(req.params.id).update({
						status: admin.firestore.FieldValue.increment(1)
					})
						.then(() => {
							return res.json({ message: 'Order status changed successfully' });
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

exports.getOrderData = (req, res) => {
	let orderData = {};
	db.collection('orders').doc(req.params.id).get()
		.then(order => {
			if (order.exists) {
				orderData.order = {
					idOrder: order.id,
					...order.data()
				};
				console.log(order.data().drivers.firstDriverId)
				return db.collection('users').doc(order.data().userId).get()
					.then(user => {
						if (user.exists) {
							orderData.user = {
								idUser: user.id,
								...user.data()
							};
							if (order.data().drivers.firstDriverId) {
								return db.collection('drivers').doc(order.data().drivers.firstDriverId).get()
									.then(doc => {
										if (doc.exists) {
											orderData.firstDriver = {
												idDriver: doc.id,
												...doc.data()
											};
											if (order.data().drivers.secondDriverId) {
												return db.collection('drivers').doc(order.data().drivers.secondDriverId).get()
													.then(doc => {
														if (doc.exists) {
															orderData.secondDriver = {
																idDriver: doc.id,
																...doc.data()
															};
															return res.json(orderData);
														} else {
															return res.json(orderData);
														}
													})
													.catch(err => {
														console.error(err);
														return res.status(500).json({ error: err.code });
													})
											}
										} else {
											return res.json(orderData);
										}
									});
							}
						} else return res.status(404).json({ error: 'User not found' });
					})
					.then(() => {
						return res.json(orderData);
					})
					.catch(err => {
						console.error(err);
						return res.status(500).json({ error: err.code });
					});
			} else {
				return res.status(404).json({ error: 'Order not found' });
			}
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		})
};



exports.updateOrder = (req, res) => {
	db.collection('orders').doc(req.params.id).get()
		.then(doc => {
			if (doc.exists) {
				if (doc.data().approved) {
					return res.status(400).json({ error: 'Нельзя изменить подтвержденный заказ' });
				} else {
					db.collection('orders').doc(req.params.id).update({
						closingDate: admin.firestore.Timestamp.fromDate(new Date()),
						status: 'Закрыт'
					})
						.then(() => {
							return res.json({ message: 'Order closed successfully' });
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
};