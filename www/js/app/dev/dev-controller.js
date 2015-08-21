'use strict';
angular.module('devController', [])
	.controller('devCtrl', ['$scope', '$log', '$timeout', '$ionicPopup', 'apiServices', devCtrlFn]);

function devCtrlFn($scope, $log, $timeout, $ionicPopup, apiServices) {
	$log.log('devCtrl called!');
	$scope.vm = [];
	$scope.count = 1;
	$scope.pushSms = function (pIndex, cIndex) {
		//$log.log('pIndex', pIndex, '; cIndex', cIndex);
		//$log.log('selected sms : ', $scope.vm[pIndex].smsList[cIndex].sms);
		$ionicPopup.alert({
			title: $scope.vm[pIndex].category,
			template: $scope.vm[pIndex].smsList[cIndex].sms
		}).then(function (res) {
			//alert('Popup closed!');
		});
	};
	apiServices.getDevListData().then(function (response) {
		$scope.vm = response.smsData;
	});
}