'use strict';
angular.module('money-tracker', ['ionic', 'controllers', 'services'])
	.run(['$ionicPlatform', '$rootScope', '$log', function ($ionicPlatform, $rootScope, $log) {
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
				appDbName = 'sms',
				scope = $rootScope;

			function setupDb(db, cb) {
				db.get(function (err, res, body) {
					$log.log(JSON.stringify(['before create db put', err, res, body]));
					db.put(function (err, res, body) {
						db.get(cb)
					})
				})
			};

			function setupViews(db, cb) {
				var design = '_design/expenseTrackNew';
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
									currency: doc.amount.currency,
									accType: doc.accType
								});
							}.toString(),
							reduce: function (keys, values, rereduce) {
								var response = {
									'account': 0,
									'merchant': 0,
									'sum': 0,
									'accType': 0,
									'atmTransCount': 0
								};
								for (i = 0; i < values.length; i++) {
									response.sum = response.sum + values[i].amount;
									response.merchant = values[i].merchant;
									response.account = values[i].account;
									response.accType = values[i].accType;
									if (values[i].accType === 'DEBIT-CASH') {
										response.atmTransCount += 1;
									}
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
							}.toString()
						},
						expensesByAccount: {
							map: function (doc) {
								if (doc.trackType == 'expense' && doc.date && doc.merchant && doc.amount) {
									emit([doc.account], {
										account: doc.account,
										merchant: doc.merchant,
										amount: doc.amount.value,
										currency: doc.amount.currency,
										accType: doc.accType,
										date: doc.date
									});
								}
							}.toString()
						}
					}
				}, function () {
					cb(false, db([design, '_view']))
				})
			}
			if (!_.isUndefined(window.cblite)) {
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
						msg: smsData.body,
						sender: 'AM-ICICIB' // TODO fix the address once we decide to test with provider. - ARUL
					}
					smsReader.parse(smsData, function (transactionData) {
						config.db.post(transactionData, function (err, ok) {
							scope.$broadcast('updateExpenses');
							$log.log('updateExpenses event broadcasted!');
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
			})
			.state('app.rating', {
				url: '/rating',
				views: {
					'tab-dev': {
						templateUrl: 'js/app/rating/rating.html',
						controller: 'ratingCtrl'
					}
				}
			})
			.state('app.rating1', {
				url: '/rating1',
				views: {
					'tab-dev': {
						templateUrl: 'js/app/rating/rating1.html',
						controller: 'rating1Ctrl'
					}
				}
			})
			.state('app.rating1_1', {
				url: '/rating1_1',
				views: {
					'tab-dev': {
						templateUrl: 'js/app/rating/rating1_1.html',
						controller: 'ratingCtrl'
					}
				}
			})
			.state('app.rating2', {
				url: '/rating2',
				views: {
					'tab-dev': {
						templateUrl: 'js/app/rating/rating2.html',
						controller: 'rating2Ctrl'
					}
				}
			})
			.state('app.rating3', {
				url: '/rating3',
				views: {
					'tab-dev': {
						templateUrl: 'js/app/rating/rating3.html',
						controller: 'rating2Ctrl'
					}
				}
			}).state('app.rating4', {
				url: '/rating4',
				views: {
					'tab-dev': {
						templateUrl: 'js/app/rating/rating4.html',
						controller: 'rating2Ctrl'
					}
				}
			}).state('app.ratingSummary', {
				url: '/ratingsummary',
				views: {
					'tab-dev': {
						templateUrl: 'js/app/rating/ratingSummary.html',
						controller: 'rating2Ctrl'
					}
				}
			}).state('app.ratingSummaryA', {
				url: '/ratingsummaryA',
				views: {
					'tab-dev': {
						templateUrl: 'js/app/rating/ratingSummaryA.html',
						controller: 'rating2Ctrl'
					}
				}
			}).state('app.ratingNotAvailable', {
				url: '/ratingna',
				views: {
					'tab-dev': {
						templateUrl: 'js/app/rating/ratingNotAvailable.html',
						controller: 'rating2Ctrl'
					}
				}
			}).state('loanpay', {
				url: '/loanpay',
                templateUrl: 'js/app/rating/loanPay.html',
                controller: 'rating2Ctrl'
			}).state('app.ratingNotAvailable1', {
				url: '/ratingna1',
				views: {
					'tab-dev': {
						templateUrl: 'js/app/rating/ratingNotAvailable1.html',
						controller: 'rating2Ctrl'
					}
				}
			}).state('app.ratingNotAvailable2', {
				url: '/ratingna2',
				views: {
					'tab-dev': {
						templateUrl: 'js/app/rating/ratingNotAvailable2.html',
						controller: 'rating2Ctrl'
					}
				}
			}).state('app.ratingNotAvailable3', {
				url: '/ratingna3',
				views: {
					'tab-dev': {
						templateUrl: 'js/app/rating/ratingNotAvailable3.html',
						controller: 'rating2Ctrl'
					}
				}
			}).state('expensePattern', {
				url: '/expensepattern',
                templateUrl: 'js/app/rating/expensePattern.html',
                controller: 'rating2Ctrl'
			}).state('ratingForm', {
				url: '/ratingform',
                templateUrl: 'js/app/rating/ratingForm.html',
                controller: 'rating2Ctrl'
			}).state('ratingForm2', {
				url: '/ratingform2',
                templateUrl: 'js/app/rating/ratingForm2.html',
                controller: 'rating2Ctrl'
			}).state('app.ratingReqestDone', {
				url: '/ratingrequestdone',
				views: {
					'tab-dev': {
						templateUrl: 'js/app/rating/ratingRequestDone.html',
						controller: 'rating2Ctrl'
					}
				}
			}).state('app.ratingReqestDone1', {
				url: '/ratingrequestdone1',
				views: {
					'tab-dev': {
						templateUrl: 'js/app/rating/ratingRequestDone1.html',
						controller: 'rating2Ctrl'
					}
				}
			}).state('app.ratingReqestDone2', {
				url: '/ratingrequestdone2',
				views: {
					'tab-dev': {
						templateUrl: 'js/app/rating/ratingRequestDone2.html',
						controller: 'rating2Ctrl'
					}
				}
			}).state('newBudget', {
				url: '/newbudget',
                templateUrl: 'js/app/rating/newBudget.html',
                controller: 'rating2Ctrl'
			}).state('app.ratingEndorse', {
				url: '/ratingendorse',
				views: {
					'tab-dev': {
						templateUrl: 'js/app/rating/ratingEndorse.html',
						controller: 'rating2Ctrl'
					}
				}
			}).state('app.recomendations', {
				url: '/recomendations',
				views: {
					'tab-dev': {
						templateUrl: 'js/app/rating/recomendations.html',
						controller: 'rating2Ctrl'
					}
				}
			}).state('app.recomendations2', {
				url: '/recomendations2',
				views: {
					'tab-dev': {
						templateUrl: 'js/app/rating/recomendations2.html',
						controller: 'rating2Ctrl'
					}
				}
			}).state('app.recomendations3', {
				url: '/recomendations3',
				views: {
					'tab-dev': {
						templateUrl: 'js/app/rating/recomendations3.html',
						controller: 'rating2Ctrl'
			         }
                }
            }).state('app.endorse', {
				url: '/endorse',
				views: {
					'tab-dev': {
						templateUrl: 'js/app/rating/endorse.html',
						controller: 'rating2Ctrl'
			         }
                }
            }).state('app.recomendations4', {
				url: '/recomendations4',
				views: {
					'tab-dev': {
						templateUrl: 'js/app/rating/recomendations4.html',
						controller: 'rating2Ctrl'
			         }
                }
            }).state('app.recomendationsAll', {
				url: '/recomendationsAll',
				views: {
					'tab-recomendation': {
						templateUrl: 'js/app/rating/recomendations3.html',
						controller: 'rating2Ctrl'
					}
				}
			}).state('app.expensesByAcc', {
				url: '/expenseByAcc/:accNo',
				views: {
					'tab-expenses': {
						templateUrl: 'js/app/expensesBy/expensesByAcc.html',
						controller: 'expensesByAccCtrl'
					}
				}
			}).state('app.expensesByDate', {
				url: '/expenseByDate/:date',
				views: {
					'tab-expenses': {
						templateUrl: 'js/app/expensesBy/expensesByDate.html',
						controller: 'expensesByDateCtrl'
					}
				}
			});
		$urlRouterProvider.otherwise('/app/ratingna');
	});