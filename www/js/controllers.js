angular.module('main.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {
  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
})

.controller('PlaylistsCtrl', function($scope) {
  $scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
})

.controller('PlaylistCtrl', function($scope, $stateParams) {
})

.controller('EditorCtrl', ['$scope', '$http', function($scope, $http){

        $scope.code = '';
        $scope.input = '';
        $scope.suggest = '';

        var url = "http://superlime-jedi.herokuapp.com/suggest?";

        $scope.getSuggestions = function(){
            var context = $scope.code + "\n" + $scope.input;
            $http.get(url + querystring.stringify({code: context}))
                .success(function(res){
                    $scope.suggest = res;
                });
        };

        $scope.addToInput = function(suggestion){
            $scope.input += suggestion.complete;
            $scope.getSuggestions();
        };

        $scope.addToCode = function(){

            $scope.code += '\n' + $scope.input;
            $scope.input = '';
            $scope.suggest = '';
            document.getElementById('codeInput').focus();
        };
    }]
);
