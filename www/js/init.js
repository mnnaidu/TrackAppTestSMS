'use strict';
angular.module('money-tracker', ['ionic', 'controllers', 'services'])
	.run(function ($ionicPlatform) {
		$ionicPlatform.ready(function () {
			if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
				cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
				cordova.plugins.Keyboard.disableScroll(true);
			}
			if (window.statusBar) {
				StatusBar.styleLightContent();
			}
			
			/* Init Couch DB */
			var coax = require("coax"),
				appDbName = "sms";

			function setupDb(db, cb) {
				db.get(function(err, res, body){
					console.log(JSON.stringify(["before create db put", err, res, body]))
					db.put(function(err, res, body){
						db.get(cb)
					})
				})
			};
			
			function setupViews(db,cb) {
				var design = "_design/expenseTrackNew"
				db.put(design, {
					views : {
						expenseTrackListsNew : {
							map : function(doc) {
								if (doc.trackType == "expense" && doc.date && doc.merchant && doc.amount) {
									emit(doc.date, doc);
								}
							}.toString()
						}
					}
				}, function(){
					cb(false, db([design, "_view"]))
				});
			};

			if (cblite) {
				cblite.getURL(function(err, url) {
					if (err) {
						console.log('db not initialized');
					} else {
						window.server = coax(url);
						var db = coax([url, appDbName]);
						var setUpDbCb = function(err, info) {
							if (err) {
								console.log('err', err, info);
							} else {
								setupViews(db, function(err, views) {
									if (err) {
										console.log('err views')
									} else {
										console.log('views success');
										window.config = {
											db: db,
											s: coax(url),
											views : views
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
				console.log('cblite not intilized');
			}

		});
	})
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
	})