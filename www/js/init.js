'use strict';
angular.module('money-tracker', ['ionic', 'controllers', 'services'])
	.run(['$ionicPlatform', '$log', function ($ionicPlatform, $log) {
		$ionicPlatform.ready(function () {
			if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
				cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
				cordova.plugins.Keyboard.disableScroll(true);
			}
			if (window.statusBar) {
				StatusBar.styleLightContent();
			}
			/* Init Couch DB */
			var coax = require('coax'),
				appDbName = 'sms';

			function setupDb(db, cb) {
				db.get(function (err, res, body) {
					$log.log(JSON.stringify(['before create db put', err, res, body]))
					db.put(function (err, res, body) {
						db.get(cb)
					})
				})
			};

			function setupViews(db, cb) {
				var design = '_design/expenseTrackNew'
				db.put(design, {
					views: {
						expenseTrackListsNew: {
							map: function (doc) {
								if (doc.trackType == 'expense' && doc.date && doc.merchant && doc.amount) {
									emit([doc.date.year, doc.date.month, doc.date.date], doc);
								}
							}.toString()
						},
						expenseTrackByAccount: {
							map: function (doc) {
								emit([doc.account, doc.merchant], {
									account: doc.account,
									merchant: doc.merchant,
									amount: doc.amount.value,
									currency: doc.amount.currency
								});
							}.toString(),
							reduce: function (keys, values, rereduce) {
								var response = {
									'account': 0,
									'merchant': 0,
									'sum': 0
								};
								for (i = 0; i < values.length; i++) {
									response.sum = response.sum + values[i].amount;
									response.merchant = values[i].merchant;
									response.account = values[i].account;
								}
								return response;
							}.toString()
						},
						expenseTrackByDate: {
							map: function (doc) {
								emit([doc.date.year, doc.date.month, doc.date.date], doc);
							}.toString(),
							reduce: function (keys, values, rereduce) {
								var response = {
									'totalExpenses': 0
								};
								for (i = 0; i < values.length; i++) {
									response.totalExpenses = response.totalExpenses + values[i].amount.value;
									response.year = values[i].date.year;
									response.month = values[i].date.month;
									response.date = values[i].date.date;
								}
								return response;
							}.toString()
						},
						expenseBillRemainder: {
							map: function (doc) {
								if (doc.trackType == 'remainder' && doc.dueDate && doc.dueDate.year && doc.dueDate.month && doc.dueDate.date) {
									emit([doc.dueDate.year, doc.dueDate.month, doc.dueDate.date], doc);
								}
							}.toString(),
						}
					}
				}, function () {
					cb(false, db([design, '_view']))
				})
			}
			if (!_.isUndefined(cblite)) {
				cblite.getURL(function (err, url) {
					if (err) {
						$log.log('db not initialized');
					} else {
						//window.server = coax(url);
						var db = coax([url, appDbName]);
						var setUpDbCb = function (err, info) {
							if (err) {
								$log.log('err', err, info);
							} else {
								setupViews(db, function (err, views) {
									if (err) {
										$log.log('err views', err)
									} else {
										$log.log('views success');
										window.config = {
											db: db,
											s: coax(url),
											views: views
										};
										return config;
									}
								});
							}
						};
						setupDb(db, setUpDbCb);
					}
				});
			} else {
				$log.log('cblite not intilized');
			}

			function insertTranData(smsData) {
				if (smsReader) {
					var smsData = {
						//sender : smsData.address,
						//msg: smsData.body
						sender: 'AM-ICICIB',
						msg: 'Dear Customer, You have made a Debit Card purchase of INR300.00 on 15 Jul. Info.VPS*MADHUS SERV. Your Net Available Balance is INR XXXXX.'
					}
					smsReader.parse(smsData, function (transactionData) {
						debugger;
						transactionData.trackType = 'expense';
						config.db.post(transactionData, function (err, ok) {
							$log.log('inserted successfully > ', arguments);
						});
					}, function (e) {
						$log.log('error while parse ', e);
					});
				} else {
					$log.log('smsReader not intilized ');
				}
			}
			if (!_.isUndefined(navigator.smsrec)) {
				$log.log('sms Plugin intilized');
				navigator.smsrec.startReception(function (data) {
					insertTranData(data)
				}, function (err) {
					$log.log(err)
				});
			} else {
				$log.log('sms Plugin not intilized');
			}
		});
	}])
	.config(['couchbaseProvider', function (couchbaseProvider) {
		couchbaseProvider.setDbName('sms');
		couchbaseProvider.setDevUrl('http://localhost:8081/');
	}])
	.config(function ($stateProvider, $urlRouterProvider) {
		$stateProvider
			.state('app', {
				url: '/app',
				abstract: true,
				templateUrl: 'js/app.html'
			})
			.state('app.expenses', {
				url: '/expenses',
				views: {
					'tab-expenses': {
						templateUrl: 'js/app/expenses/expenses.html',
						controller: 'expensesCtrl'
					}
				}
			})
			.state('app.income', {
				url: '/income',
				views: {
					'tab-income': {
						templateUrl: 'js/app/income/income.html',
						controller: 'incomeCtrl'
					}
				}
			})
			.state('app.dev', {
				url: '/dev',
				views: {
					'tab-dev': {
						templateUrl: 'js/app/dev/dev.html',
						controller: 'devCtrl'
					}
				}
			});
		$urlRouterProvider.otherwise('/app/expenses');
	});