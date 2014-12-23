angular.module('login.module', [])


.controller('LoginCheckRedirectController', ['$state', 'user', function($state, user){

        // Navigate to appropriate state when the user is already logged-in
        if (user){
            $state.go('user.home');
        }
        else {
            $state.go('usercheck.login');
        }
    }])

.controller('LoginController', ['$scope', '$state', 'LoginService', function($scope, $state, LoginService){

        $scope.status = null;

        $scope.login = function(provider) {

            // FIXME: May be this needs to be directive. We can access ui-sref on element and let the browser navigate to destn page automatically instead of $state.go
            LoginService.login(provider)
                .then(function (user) {
                    $scope.status = null;
                    $state.go('user.home');
                },
                function (err) {
                    $scope.status = "Unable to login. Please try again. Error: " + err;
                });
        }

    }])

.factory('LoginService', ['$http', 'ConfigVars', function($http, ConfigVars){

        var user = null;

        // Initialize the OAuth library when factory is loaded
        ionic.Platform.ready(function(){
            OAuth.initialize(ConfigVars.OAuthIOKey);
        });

        var createUser = function(providerName, authedClient, deferred){

            user = {
                auth_token: authedClient
            };

            authedClient.me()
                .done(function(resp){
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

                console.log("Logging in via " + provider);

                var deferred = $q.defer();
                if (user && !force){
                    deferred.resolve(user);
                    return deferred.promise;
                }

                // Either user isn't present or force == true
                OAuth.popup(provider, {cache: true})
                    .done(function(result){
                        console.log("Login success");
                        setUser(provider, result, deferred);
                    })
                    .fail(function(err){
                        console.log("Login failure: " + err);
                        deferred.reject({error: err})
                    });

                return deferred.promise;

            },

            getUser: function(){
                return user;
            }
        }
    }]);
