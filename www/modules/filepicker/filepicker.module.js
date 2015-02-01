angular.module('filepicker.module', [])

.controller('FilePickerRepoController', ['$scope', '$state', 'GithubService', 'ContentService', 'user', 'orgname', function($scope, $state, GithubService, ContentService, user, selectedOrg){

        var defaultBranch = 'master';
        $scope.selectedOrg = selectedOrg;

        GithubService.getRepos(user, selectedOrg)
            .then(function(repos){
                _.forEach(repos, function(repo){
                    repo.hasLocalChanges = ContentService.hasLocalChanges(user, repo.name, defaultBranch, '');
                });
                $scope.repos = repos;
            });


        GithubService.getOrgs(user)
            .then(function(orgs){
                $scope.orgs = _.pluck(orgs, 'login');
            });

    }])

.controller('FilePickerFileController', ['$scope', '$state', 'GithubService', 'ContentService', 'user', 'reponame', 'path',
        function($scope, $state, GithubService, ContentService, user, reponame, path){

            $scope.repoName = reponame;
            $scope.path = path;

            var defaultBranch = 'master';
            GithubService.getRepoContents(user, $scope.repoName, defaultBranch, $scope.path)
                .then(function(contents){

                    $scope.dirContents = [];
                    _.forEach(contents, function(item){

                        var sref = '';
                        var srefState = {reponame: reponame, path: item.path };
                        if (item.type == 'file'){
                            sref = 'user.home.editor(' + JSON.stringify(srefState) + ')';
                        }
                        else {
                            sref = 'user.home.filepicker(' + JSON.stringify(srefState) + ')';
                        }

                        $scope.dirContents.push({
                            name: item.name,
                            path: item.path,
                            sref: sref,
                            folder: (item.type == 'dir'),
                            hasLocalChanges: ContentService.hasLocalChanges(user, reponame, defaultBranch, item.path)
                        });
                    });
                })

        }])
