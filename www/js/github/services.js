angular.module('github.services', [])

.factory('LoginService', ['$http', function($http){

        var serverUrl = "http://localhost:3000";
        var OAuthIoPublicKey = "c3YzgYib6SdcN21TzMKw2sAOwow";
        OAuth.initialize(OAuthIoPublicKey);

        return {

            auth: function(){

                OAuth.popup('github', {
                    cache: true
                })
                    .done(function(result){
                        console.log(result);
                        console.log("Access token: ", result.access_token);
                    })
                    .fail(function(err){
                        console.log("ERROR!! ", err);
                    })
            }

        };

    }]);
