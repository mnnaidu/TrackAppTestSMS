'use strict';
angular.module('expensesController', [])
	.controller('expensesCtrl', ['$scope', '$log', '$timeout', 'apiServices', 'couchbase', expensesCtrlFn]);

function expensesCtrlFn($scope, $log, $timeout, apiServices, couchbase) {
	$log.log('expensesCtrl called!');
	$scope.expensesGraphData = [];
	// initially load empty graph
	function initExpensesGraphFn() {
		var cDate = new Date(), cYear = cDate.getFullYear(), cMonth = cDate.getMonth() + 1, retMonArr = [];
		for (var i = 6; i > 0; i--) {
			var m, y;
			if (cMonth < 6) {
				m = cMonth - i < 0 ? 12 + (cMonth + 1 - i) : cMonth + 1 - i, y = cMonth - i < 0 ? cYear - 1 : cYear;
			} else {
				m = cMonth + 1 - i, y = cYear;
			}
			$scope.expensesGraphData.push({
				selected: cMonth === m,
				expenses: 0,
				month: dateutil.format(new Date(y, m, 1), 'M')
			});
		}
		renderExpensesGraphFn();
	}
	initExpensesGraphFn();
	$scope.recentSpends = [];
	$scope.bills = [];
	$scope.spendsByAccount = [];
	$timeout(function(){
		renderExpensesGraph();
		renderExpensesList();
	}, 2000);
	var width, height, screenRatio, realWidth, realHeight, margin, padding, x, y, xAxis, yAxis, graph, color;
	var renderExpensesGraph = function() {
		apiServices.getExpensesGraphData().then(function(response){
			$scope.expensesGraphData = _.has(response, 'data') ? response.data : [];
			if (document.getElementById('expenses-graph').innerHTML === '') {
				renderExpensesGraphFn();
			} else {
				updateExpensesGraphFn();
			}
		});
	};
	var renderExpensesList = function () {
		apiServices.getExpensesListData().then(function (response) {
			$scope.recentSpends = _.has(response, 'data') && _.has(response.data, 'recentSpends') ? response.data.recentSpends : [];
			$scope.spendsByAccount = _.has(response, 'data') && _.has(response.data, 'spendsByAccount') ? response.data.spendsByAccount : [];
			$scope.bills = _.has(response, 'data') && _.has(response.data, 'bills') ? response.data.bills : [];
		});
	};
	$scope.$on('$ionicView.enter', function (e) {
		renderExpensesGraph();
		renderExpensesList();
	});

	$scope.$on('updateExpenses', function (e) {
		renderExpensesGraph();
		renderExpensesList();
	});

	function renderExpensesGraphFn() {
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

		x.domain($scope.expensesGraphData.map(function (d) {
			return d.month;
		}));
		y.domain([0, d3.max($scope.expensesGraphData, function (d) {
			return d.expenses;
		})]);

		graph.append('g')
			.attr('class', 'axis x-axis')
			.attr('transform', 'translate(0, ' + height + ')')
			.call(xAxis);

		graph.selectAll('.rect-bar')
			.data($scope.expensesGraphData)
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
			.data($scope.expensesGraphData)
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

	function updateExpensesGraphFn() {
		x.domain($scope.expensesGraphData.map(function (d) {
			return d.month;
		}));
		y.domain([0, d3.max($scope.expensesGraphData, function (d) {
			return d.expenses;
		})]);

		var graph = d3.select('.graph.expenses');

		d3.select('.axis.x-axis')
			.transition()
			.duration(500)
			.call(xAxis);

		var bars = graph.selectAll('.rect-bar').data($scope.expensesGraphData);
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
		var labels = graph.selectAll('.rect-bar-label').data($scope.expensesGraphData);
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