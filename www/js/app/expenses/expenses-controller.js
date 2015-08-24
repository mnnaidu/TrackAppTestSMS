'use strict';
angular.module('expensesController', [])
	.controller('expensesCtrl', ['$scope', '$log', '$timeout', 'apiServices', expensesCtrlFn]);

function expensesCtrlFn($scope, $log, $timeout, apiServices) {
	$log.log('expensesCtrl called!');
	$scope.timeoutCalled = 0;
	$scope.expensesGraphData = {};
	$scope.recendSpends = [];
	$scope.spendsByAccount = [];
	var width, height, screenRatio, realWidth, realHeight, margin, padding, x, y, xAxis, yAxis, graph, color;
	$scope.$on('$ionicView.enter', function (e) {
		if (!$scope.timeoutCalled) {
			$timeout(timeoutCbFn, 100);
		} else {
			if (document.getElementById('expenses-graph').innerHTML === '') {
				renderExpensesGraph();
			} else {
				updateExpensesGraphData();
			}
		}
	});

	$scope.$on('updateExpenses', function (e) {
		apiServices.getExpensesGraphData().then(function (response) {
			$scope.expensesGraphData = _.has(response, 'data') ? response.data : {
				barData: []
			};
			updateExpensesGraphData();
		});
		apiServices.getExpensesListData().then(function (response) {
			$scope.recendSpends = _.has(response, 'data') && _.has(response.data, 'recendSpends') ? response.data.recendSpends : [];
			$scope.spendsByAccount = _.has(response, 'data') && _.has(response.data, 'spendsByAccount') ? response.data.spendsByAccount : [];
		});
	});

	function timeoutCbFn() {
		$scope.timeoutCalled = !0;
		apiServices.getExpensesGraphData().then(function (response) {
			$scope.expensesGraphData = _.has(response, 'data') ? response.data : {
				barData: []
			};
			renderExpensesGraph();
		});
		apiServices.getExpensesListData().then(function (response) {
			$scope.recendSpends = _.has(response, 'data') && _.has(response.data, 'recendSpends') ? response.data.recendSpends : [];
			$scope.spendsByAccount = _.has(response, 'data') && _.has(response.data, 'spendsByAccount') ? response.data.spendsByAccount : [];
		});
	}

	function renderExpensesGraph() {
		width = screen.height,
			height = screen.width;
		if (width > height) {
			realWidth = width;
			realHeight = height;
			screenRatio = (height / width);
		} else {
			realWidth = height;
			realHeight = width;
			screenRatio = (width / height);
		}
		if (isNaN(screenRatio)) {
			if (window.innerHeight > window.innerWidth) {
				realWidth = window.innerHeight;
				realHeight = window.innerWidth;
				screenRatio = (window.innerWidth / window.innerHeight);
			} else {
				realWidth = window.innerWidth;
				realHeight = window.innerHeight;
				screenRatio = (window.innerHeight / window.innerWidth);
			}
		}
		margin = {
				top: 30,
				left: 10,
				bottom: 30,
				right: 10
			},
			padding = 30,
			width = window.innerWidth - margin.left - margin.right,
			height = 300 - margin.top - margin.bottom;

		x = d3.scale.ordinal()
			.rangeRoundBands([0, width], .4);
		y = d3.scale.linear()
			.range([height, 0]);

		xAxis = d3.svg.axis()
			.scale(x)
			.orient('bottom')
			.outerTickSize(0);
		yAxis = d3.svg.axis()
			.scale(y)
			.orient('left');


		graph = d3.select('.graph-container.expenses')
			.select('.graph.expenses')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
			.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

		color = d3.scale.ordinal()
			.range(['#e3e3e3', '#fff']);

		x.domain($scope.expensesGraphData.barData.map(function (d) {
			return d.month;
		}));
		y.domain([0, d3.max($scope.expensesGraphData.barData, function (d) {
			return d.expenses;
		})]);

		graph.append('g')
			.attr('class', 'axis x-axis')
			.attr('transform', 'translate(0, ' + height + ')')
			.call(xAxis);

		graph.selectAll('.rect-bar')
			.data($scope.expensesGraphData.barData)
			.enter()
			.append('rect')
			.on('click', function () {
				var _t = d3.select(this);
				var currClass = _t.attr('class');
				if (currClass.indexOf('activeBar') !== -1) {
					$log.log('already active');
					return false;
				} else {
					d3.selectAll('.expenses rect.rect-bar')
						.attr('class', 'rect-bar');
					_t.attr('class', 'rect-bar activeBar');
				}
			})
			.attr('class', function (d) {
				return 'rect-bar' + (d.selected ? ' activeBar' : '');
			})
			.attr('width', x.rangeBand())
			.attr('height', 0)
			.attr('x', function (d) {
				return x(d.month);
			})
			.attr('y', height)
			.transition()
			.delay(function (d, i) {
				return i * 50;
			})
			.duration(300)
			.ease("linear")
			.attr('y', function (d) {
				return y(d.expenses);
			})
			.attr('height', function (d) {
				return height - y(d.expenses);
			});

		graph.selectAll('.rect-bar-label')
			.data($scope.expensesGraphData.barData)
			.enter()
			.append('text')
			.attr('class', 'rect-bar-label')
			.attr('x', function (d) {
				return x(d.month) + 15 - (d.expenses.toString().length * 3);
			})
			.attr('y', height - 10)
			.text(function (d) {
				return d.expenses;
			})
			.transition()
			.delay(function (d, i) {
				return i * 50;
			})
			.duration(300)
			.ease("linear")
			.attr('y', function (d) {
				return y(d.expenses) - 10;
			});
	}

	function updateExpensesGraphData() {
		x.domain($scope.expensesGraphData.barData.map(function (d) {
			return d.month;
		}));
		y.domain([0, d3.max($scope.expensesGraphData.barData, function (d) {
			return d.expenses;
		})]);

		var graph = d3.select('.graph.expenses');

		d3.select('.axis.x-axis')
			.transition()
			.duration(500)
			.call(xAxis);

		var bars = graph.selectAll('.rect-bar').data($scope.expensesGraphData.barData);
		bars.transition()
			.delay(function (d, i) {
				return i * 50;
			})
			.duration(300)
			.ease("linear")
			.attr('class', function (d) {
				return 'rect-bar' + (d.selected ? ' activeBar' : '');
			})
			.attr('x', function (d) {
				return x(d.month);
			})
			.attr('y', function (d) {
				return y(d.expenses);
			})
			.attr('height', function (d) {
				return height - y(d.expenses);
			});
		var labels = graph.selectAll('.rect-bar-label').data($scope.expensesGraphData.barData);
		labels.transition()
			.delay(function (d, i) {
				return i * 50;
			})
			.duration(300)
			.ease("linear")
			.attr('x', function (d) {
				return x(d.month) + 15 - (d.expenses.toString().length * 3);
			})
			.attr('y', function (d) {
				return y(d.expenses) - 10;
			})
			.text(function (d) {
				return d.expenses;
			});
	}
}