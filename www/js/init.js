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