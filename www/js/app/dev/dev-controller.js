'use strict';
angular.module('devController', [])
	.controller('devCtrl', ['$scope', '$log', '$timeout', '$ionicPopup', 'apiServices', devCtrlFn]);

function devCtrlFn($scope, $log, $timeout, $ionicPopup, apiServices) {
	$log.log('devCtrl called!');
	$scope.vm = [];
	$scope.count = 1;
	$scope.smsData = {};
	$scope.transactionData = {};
	$scope.pushSms = function (pIndex, cIndex) {
		//$log.log('pIndex', pIndex, '; cIndex', cIndex);
		//$log.log('selected sms : ', $scope.vm[pIndex].smsList[cIndex].sms);
		$ionicPopup.alert({
			title: $scope.vm[pIndex].category,
			template: $scope.vm[pIndex].smsList[cIndex].sms
		}).then(function (res) {
			//alert('Popup closed!');
		});
		
		//call couch db functions to store the SMS
		$scope.smsData = {
			sender: 'AM-ICICIB',
			msg: $scope.vm[pIndex].smsList[cIndex].sms
		};
		smsReader.parse($scope.smsData, function(transactionData) {
			$log.log("after parse", transactionData);
			$scope.transactionData = transactionData;
			$scope.transactionData.trackType = _.has(transactionData, 'trackType') ? transactionData.trackType : 'expense';
			config.db.post($scope.transactionData, function(err, ok) {
				$log.log("inserted successfully");
				$log.log('err: ', err);
				$log.log('ok: ', ok);
			});
		}, function(e) {
			$log.log("error while parse ", e);
			$scope.transactionData = {};
			$scope.error = e;
		});


		$scope.doParse = function() {
			$log.log('Doing  parsing', $scope.smsData);

			var doc = { desc : "test", amount : 1000 };
			doc.type = "expense"
			config.db.post(doc, function(err, ok) {
				$log.log("inserted successfully");
			});

		};
	};
	apiServices.getDevListData().then(function (response) {
		$scope.vm = response.smsData;
	});
}