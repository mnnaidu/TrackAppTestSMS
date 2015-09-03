'use strict';
angular.module('ratingController', [])
	.controller('ratingCtrl', ['$scope', '$ionicModal', '$log', '$timeout', '$ionicPopup', 'apiServices', '$location', '$state', composeRating])
    .controller('rating1Ctrl', ['$scope', '$ionicModal','$log', '$timeout', '$ionicPopup', 'apiServices', '$location', '$state',composeRating1])
    .controller('rating2Ctrl', ['$scope', '$ionicModal', '$log', '$timeout', '$ionicPopup', 'apiServices', '$location', '$state',composeRating1])    
    .controller('appController', ['$scope', '$ionicModal', '$log', '$timeout', '$ionicPopup', 'apiServices', '$location', '$state',composeRating1]);


function composeRating($scope, $log, $timeout, $ionicPopup, apiServices,$location) {
	
    $log.log('rating ctrl called!');
    $scope.ccCards = [];
    $scope.ccCards.push( {
        accName : 'ICICI',
        accNo : 'XXXX-XXXX-XXXX-0009',
        creditLimit :  '1,17,000'
    });
    $scope.ccCards.push( {
        accName : 'ICICI',
        accNo : 'XXXX-XXXX-XXXX-1345',
        creditLimit :  '2,17,000'
    });    
    $scope.doRate = function () {
        $log.log("Going To Rate");
        $location.path("app/rating1"); // path not hash
    };
    $scope.next = function(path) {
        $log.log("Going To path",path);
        $location.path(path); // path not hash
    }
}

