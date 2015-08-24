angular.module('services', [])
	.factory('apiServices', ['$http', '$timeout', '$q', '$log', '$timeout', apiServicesFn]);

function apiServicesFn($http, $timer, $q, $log, $timeout) {
	$log.log('apiService initialized!');
	function timeSince(date) {
		var seconds = Math.floor((new Date() - date) / 1000);
		var interval = Math.floor(seconds / 31536000);
		if (interval > 1) {
			return interval + " years";
		}
		interval = Math.floor(seconds / 2592000);
		if (interval > 1) {
			return interval + " months";
		}
		interval = Math.floor(seconds / 86400);
		if (interval > 1) {
			return interval + " days";
		}
		interval = Math.floor(seconds / 60 * 60);
		if (interval > 1) {
			return interval + " hours";
		}
		interval = Math.floor(seconds / 60);
		if (interval > 1) {
			return interval + " minutes";
		}
		return Math.floor(seconds) + " seconds";
	}
	var getExpensesGraphData = function () {
		var data = [];
		var deferred = $q.defer();
		$timeout(function () {
			if (window.config) {
				config.db(["_design/expenseTrackNew", "_view"])(["expenseTrackByDate", {
					group_level: 2
				}], function (err, response) {
					if (err) {
						$log.log('Error while querying DB', err);
						deferred.reject(err);
					} else {
						var rows = _.has(response, 'rows') ? response.rows : [];
						var cDate = new Date();
						var cYear = cDate.getFullYear();
						var cMonth = cDate.getMonth() + 1;
						var retMonArr = [];
						for (i = 6; i > 0; i--) {
							if (cMonth < 6) {
								retMonArr.push({
									y: cMonth - i < 0 ? cYear - 1 : cYear,
									m: cMonth - i < 0 ? 12 + (cMonth + 1 - i) : cMonth + 1 - i
								});
							} else {
								retMonArr.push({
									y: cYear,
									m: cMonth + 1 - i
								});
							}
						}
						_.each(retMonArr, function (v, i) {
							var expYear = v.y;
							var expMonth = v.m;
							var hasData = 0;
							_.every(rows, function (row, i) {
								var key = _.has(row, 'key') ? row.key : [];
								var value = _.has(row, 'value') ? row.value : {};
								if (key.length > 0 && key[0] === expYear) {
									var month = _.has(value, 'month') ? value.month : null;
									var totalExpenses = _.has(value, 'totalExpenses') ? value.totalExpenses : null;
									if (expMonth === month) {
										hasData = !0;
										data.push({
											selected: cMonth === month,
											expenses: totalExpenses,
											month: dateutil.format(new Date(cYear, month, 1), 'M')
										});
										return false;
									}
								}
								return true;
							});
							if (!hasData) {
								data.push({
									selected: cMonth === expMonth,
									expenses: 0,
									month: dateutil.format(new Date(expYear, expMonth, 1), 'M')
								});
							}
						});
						deferred.resolve({
							data: {
								barData: data
							}
						});
					}
				});
			} else {
				$log.log('window.config not available');
				deferred.reject('window.config not available');
			}
		}, 2000);
		/*$http.get("js/app/expenses/expenses.json")
			.success(function (response) {
				$log.log("Expenses Data", response);

				deferred.resolve({
					data: response
				});
			})
			.error(function (error) {
				$log.log("Expenses Error", error);
				deferred.reject(error);
			});*/
		return deferred.promise;
	};
	var getExpensesListData = function () {
		var spendsByAccounts = [];
		var recentSpends = [];
		var byAcc = false,
			recent = false;
		var deferred = $q.defer();
		$timeout(function () {
			if (window.config) {
				// Recent Spends
				config.db(["_design/expenseTrackNew", "_view"])(["expenseTrackListsNew", {
					descending: true
				}], function (err, response) {
					if (err) {
						$log.log('Error while querying DB', err);
						deferred.reject(err);
					} else {
						var rows = _.has(response, 'rows') ? response.rows : [];
						_.every(rows, function (row, i) {
							var key = _.has(row, 'key') ? row.key : [];
							var value = _.has(row, 'value') ? row.value : {};
							var accType = _.has(value, 'accType') ? value.accType : '';
							var merchant = _.has(value, 'merchant') ? value.merchant : '';
							var date = _.has(value, 'date') ? value.date : '';
							var expense = _.has(value, 'amount') && _.has(value.amount, 'value') ? value.amount.value : 0;
							if (expense > 0) {
								recentSpends.push({
									merchant: merchant,
									dateTime: date,
									expense: expense,
									accType: 'CREDIT',
									ATM: false
								});
							}
							return ! (recentSpends.length === 3);
						});
						$log.log('recentSpends', recentSpends);
						recent = true;
						callResolve();
					}
				});
				// Spends By Accounts
				config.db(["_design/expenseTrackNew", "_view"])(["expenseTrackByAccount", {
					group_level: 1
				}], function (err, response) {
					if (err) {
						$log.log('Error while querying DB', err);
						deferred.reject(err);
					} else {
						var rows = _.has(response, 'rows') ? response.rows : [];
						_.each(rows, function (row, i) {
							var key = _.has(row, 'key') ? row.key : [];
							var value = _.has(row, 'value') ? row.value : {};
							var account = _.has(value, 'account') ? value.account : '';
							var totalExpenses = _.has(value, 'sum') ? value.sum : 0;
							if (account !== '') {
								spendsByAccounts.push({
									accName: 'ICICI CREDIT',
									accNo: account.substr(account.length - 4),
									expenses: totalExpenses,
									accType: 'CREDIT',
									ATM: false,
									ATMTrans: 0
								});
							}
						});
						$log.log('spendsByAccounts', spendsByAccounts);
						byAcc = true;
						callResolve();
					}
				});
			} else {
				$log.log('window.config not available');
				deferred.reject('window.config not available');
			}
		}, 2000);
		function callResolve() {
			if(byAcc && recent) {
				deferred.resolve({
					data: {
						recendSpends: recentSpends,
						spendsByAccount: spendsByAccounts
					}
				});
			}
		}
		/*$http.get("js/app/expenses/expensesList.json")
			.success(function (response) {
				$log.log("Expenses List Data", response);
				deferred.resolve({
					data: response
				});
			})
			.error(function (error) {
				$log.log("Expenses List Error", error);
				deferred.reject(error);
			});*/
		return deferred.promise;
	};
	var getIncomeGraphData = function () {
		var deferred = $q.defer();
		$http.get("js/app/income/income.json")
			.success(function (response) {
				$log.log("Income Data", response);
				deferred.resolve(response);
			})
			.error(function (error) {
				$log.log("Income Error", error);
				deferred.reject(error);
			});
		return deferred.promise;
	};
	var getIncomeListData = function () {
		var deferred = $q.defer();
		$http.get("js/app/income/incomeList.json")
			.success(function (response) {
				$log.log("Income List Data", response);
				deferred.resolve(response);
			})
			.error(function (error) {
				$log.log("Income List Error", error);
				deferred.reject(error);
			});
		return deferred.promise;
	};
	var getDevListData = function () {
		var deferred = $q.defer();
		$http.get("js/app/dev/devList.json")
			.success(function (response) {
				$log.log("Dev List Data", response);
				deferred.resolve(response);
			})
			.error(function (error) {
				$log.log("Dev List Error", error);
				deferred.reject(error);
			});
		return deferred.promise;
	};
	return {
		getExpensesGraphData: getExpensesGraphData,
		getExpensesListData: getExpensesListData,
		getIncomeGraphData: getIncomeGraphData,
		getIncomeListData: getIncomeListData,
		getDevListData: getDevListData,
	};
}