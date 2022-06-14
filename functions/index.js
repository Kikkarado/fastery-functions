const functions = require("firebase-functions");
const app = require("express")();

const cors = require('cors');
app.use(cors());

const {
	login,
	signup,
	getAllUsers,
	getUserData,
	updateUser,
	changeUserStatus,
} = require("./handlers/users");

const {
	getAllOrders,
	makeOrder,
	deleteOrder,
	rejectOrder,
	approvedOrder,
	closeOrder,
	changeOrderStatus,
	getOrderData,
} = require("./handlers/orders");

const {
	getAllDrivers,
	addDriver,
	addDriverToOrder,
	getEmployedDrivers,
	getDriverData,
	updateDriver,
	dismissDriver,
	paySalary,
} = require("./handlers/drivers");

//Users
app.post("/signup", signup);
app.post("/login", login);
app.get("/users", getAllUsers);
app.get("/user/:id", getUserData);
app.post("/profile", getUserData);
app.post("/updateProfile", updateUser);
app.post("/changeUserStatus/:id", changeUserStatus);

//Orders
app.post("/makeorder", makeOrder);
app.get("/orders", getAllOrders);
app.post("/deleteOrder/:id", deleteOrder);
app.post("/rejectOrder/:id", rejectOrder);
app.post("/approvedOrder/:id", approvedOrder);
app.post("/closeOrder/:id", closeOrder);
app.post("/order/:id", getOrderData);
app.post("/changeOrderStatus/:id", changeOrderStatus);

//Drivers
app.post("/addDriver", addDriver);
app.post("/addDriverToOrder/:id", addDriverToOrder);
app.get("/drivers", getAllDrivers);
app.post("/driver/:id", getDriverData);
app.post("/dismissDriver/:id", dismissDriver);
app.post("/paySalary/:id", paySalary);
app.post("/updateDriver/:id", updateDriver);
app.get("/employedDrivers", getEmployedDrivers);

exports.api = functions.region('europe-central2').https.onRequest(app);