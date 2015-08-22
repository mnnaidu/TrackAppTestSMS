angular.module('services', [])
	.factory('apiServices', ['$http', '$timeout', '$q', '$log', '$timeout', apiServicesFn]);
function apiServicesFn($http, $timer, $q, $log, $timeout) {
	$log.log('apiService initialized!');
	var getExpensesGraphData = function () {
		
		$timeout(function() {
			$log.log("inside time out");
			if(window.config) {  
				config.views(["expenseTrackListsNew" , {descending : true}], function(err, expenseTrackListView) {
					$log.log("expenseTrackListsNew",expenseTrackListView);
				});
			}
		},2000);
		
		
		var deferred = $q.defer();
		$http.get("js/app/expenses/expenses.json")
			.success(function (response) {
			$log.log("Expenses Data", response);
			deferred.resolve(response);
		})
			.error(function (error) {
			$log.log("Expenses Error", error);
			deferred.reject(error);
		});
		return deferred.promise;
	};
	var getExpensesListData = function () {
		var deferred = $q.defer();
		$http.get("js/app/expenses/expensesList.json")
			.success(function (response) {
			$log.log("Expenses List Data", response);
			deferred.resolve(response);
		})
			.error(function (error) {
			$log.log("Expenses List Error", error);
			deferred.reject(error);
		});
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