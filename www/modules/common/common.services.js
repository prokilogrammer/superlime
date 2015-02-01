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
            },

            getFileContents: function(user, reponame, branch, path){
                var github = init(user);
                var repo = github.getRepo(user.username, reponame);

                var deferred = $q.defer();
                repo.read(branch, path, function(err, contents){

                    if (err) return deferred.reject({err: err});

                    deferred.resolve(contents);
                });

                return deferred.promise;
            }
        }

    }])

.factory("ContentService", ['$http', '$q', '$window', 'GithubService', function($http, $q, $window, GithubService){

        /**
         * Stores, retrieves and manages file and repository contents from various services depending
         * on the provider.
         */

        var factory = {};

        var fileKey = function(user, repo, branch, path){
            return _.template("<%- repo %>/<%- branch %>@<%- user %>_<%- provider %>:<%- path %>", {user: user.username, provider: user.provider, repo: repo, branch: branch, path: path});
        };

        factory.getContents = function(user, repo, branch, path, type){
            // If file contents exists in local storage, return it. Otherwise fetch from Github

            var deferred = $q.defer();
            var key = fileKey(user, repo, branch, path);
            var contents = $window.localStorage[key] || null;
            if (contents != null){
                deferred.resolve(contents);
                return deferred.promise;
            }

            if (type == 'file'){
                return GithubService.getFileContents(user, repo, branch, path);
            }
            else if (type == 'dir'){
                return GithubService.getRepoContents(user, repo, branch, path);
            }
            else {
                deferred.reject({err: "Invalid path type"})
                return deferred.promise;
            }
        };

        factory.saveLocally = function(user, repo, branch, path, contents){
            var key = fileKey(user, repo, branch, path);
            $window.localStorage[key] = contents;
        };

        factory.hasLocalChanges = function(user, repo, branch, path){

            var queryKey = fileKey(user, repo, branch, path);
            console.log(queryKey);

            var fileKeys = _.keys($window.localStorage);
            return _.any(fileKeys, function(key){
                return key.indexOf(queryKey) > -1;
            })
        };

        return factory;
    }]);