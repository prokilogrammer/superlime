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
            path = path ? path : '';
            return _.template("<%- repo %>/<%- branch %>@<%- user %>_<%- provider %>:<%- path %>", {user: user.username, provider: user.provider, repo: repo, branch: branch, path: path});
        };

        var originalKey = function(key){
            return "original_" + key;
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
                GithubService.getFileContents(user, repo, branch, path)
                    .then(function(contents){
                        // Store original
                        saveLocally(user, repo, branch, path, contents, true);
                        deferred.resolve(contents);
                    })
                    .catch(function(err){
                        deferred.reject(err);
                    });
                return deferred.promise;
            }
            else if (type == 'dir'){
                return GithubService.getRepoContents(user, repo, branch, path);
            }
            else {
                deferred.reject({err: "Invalid path type"})
                return deferred.promise;
            }
        };

        factory.getOriginalContent = function(user, repo, branch, path){
            var key = originalKey(fileKey(user, repo, branch, path));
            return $window.localStorage[key];
        };

        var saveLocally = function(user, repo, branch, path, contents, original){
            var key = fileKey(user, repo, branch, path);
            if (original){
                key = originalKey(key);
            }

            $window.localStorage[key] = contents;
        };

        factory.saveLocally = function(user, repo, branch, path, contents){
            saveLocally(user, repo, branch, path, contents, false);
        };

        factory.getLocalChanges = function(user, repo, branch, path){
            // Returns list of modified files as file paths relative to the given path

            var queryKey = fileKey(user, repo, branch, path);

            var localChanges = [];
            var fileKeys = _.keys($window.localStorage);
            _.forEach(fileKeys, function(key){
                var re = new RegExp("\\b" + queryKey);
                if (re.test(key)){
                    // Replace key substring to get path relative to given path.
                    localChanges.push({
                        path: key.replace(re, ''),
                        content: $window.localStorage[key],
                        original: $window.localStorage[originalKey(key)]
                    })
                }
            });

            return localChanges;
        };

        factory.hasLocalChanges = function(user, repo, branch, path){
            return this.getLocalChanges(user, repo, branch, path).length > 0;
        };

        return factory;
    }]);