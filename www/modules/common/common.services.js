angular.module('common.module', [])

.factory('GithubService', ['$http', '$q', function($http, $q){

        var init = function(user){
            if (user){

                return new Github({
                    token: user.access_token,
                    auth: "OAuth"
                })
            }
            else {
                return null;
            }
        };

        return {

            getRepos: function(user, orgname){

                var github = init(user);
                var ghUser = github.getUser();

                var deferred = $q.defer();
                ghUser.repos(function(err, repos){

                    if (err) return deferred.reject({err: err});

                    // TODO: Filter by orgname
                    deferred.resolve(repos);
                });

                return deferred.promise;
            },

            getOrgs: function(user){
                var github = init(user);
                var ghUser = github.getUser();

                var deferred = $q.defer();
                ghUser.orgs(function(err, orgs){

                    if (err) return deferred.reject({err: err});

                    deferred.resolve(orgs);
                });

                return deferred.promise;

            },

            getRepoContents: function(user, reponame, branch, path){
                var github = init(user);
                var repo = github.getRepo(user.username, reponame);

                var deferred = $q.defer();
                repo.contents(branch, path, function(err, contents){

                    if (err) return deferred.reject({err: err});

                    deferred.resolve(contents);
                });

                return deferred.promise;
            }
        }

    }]);