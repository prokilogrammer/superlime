angular.module('editor.module', [])

    .controller('EditorViewController', ['$scope', 'GithubService', 'user', 'reponame', 'path', function($scope, GithubService, user, reponame, path){

        $scope.repoName = reponame;
        $scope.path = path;


        var defaultBranch = 'master';
        GithubService.getFileContents(user, reponame, defaultBranch, path)
            .then(function(data){
                $scope.code = data;
            });

        var getMode = function(path){
            var modeMap = {
                '.js': 'ace/mode/javascript',
                '.py': 'ace/mode/python',
                'default': 'ace/mode/text'
            };

            var match = path.match(/\.[^.]+$/);
            if (match == null || match.length == 0 || !_.has(modeMap, match[0])){
                return modeMap['default'];
            }
            else {
                return modeMap[match[0]];
            }
        };

        $scope.editorLoaded = function(_editor){

            var mode = getMode(path);
            console.log("Setting mode to: " + mode);
            _editor.getSession().setMode(mode);
            _editor.setTheme('ace/theme/twilight');

            console.log('Editor loaded');
        };


        $scope.editorChanged = function(_editor){

            console.log('Editor changed');
        }

    }])

    .controller('EditorTestViewController', ['$scope', '$http', function($scope, $http){

        $scope.code = "import json\nobj = json.loa";

    }]);
//
//    .directive('editor', ['$rootScope', function($rootScope){
//
//        return {
//            restrict: 'E',
//            link: function($scope, element, attr){
//
//                // Initialize the editor
//                var editor = ace.edit(element);
//                editor.setTheme("ace/theme/twilight");
//                editor.getSession().setMode("ace/mode/javascript");
//            }
//        }
//
//    }])