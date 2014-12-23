angular.module('login.module', [])


.controller('LoginCheckRedirectController', ['$state', 'user', function($state, user){

        // Navigate to appropriate state when the user is already logged-in
        if (user){
            $state.go('user.home.repopicker');
        }
        else {
            $state.go('user.login');
        }
    }])

.controller('LoginController', ['$scope', '$state', 'LoginService', function($scope, $state, LoginService){

        $scope.status = null;

        $scope.login = function(provider) {

            $scope.status = "starting login";

            // FIXME: Try to get rid of $state.go here. It is hacky
            LoginService.login(provider)
                .then(function (user) {
                    $scope.status = null;
                    $state.go('user.home.repopicker');
                },
                function (err) {
                    $scope.status = "Unable to login. Please try again. Error: " + JSON.stringify(err, null, 2);
                });
        }

    }])

.factory('LoginService', ['$http', '$q', '$ionicPlatform', 'ConfigVars', function($http, $q, $ionicPlatform, ConfigVars){

        var user = null;

        // Initialize the OAuth library when factory is loaded
        // FIXME: For some reason, the callback doesn't get called. Until then initialization will be hardcoded in index.html
//        $ionicPlatform.ready(function(){
            OAuth.initialize(ConfigVars.OAuthIOKey);
//        });

        var createUser = function(providerName, authedClient, deferred){

            user = {
                access_token: authedClient.access_token
            };

            console.log(authedClient.access_token);

            authedClient.me()
                .done(function(resp){
                    user['username'] = resp.raw.login;
                    _.merge(user, resp);
                    deferred.resolve(user);
                })
                .fail(function(err){
                    console.log("Unable to fetch user object. Error: " + err);
                    deferred.resolve(user);
                    // TODO: Try to make direct API call to get user obj.
                });
        };

        return {
            login: function(provider, force){

                var deferred = $q.defer();
                if (user && !force){
                    deferred.resolve(user);
                    return deferred.promise;
                }

                // Either user isn't present or force == true
                OAuth.popup(provider, {cache: true})
                    .done(function(result){
                        console.log("Login success");
                        createUser(provider, result, deferred);
                    })
                    .fail(function(err){
                        console.log("Login failure: " + err);
                        deferred.reject({error: err})
                    });

                return deferred.promise;

            },

            getUser: function(){
                console.log(user);
                return user;
            }
        }
    }]);
