angular.module('starter.provider', [])

.provider();

angular.module('services', [])
	.provider('couchbase', function () {
		var dbName,
			devUrl;

		function Couchbase($http) {
			var url,
				db,
				getConnectionString = function () {
					return url + db + '/';
				};
			this.get = function (key) {
				return $http.get(getConnectionString() + key);
			};
			this.post = function (key, objectToPut) {
				return $http.post(getConnectionString() + key, objectToPut);
			};
			this.put = function (key, objectToPut) {
				return $http.put(getConnectionString() + key, objectToPut);
			};
			this.delete = function (key) {
				return $http.delete(getConnectionString() + key);
			};
			this.getUrl = function () {
				return url;
			};
			this.setUrl = function (value) {
				url = value;
			};
			this.getDbName = function () {
				return url;
			};
			this.setDbName = function (value) {
				db = value;
			};
			this.createDb = function () {
				return $http.put(url + db);
			}
		};

		this.setDevUrl = function (value) {
			devUrl = value;
		}

		this.setDbName = function (value) {
			dbName = value;
		};
		this.$get = ['$window', '$http', '$timeout', function ($window, $http, $timeout) {
			var couchbase = new Couchbase($http);

			$timeout(function () {
				if ($window.cblite) {
					$window.cblite.getURL(
						function (err, url) {
							if (err) {
								couchbase.setUrl(err);
							} else {
								couchbase.setUrl(url);
							}

							couchbase.setDbName(dbName)
							couchbase.createDb();
						});
				} else {
					couchbase.setUrl(devUrl);
					couchbase.setDbName(dbName);
					couchbase.createDb();
				}

			}, 100);

			return couchbase;
		}];
	})
	.factory('apiServices', ['$http', '$timeout', '$q', '$log', '$timeout', apiServicesFn]);

