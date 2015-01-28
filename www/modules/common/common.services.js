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

.factory("ContentService", ['$http', '$q', 'StorageService', function($http, $q, StorageService){
        /**
         * Stores, retrieves and manages file and repository contents from various services depending
         * on the provider.
         */

        /**
         *
         * Acts as a cache storing content and management info about files and repositories.
         * Structure:
         * {
         *      "user@provider": {
         *          "reponame": {
         *              // Stores information about the repository including dirty flags, files, sync status etc.
         *              "_meta": {
         *                   dirty: Boolean,
         *                   type: 'repo',
         *                   needsSync: Boolean
         *              },
         *
         *              // Stores information about each file inside the directory keyed by the file name.
         *              "filename": {
         *                  "_meta": {
         *                       dirty: Boolean,
         *                       type: 'file'
         *                  },
         *                  contents: String
         *             },
         *              "dirname": {
         *                  "_meta": {
         *                       dirty: Boolean,
         *                       type: 'dir'
         *                  },
         *
         *                  "filename": {
         *                      ...
         *                  }
         *             },
         *          }
         *      }
         * }
         */

        var contents = {};
        var factory = {};

        return factory;
    }])

.factory("StorageService", ['$http', '$q', '$window', function($http, $q, $window){

        var factory = {};

        var makeKey = function(user, repo, branch, path){
            return _.template("<%- repo %>/<%- branch %>:<%- path %>@<%- user %>", {user: user.username, repo: repo, branch: branch, path: path});
        };

        factory.set = function(user, repo, branch, path, contents){
            var key = makeKey(user, repo, branch, path);
            $window.localStorage[key] = contents;
        };

        factory.get = function(user, repo, branch, path){
            var key = makeKey(user, repo, branch, path);
            return $window.localStorage[key] || null;
        }

        factory.has = function(user, repo, branch, path){
            var key = makeKey(user, repo, branch, path);
            return _.has($window.localStorage, key);
        };

        factory.remove = function(user, repo, branch, path){
            var key = makeKey(user, repo, branch, path);
            delete $window.localStorage[key]
        }

        return factory;

    }]);