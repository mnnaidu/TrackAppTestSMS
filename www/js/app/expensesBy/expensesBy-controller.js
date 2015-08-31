'use strict';
angular.module('expensesByController', [])
	.controller('expensesByAccCtrl', ['$scope', '$log', '$timeout', 'apiServices', 'couchbase','$stateParams', expensesByAccCtrlFn])
    .controller('expensesByDateCtrl', ['$scope', '$log', '$timeout', 'apiServices', 'couchbase','$stateParams', expensesByDateCtrlFn]);

function expensesByAccCtrlFn($scope, $log, $timeout, apiServices, couchbase, $stateParams) {
	$log.log('expensesCtrl called!');
	$scope.expensesByAccount = [];
    $scope.accNo = $stateParams.accNo;
	$timeout(function(){
		renderExpensesByAcc($scope.accNo);
	}, 2000);
	
	var renderExpensesByAcc = function (accNo) {
		apiServices.getExpensesByAccData(accNo).then(function (response) {
			$scope.expensesByAccount = _.has(response, 'data') && _.has(response.data, 'expensesByAccount') ? response.data.expensesByAccount : [];
		});
	};
	$scope.$on('$ionicView.enter', function (e) {
        renderExpensesByAcc($scope.accNo);
	});

}

function expensesByDateCtrlFn($scope, $log, $timeout, apiServices, couchbase, $stateParams) {
	$log.log('expensesCtrl called!');
	$scope.expensesByDate = [];
    var dateVal = $stateParams.date;
    var monthYear = dateVal.split('-');
    $scope.month = dateutil.format(new Date(monthYear[1], monthYear[0], 1), 'M');
    $scope.year = monthYear[1];
	$timeout(function(){
		renderExpensesByDate(dateVal);
	}, 2000);
	
	var renderExpensesByDate = function (date) {
		apiServices.getExpensesByDateData(date).then(function (response) {
			$scope.expensesByDate = _.has(response, 'data') && _.has(response.data, 'expensesByDate') ? response.data.expensesByDate : [];
		});
	};
	$scope.$on('$ionicView.enter', function (e) {
        renderExpensesByDate(dateVal);
	});

}