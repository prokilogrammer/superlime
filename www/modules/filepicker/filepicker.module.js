angular.module('filepicker.module', [])

.controller('FilePickerRepoController', ['$scope', 'GithubService', 'user', 'orgname', function($scope, GithubService, user, orgname){

        GithubService.getRepos(user, orgname)
            .then(function(repos){
                $scope.repos = repos;
            })
    }])

.controller('FilePickerOrgController', ['$scope', 'GithubService', 'user', function($scope, GithubService, user){

        GithubService.getOrgs(user)
            .then(function(orgs){
                $scope.orgs = orgs;
            })
    }])