function composeRating1($scope, $ionicModal, $log, $timeout, $ionicPopup, apiServices,$location,$state  ) {
    
    $log.log('rating1 ctrl called!');
    
    // Load the modal from the given template URL
    $ionicModal.fromTemplateUrl('js/app/rating/welcomePopup.html', function($ionicModal) {
        $scope.modal = $ionicModal;
        $timeout($scope.showModal, 500);
    }, {
        // Use our scope for the scope of the modal to keep it simple
        scope: $scope,
        // The animation we want to use for the modal entrance
        animation: 'slide-in-up'
    });
   
    $scope.title = 'Sigma Indicator';
    
    $scope.showModal = function() {
        if($location.path() == '/app/ratingna') {
            $scope.modal.show();
        }else {
            $log.log('modal ctrl called!3',$location.path()); 
        }
    }
    
   $scope.$on('modal.removed', function() {
      $log.log('removed called');
       $state.go('app.ratingNotAvailable');
    });
    
   
    $scope.showAlertAndNext = function(title,msg,path) {
         var alertPopup = $ionicPopup.alert({
            title: title,
            template: msg
        }).then(function(res) {
            $scope.next(path);
        });
    }
    
    
    $scope.showAlert = function(title,msg) {
         var alertPopup = $ionicPopup.alert({
            title: title,
            template: msg
        }).then(function(res) {
            //$scope.next('app/ratingsummarywithendorse');
        });
    }
    
    $scope.ccCards = [];
    $scope.ccCards.push( {
        accName : 'ICICI',
        accNo : 'XXXX-XXXX-XXXX-0009',
        creditUsage :  '25,000',
        usagePercentage : '40%'
    });
    
    $scope.drCards = [];
    $scope.drCards.push( {
        accName : 'ICICI',
        accNo : 'XXXX-XXXX-XXXX-1745',
        balance :  '15,000'
    });
    $scope.drCards.push( {
        accName : 'ICICI',
        accNo : 'XXXX-XXXX-XXXX-3005',
        balance :  '20,000'
    });
    
    $scope.loans = [];
    $scope.loans.push( {
        lender : 'LICHFL HOME LOAN',
        osAmount : '4,00,000',
        tenure :  '20yrs',
        icon : 'fa-home'
    });
   $scope.loans.push( {
        lender : 'ICICI CAR LOAN',
        osAmount : '40,000',
        tenure :  '1yr',
        icon : 'fa-car'
    });
    
    
    $scope.creditOffers = [];
    
    $scope.creditOffers.push( {
        lender : 'ICICI',
        amount : '2,00,000',
        interest :  '20yrs',
        icon : 'fa-home',
        desc: 'offers you personal loan @18% tenure 3 - 6months processed in 1 day',
        descb1: 'offers you personal loan @12% tenure 3 - 6months processed in 1 day',
        desca: 'offers you personal loan @9% tenure 3 - 6months processed in 1 day',
        src : 'img/checked1.png',
        logo : 'img/icici.svg'
    });
    
   $scope.creditOffers.push( {
        lender : 'ICICI CAR LOAN',
        osAmount : '40,000',
        tenure :  '1yr',
        icon : 'fa-car',
        desc: 'offers you personal loan @20% tenure 3 - 6months processed in 2 days',
        descb1: 'offers you personal loan @15% tenure 3 - 6months processed in 2 days',
        desca: 'offers you personal loan @10% tenure 3 - 6months processed in 2 days',
        src : 'img/checked1.png',
        logo : 'img/hdfc.svg'
    });
    
    $scope.creditOffers.push( {
        lender : 'ICICI CAR LOAN',
        osAmount : '40,000',
        tenure :  '1yr',
        icon : 'fa-car',
        desc: 'get more endorse from your friends, to avail personal loan @ 22% tenure 12m - 1yr processed in 2 days',
        descb1: 'get more endorse from your friends, to avail personal loan @ 14% tenure 12m - 1yr processed in 2 days',
        desca: 'get more endorse from your friends, to avail personal loan @ 9% tenure 12m - 1yr processed in 2 days',
        src : 'img/addMore.png',
        logo : 'img/kotak.svg'
    });

    $scope.next = function(path) {
        $log.log("Going To path",path);
        
        $location.path(path); // path not hash
    }
    
    $scope.restart = function(path) {
        $log.log('restart' , path);
        $location.replace();
        $scope.next(path);
    }
    
    $scope.drawRatingGraph = function () {
        $log.log("draw graph ...");
        var w = 280,                        //width
            h = 140,                            //height
            r = 140,                            //radius
            ir = 50,
            pi = Math.PI,
            color = d3.scale.category20c(),    

            data = [{"name":"poor", "score":200}, 
                    {"name":"average", "score":800}, 
                    {"name":"good", "score":1000}];

        var vis = d3.select("#ratingGraph") 
            .data([data])          
                .attr("width", w)  
                .attr("height", h)
                .attr("transform", "translate(0,40)")
                .append("svg:g")       
                .attr("transform", "translate(" + r + "," + r + ")");

        var arc = d3.svg.arc()              
            .outerRadius(r)
            .innerRadius(ir);	

        var pie = d3.layout.pie()           
            .value(function(d) { return d.score; })
            .startAngle(90 * (pi/180))
            .endAngle(-90 * (pi/180));

        var arcs = vis.selectAll("g.slice")     
            .data(pie)                          
            .enter()                            
                .append("svg:g")                
                    .attr("class", "slice");    

            arcs.append("svg:path")
                    .attr("fill", function(d, i) { return color(i); } ) 
                    .attr("d", arc);
        
        
 
        arcs.append("svg:text")                                     
                .attr("transform", function(d) {                    
                
                d.innerRadius = 0;
                d.outerRadius = r;
                return "translate(" + arc.centroid(d) + ")";        
            })
            .attr("text-anchor", "middle")                          
            .text(function(d, i) { return data[i].name; });        
            
           d3.select("#ratingGraph").append("svg:g")
                .attr("class", "line")
                .append('line')
                .attr('x1', 140)
                .attr('y1', 140)
                .attr('x2', 80)
                .attr('y2', 80)
                .attr('stroke', '#3182BD')
                .attr('stroke-width', '2px')
                .attr('fill', 'none');
 
    };
}



