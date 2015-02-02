angular.module('commit.module', [])

.controller('CommitFileListController', ['$scope', '$state', 'GithubService', 'ContentService', 'user', 'reponame',
    function($scope, $state, GithubService, ContentService, user, reponame){

        var defaultBranch = 'master';
        var changes = ContentService.getLocalChanges(user, reponame, defaultBranch, '');

        $scope.toggleStageAll = function(){
            $scope.stageAll = !$scope.stageAll;
            _.forEach($scope.changes, function(change){
                change.staged = $scope.stageAll;
            });
        };

        $scope.reponame = reponame;
        $scope.changes = changes;
        $scope.stageAll = false;
        $scope.toggleStageAll(); // By default stage all files
    }]);
