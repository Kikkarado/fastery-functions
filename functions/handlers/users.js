const { admin, db } = require("../util/admin");

const getStatus = (req, res) => {
	const user = req.body.uid;
	db.doc(`/users/${user}`).get()
		.then(doc => {
			if (doc) {
				return res.json({ status: doc.data().status });
			}
			return res.json({ message: 'not authorization' });
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		});
}

exports.login = (req, res) => {
	getStatus(req, res);
};

exports.signup = (req, res) => {
	const newUser = {
		name: req.body.name,
		surname: req.body.surname,
		patronymic: req.body.patronymic,
		email: req.body.email,
		phone: req.body.phone,
		date: admin.firestore.Timestamp.fromDate(new Date()),
		status: req.body.status !== 'admin' ? 'user' : 'admin',
	}
	db.doc(`/users/${req.body.uid}`).set(newUser)
		.then(() => {
			return getStatus(req, res);
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		})
};

exports.getAllUsers = (req, res) => {
	db.collection('users')
		.orderBy('date', 'desc')
		.get()
		.then(snapshot => {
			let users = [];
			snapshot.forEach(doc => {
				users.push({
					userId: doc.id,
					...doc.data()
				});
			});
			return res.json(users);
		})
		.catch(err => console.error(err));
};

exports.getUserData = (req, res) => {
	let userData = {};
	db.doc(`/users/${req.params.id ? req.params.id : req.body.uid}`).get()
		.then((doc) => {
			if (doc.exists) {
				userData.user = { uid: doc.id, ...doc.data() };
				return db
					.collection("orders")
					.where("userId", "==", req.params.id ? req.params.id : req.body.uid)
					//.orderBy("createdAt", "desc")
					.get();
			} else {
				return res.status(404).json({ error: "User not found" });
			}
		})
		.then(data => {
			userData.orders = [];
			data.forEach(doc => {
				userData.orders.push({
					orderId: doc.id,
					...doc.data()
				});
			});
			return res.json(userData);
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		})
};

exports.updateUser = (req, res) => {
	db.collection('users').doc(req.body.uid).get()
		.then(doc => {
			if (doc.exists) {
				const id = req.body.uid;
				admin.auth().updateUser(id, {
					email: req.body.email
				})
					.then(() => {
						db.collection('users').doc(id).update({
							name: req.body.name,
							surname: req.body.surname,
							patronymic: req.body.patronymic,
							email: req.body.email,
							phone: req.body.phone,
						})
							.then(() => {
								return res.json({ message: 'User updated successfully' });
							})
							.catch(err => {
								console.error(err);
								return res.status(500).json({ error: err.code });
							})
					})
					.catch(err => {
						console.error(err);
						return res.status(500).json({ error: err.code });
					})
			} else {
				return res.status(404).json({ error: 'User not found' });
			}
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		})
};

exports.changeUserStatus = (req, res) => {
	db.collection('users').doc(req.params.id).get()
		.then(doc => {
			if (doc.exists) {
				db.collection('users').doc(req.params.id).update({ status: req.body.status })
					.then(() => {
						return res.json({ message: 'User status updated successfully' });
					})
					.catch(err => {
						console.error(err);
						return res.status(500).json({ error: err.code });
					})
			} else {
				return res.status(404).json({ error: "User not found" });
			}
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		})
};