function apiServicesFn($http, $timer, $q, $log, $timeout) {
	$log.log('apiService initialized!');

	function timeSince(date) {
		var seconds = Math.floor((new Date() - new Date(date.value)) / 1000);
		if (_.isNumber(seconds)) {
			var interval = Math.floor(seconds / (365 * 24 * 60 * 60));
			if (interval > 0) {
				return interval + ' year' + (interval > 1 ? 's' : '') + ' ago';
			}
			interval = Math.floor(seconds / (30 * 24 * 60 * 60));
			if (interval > 0) {
				return interval + ' month' + (interval > 1 ? 's' : '') + ' ago';
			}
			interval = Math.floor(seconds / (24 * 60 * 60));
			if (interval > 0) {
				return interval + ' day' + (interval > 1 ? 's' : '') + ' ago';
			}
			interval = Math.floor(seconds / (60 * 60));
			if (interval > 0) {
				return interval + ' hour' + (interval > 1 ? 's' : '') + ' ago';
			}
			interval = Math.floor(seconds / 60);
			if (interval > 0) {
				return interval + ' minute' + (interval > 1 ? 's' : '') + ' ago';
			}
			return Math.floor(seconds) + ' second' + (interval > 1 ? 's' : '') + ' ago';
		}
		$log.log('Error preparing timeSince: data.value: ', date.value);
		return '';
	}
    
     function getMonthYear(date) {
        if(_.has(date, 'month') && _.has(date, 'year')) {
           return (date.month +'-'+ date.year);  
        }
        $log.log('Error preparing getMonthYear: date.month| date.year: ', date);
        return '';
    }
    
    function getDateMonthYear(date) {
        if(_.has(date, 'date') && _.has(date, 'month') && _.has(date, 'year')) {
           return (date.date +'-'+ (dateutil.format(new Date(date.year, date.month, 1), 'M')) +'-'+ date.year);  
        }
        $log.log('Error preparing getDateMonthYear: date.month| date.year: ', date);
        return '';
    }
    
	var getExpensesGraphData = function () {
		var data = [];
		var deferred = $q.defer();
		if (window.config) {
			config.db(['_design/expenseTrackNew', '_view'])(['expenseTrackByDate', {
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
						data: data
					});
				}
			});
		} else {
			$log.log('window.config not available');
			deferred.reject('window.config not available');
		}
		/*$http.get('js/app/expenses/expenses.json')
			.success(function (response) {
				$log.log('Expenses Data', response);

				deferred.resolve({
					data: response
				});
			})
			.error(function (error) {
				$log.log('Expenses Error', error);
				deferred.reject(error);
			});*/
		return deferred.promise;
	};
	var getExpensesListData = function () {
		var recentSpends = [],
			bills = [],
			spendsByAccounts = [];
		var byRecent = false,
			byBills = false,
			byAcc = false;
		var deferred = $q.defer();
		if (window.config) {
			// Recent Spends
			config.db(['_design/expenseTrackNew', '_view'])(['expenseTrackListsNew', {
				descending: true
			}], function (err, response) {
				if (err) {
					$log.log('Error while querying DB', err);
					deferred.reject(err);
				} else {
					var rows = _.has(response, 'rows') ? response.rows : [];
					_.every(rows, function (row, i) {
						$log.log('recent spends: row: ', row);
						var key = _.has(row, 'key') ? row.key : [];
						var value = _.has(row, 'value') ? row.value : {};
						var accType = _.has(value, 'accType') ? value.accType : '';
						var merchant = _.has(value, 'merchant') ? value.merchant : '';
						var date = _.has(value, 'date') ? value.date : '';
						var expense = _.has(value, 'amount') && _.has(value.amount, 'value') ? value.amount.value : 0;
						if (expense > 0) {
							recentSpends.push({
								merchant: merchant,
								dateTime: timeSince(date),
                                dateVal: getMonthYear(date),
								expense: expense,
								accType: accType,
								ATM: accType === 'DEBIT-CASH'
							});
						}
						return !(recentSpends.length === 3);
					});
					$log.log('recentSpends', recentSpends);
					byRecent = true;
					callResolve();
				}
			});
			// Bills
			config.db(['_design/expenseTrackNew', '_view'])(['expenseBillRemainder', {
				descending: true
			}], function (err, response) {
				if (err) {
					$log.log('Error while querying DB', err);
					deferred.reject(err);
				} else {
					var rows = _.has(response, 'rows') ? response.rows : [];
					_.each(rows, function (row, i) {
						$log.log('bills: row: ', row);
						var key = _.has(row, 'key') ? row.key : [];
						var value = _.has(row, 'value') ? row.value : {};
						var account = _.has(value, 'account') ? value.account : '';
						var dueDate = _.has(value, 'dueDate') ? value.dueDate : '';
						var osAmount = _.has(value, 'osAmount') && _.has(value.osAmount, 'value') ? value.osAmount.value : 0;
						var date = timeSince(dueDate);
						if (dueDate !== '' && osAmount > 0) {
							bills.push({
								accName: 'ICICI CREDIT',
								accType: 'CREDIT',
								accNo: !_.isEmpty(account) ? account.substr(account.length - 4) : '',
								amount: osAmount,
								date: !_.isEmpty(date) ? date.substr(0, date.length - 4) : ''
							});
						}
					});
					$log.log('bills', bills);
					byBills = true;
					callResolve();
				}
			});
			// Spends By Accounts
			config.db(['_design/expenseTrackNew', '_view'])(['expenseTrackByAccount', {
				group_level: 1
			}], function (err, response) {
				if (err) {
					$log.log('Error while querying DB', err);
					deferred.reject(err);
				} else {
					var rows = _.has(response, 'rows') ? response.rows : [];
					_.each(rows, function (row, i) {
						$log.log('spends by acc: row: ', row);
						var key = _.has(row, 'key') ? row.key : [];
						var value = _.has(row, 'value') ? row.value : {};
						var account = _.has(value, 'account') ? value.account : '';
						var accType = _.has(value, 'accType') ? value.accType : '';
						var totalExpenses = _.has(value, 'sum') ? value.sum : 0;
						var atmTransCount = _.has(value, 'atmTransCount') ? value.atmTransCount : 0;
						if (account !== '') {
							spendsByAccounts.push({
								accName: 'ICICI ' + (accType === 'CREDIT' ? 'CRED' : 'DEB') + 'IT',
								accNo: !_.isEmpty(account) ? account.substr(account.length - 4) : '',
                                accMask : account,
								expenses: totalExpenses,
								accType: accType,
								ATM: accType === 'DEBIT-CASH',
								ATMTrans: atmTransCount
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

		function callResolve() {
			if (byAcc && byRecent && byBills) {
				deferred.resolve({
					data: {
						recentSpends: recentSpends,
						bills: bills,
						spendsByAccount: spendsByAccounts
					}
				});
			}
		}
		/*$http.get('js/app/expenses/expensesList.json')
			.success(function (response) {
				$log.log('Expenses List Data', response);
				deferred.resolve({
					data: response
				});
			})
			.error(function (error) {
				$log.log('Expenses List Error', error);
				deferred.reject(error);
			});*/
		return deferred.promise;
	};
	var getExpensesBillsData = function () {
		var data = [];
		var deferred = $q.defer();
		if (window.config) {
			config.db(['_design/expenseTrackNew', '_view'])(['expenseBillRemainder', {
				descending: true
			}], function (err, expenseTrackListView) {
				if (err) {
					$log.log('Error while querying DB', err);
					deferred.reject(err);
				} else {
					var rows = _.has(response, 'rows') ? response.rows : [];
					deferred.resolve({
						data: {
							bills: data
						}
					});
				}
			});
		} else {
			$log.log('window.config not available');
			deferred.reject('window.config not available');
		}
		return deferred.promise;
	};
	var getIncomeGraphData = function () {
		var deferred = $q.defer();
		$http.get('js/app/income/income.json')
			.success(function (response) {
				$log.log('Income Data', response);
				deferred.resolve(response);
			})
			.error(function (error) {
				$log.log('Income Error', error);
				deferred.reject(error);
			});
		return deferred.promise;
	};
	var getIncomeListData = function () {
		var deferred = $q.defer();
		$http.get('js/app/income/incomeList.json')
			.success(function (response) {
				$log.log('Income List Data', response);
				deferred.resolve(response);
			})
			.error(function (error) {
				$log.log('Income List Error', error);
				deferred.reject(error);
			});
		return deferred.promise;
	};
	var getDevListData = function () {
		var deferred = $q.defer();
		$http.get('js/app/dev/devList.json')
			.success(function (response) {
				$log.log('Dev List Data', response);
				deferred.resolve(response);
			})
			.error(function (error) {
				$log.log('Dev List Error', error);
				deferred.reject(error);
			});
		return deferred.promise;
	};
    
    
    var getExpensesByAccData = function (accNo) {
		var expensesByAccount = [];


		var byAcc = false;
		var deferred = $q.defer();
		if (window.config) {
			// Expenses By Accounts

            /*config.db(["_design/expenseTrackNew", "_view"])(["expenseTrackByAccount", {
                reduce : false,startkey : [accNo, startMer], endkey : [accNo,endMer] */
            
            config.db(["_design/expenseTrackNew", "_view"])(["expensesByAccount", {
                key: [accNo]
            }], function (err, response) {
				if (err) {
					$log.log('Error while querying DB', err);
					deferred.reject(err);
				} else {
					var rows = _.has(response, 'rows') ? response.rows : [];
					_.each(rows, function (row, i) {
						//$log.log('spends by acc: row: ', row);
						var key = _.has(row, 'key') ? row.key : [];
						var value = _.has(row, 'value') ? row.value : {};
						var account = _.has(value, 'account') ? value.account : '';
						var accType = _.has(value, 'accType') ? value.accType : '';
                        var merchant = _.has(value, 'merchant') ? value.merchant : '';
						var amount = _.has(value, 'amount') ? value.amount : 0;
                        var date = _.has(value, 'date') ? value.date : '';
						var atmTransCount = _.has(value, 'atmTransCount') ? value.atmTransCount : 0;
						if (account !== '') {
							expensesByAccount.push({
								accName: 'ICICI ' + (accType === 'CREDIT' ? 'CRED' : 'DEB') + 'IT',
								accNo: !_.isEmpty(account) ? account.substr(account.length - 4) : '',
                                dateTime: getDateMonthYear(date),
                                accMask: account,
								expense: amount,
                                merchant:merchant,
								accType: accType,
								ATM: accType === 'DEBIT-CASH',
								ATMTrans: atmTransCount
							});
						}
					});
					$log.log('expensesByAccount', expensesByAccount);
					byAcc = true;
					callResolve();
				}
			});
		} else {
			$log.log('window.config not available');
			deferred.reject('window.config not available');
		}

		function callResolve() {
			if (byAcc) {
				deferred.resolve({
					data: {
						expensesByAccount: expensesByAccount
					}
				});
			}
		}
		return deferred.promise;
	};
    
    var getExpensesByDateData = function (dateVal) {
		var expensesByDate = [];
		var byDate = false;
        var monthYear = dateVal.split('-');
        var month = typeof monthYear[0] != 'string' ? monthYear[0] : parseInt(monthYear[0]);
        var year = typeof monthYear[1] != 'string' ? monthYear[1] : parseInt(monthYear[1]);
		var deferred = $q.defer();
		if (window.config) {
			// Expenses By Date
            config.db(["_design/expenseTrackNew", "_view"])(["expenseTrackListsNew", {
                reduce : false,startkey : [year,month,0], endkey : [year,month,31] 
            }], function (err, response) {
				if (err) {
					$log.log('Error while querying DB', err);
					deferred.reject(err);
				} else {
					var rows = _.has(response, 'rows') ? response.rows : [];
					_.each(rows, function (row, i) {
						$log.log('spends by acc: row: ', row);
						var key = _.has(row, 'key') ? row.key : [];
						var value = _.has(row, 'value') ? row.value : {};
						var account = _.has(value, 'account') ? value.account : '';
						var accType = _.has(value, 'accType') ? value.accType : '';
                        var merchant = _.has(value, 'merchant') ? value.merchant : '';
                        var date = _.has(value, 'date') ? value.date : '';
						var expense = _.has(value, 'amount') && _.has(value.amount, 'value') ? value.amount.value : 0;
						var atmTransCount = _.has(value, 'atmTransCount') ? value.atmTransCount : 0;
						if (account !== '') {
							expensesByDate.push({
								accName: 'ICICI ' + (accType === 'CREDIT' ? 'CRED' : 'DEB') + 'IT',
								accNo: !_.isEmpty(account) ? account.substr(account.length - 4) : '',
                                accMask: account,
								expense: expense,
                                merchant:merchant,
                                dateTime: getDateMonthYear(date),
								accType: accType,
								ATM: accType === 'DEBIT-CASH',
								ATMTrans: atmTransCount
							});
						}
					});
					$log.log('expensesByDate', expensesByDate);
					byDate = true;
					callResolve();
				}
			});
		} else {
			$log.log('window.config not available');
			deferred.reject('window.config not available');
		}

		function callResolve() {
			if (byDate) {
				deferred.resolve({
					data: {
						expensesByDate: expensesByDate
					}
				});
			}
		}
		return deferred.promise;

	};
    
	return {
		getExpensesGraphData: getExpensesGraphData,
		getExpensesListData: getExpensesListData,
		getExpensesBillsData: getExpensesBillsData,
		getIncomeGraphData: getIncomeGraphData,
		getIncomeListData: getIncomeListData,
		getDevListData: getDevListData,
        getExpensesByAccData: getExpensesByAccData,
        getExpensesByDateData: getExpensesByDateData
	};
}