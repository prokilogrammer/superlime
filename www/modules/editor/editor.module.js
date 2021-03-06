angular.module('editor.module', [])

    .controller('EditorViewController', ['$scope', '$http', 'reponame', 'path', 'user', 'AutocompleteFactory', 'GithubService', 'ContentService',
        function($scope, $http, reponame, path, user, AutocompleteFactory, GithubService, ContentService){

        $scope.editor = {};
        $scope.editor.code = "Loading..";

        $scope.repoName = reponame;
        $scope.path = path;

        var defaultBranch = 'master';
        ContentService.getContents(user, reponame, defaultBranch, path, 'file')
            .then(function(data){
                $scope.editor.code = data;
            });

        var getMode = function(path){
            var modeMap = {
                '.js': 'javascript',
                '.py': 'python',
                'default': 'text'
            };

            var match = path.match(/\.[^.]+$/);
            if (match == null || match.length == 0 || !_.has(modeMap, match[0])){
                return modeMap['default'];
            }
            else {
                return modeMap[match[0]];
            }
        };

        $scope.editor.options = {
            lineWrapping : true,
            lineNumbers: true,
            mode: getMode(path),
            readOnly: true,
            autofocus: true,
            theme: 'ambiance',
            cursorScrollMargin: 1
        };

        var getSuggestions = function(editor){
            // Get autocomplete suggestions for word at current cursor position.
            var str = editor.getRange({line: 0, ch: 0}, editor.getCursor());
            AutocompleteFactory.getSuggestions(str, function(err, suggestions){
                 if (err) return console.log(err);
                 $scope.suggest = suggestions;
            });
        }

        $scope.onCMLoaded = function(cm){

            $scope.editor.cm = cm;

            // Set the cursor to last character

            // Get suggestions when the code changes.
            cm.on('change', function(editor, change){
                getSuggestions(editor);
            });

            cm.on('cursorActivity', function(editor){
                getSuggestions(editor);
            });

//            cm.on('scrollCursorIntoView', function(editor, event){
//            });
        };

        $scope.suggest = [];

        $scope.addToCode = function(suggestion){
            // FIXME: Replace current word with autocomplete suggestion. Use cm.findPosH(currnet, 1, 'word') to find end pos of word and replace using cm.replaceRange()
            addToEditor(suggestion.complete);
        }

        $scope.keyboardHandler = function(char){
            addToEditor(char);
        }

        var addToEditor = function(char, noEditorFocus){
            var replacement = char;
            var endPos = null;
            var currentPos = $scope.editor.cm.getCursor();
            if (char == '\b'){
                replacement = '';
                // Find new position got by moving cursor one char to left
                endPos = $scope.editor.cm.findPosH(currentPos, -1, 'char');
            }

            $scope.editor.cm.replaceRange(replacement, $scope.editor.cm.getCursor(), endPos);

            ContentService.saveLocally(user, reponame, defaultBranch, path, $scope.editor.cm.getValue());

            if (!noEditorFocus) {
                // FIXME: Don't like this too much. It might cause performance/usability issues.
                _.delay(function(){
                    $scope.editor.cm.focus();
                }, 750);
            }
        }

    }])

    .directive('keyboard', ['$rootScope', '$compile', 'KeymapFactory', function($rootScope, $compile, KeymapFactory){

        var quoted = function(val, escapeQuotes){
            if (_.isNumber(val)){
                return val;
            }
            else {
                // Escape any quote characs inside and add quotes to it
                val = val.replace("'", "\\'");
                val = val.replace('"', '\\"');
                return escapeQuotes ? "\\'" + val + "\\'" : val;
            }
        }

        var draw = function($scope, element, keymap){

            // Clear the element's contents
            element.empty();

            // FIXME:  Too many $compiles look horribly inefficient.

            _.forOwn(keymap.views, function(lines, viewName){

                var viewEl = angular.element(_.template('<div class="keyboard-view" ng-class="{hidden: currentKeyboardView != \'${viewName}\' }"></div>', {viewName: quoted(viewName)}));
                _.forEach(lines, function(line){
                    var lineEl = angular.element('<div class="row"></div>');
                    _.forEach(line, function(key){
                        var moreClasses = key.moreClasses ? key.moreClasses : '';
                        var keyEl = angular.element(_.template("<div class='col btn <%- moreClasses %>' ng-click=\"clicked(\'<%- action %>\', \'<%- value %>\')\">  </div>", {action: quoted(key.action), value: quoted(key.value), disp: key.disp, moreClasses: moreClasses}));
                        if ((key.disp == null) && key.icon){
                            var iconEl = angular.element(_.template("<i class='<%- icon %>'></i>", {icon: key.icon}));
                            keyEl.append(iconEl);
                        }
                        else {
                            var fontClass = key.disp.length > 1 ? 'small' : '';
                            var txtEl = angular.element(_.template("<span class='middle <%- fontClass %>'><%- disp %></span>", {disp: key.disp, fontClass: fontClass}));
                            keyEl.append(txtEl);
                        }

                        lineEl.append(keyEl);
                    })
                    viewEl.append(lineEl);
                });

                $compile(viewEl)($scope);
                element.append(viewEl);
            });

        };

        return {
            restrict: 'E',
            scope: {
                type: '@type',
                handler: '&handler'
            },
            link: function($scope, element, attr){

                // Draw the keyboard
                var keymap = KeymapFactory.get($scope.type);
                $scope.currentKeyboardView = keymap.meta.startView;
                draw($scope, element, keymap);

                $scope.clicked = function(action, value){

                    switch(action){
                        case 'showView':
                            $scope.currentKeyboardView = value;
                            break;

                        case 'data':
                            $scope.handler({char: value});
                            break;

                        default:
                            console.log("Unrecognized action ", action, value);
                    }

                    return true;
                };
            }
        }

    }])

    .factory('AutocompleteFactory', ['$http', function($http){
        var url = "http://superlime-jedi.herokuapp.com/suggest?";

        var factory = {};

        factory.getSuggestions = function(code, cb){

            $http.get(url + querystring.stringify({code: code}))
                .success(function(data){
                    cb(null, data);
                })
                .error(function(err){
                    cb(err);
                })
        };

        return factory;

    }])

    .factory('KeymapFactory', ['$http', function($http){

        var maps = {
            'default': {
                'meta': {'startView': 'view1'},

                'views': {
                    'view1':  [

                        // Line 1
                        [
                            {disp: 'q', value: 'q', action: 'data'},
                            {disp: 'w', value: 'w', action: 'data'},
                            {disp: 'e', value: 'e', action: 'data'},
                            {disp: 'r', value: 'r', action: 'data'},
                            {disp: 't', value: 't', action: 'data'},
                            {disp: 'y', value: 'y', action: 'data'},
                            {disp: 'u', value: 'u', action: 'data'},
                            {disp: 'i', value: 'i', action: 'data'},
                            {disp: 'o', value: 'o', action: 'data'},
                            {disp: 'p', value: 'p', action: 'data'}
                        ],

                        // Line 2
                        [
                            {disp: 'a', value: 'a', action: 'data'},
                            {disp: 's', value: 's', action: 'data'},
                            {disp: 'd', value: 'd', action: 'data'},
                            {disp: 'f', value: 'f', action: 'data'},
                            {disp: 'g', value: 'g', action: 'data'},
                            {disp: 'h', value: 'h', action: 'data'},
                            {disp: 'j', value: 'j', action: 'data'},
                            {disp: 'k', value: 'k', action: 'data'},
                            {disp: 'l', value: 'l', action: 'data'}
                        ],

                        // Line 3
                        [
                            {disp: null, value: '\t', action: 'data', icon: "ionicons ion-arrow-right-c", moreClasses: "action"},
                            {disp: 'z', value: 'z', action: 'data'},
                            {disp: 'x', value: 'x', action: 'data'},
                            {disp: 'c', value: 'c', action: 'data'},
                            {disp: 'v', value: 'v', action: 'data'},
                            {disp: 'b', value: 'b', action: 'data'},
                            {disp: 'n', value: 'n', action: 'data'},
                            {disp: 'm', value: 'm', action: 'data'},
                            {disp: null, value: '\b', action: 'data', icon: "ionicons ion-backspace-outline",  moreClasses: "action"}
                        ],

                        // Line 4
                        [
                            
                            {disp: null, value: 'view2', action: 'showView', icon: "fa fa-arrow-circle-o-up", moreClasses: "action"},
                            {disp: null, value: 'view3', action: 'showView', icon: "ionicons ion-ios-infinite", moreClasses: "action"},
                            {disp: '___', value: ' ', action: 'data'},
                            {disp: null, value: 'view4', action: 'showView', icon: "fa fa-code", moreClasses: "action"},
                            {disp: null, value: '\n', action: 'data', icon: "fa fa-arrow-left", moreClasses: "action"}
                        ]
                    ],

                    'view2': [

                        // Line 1
                        [
                        {disp: 'Q', value: 'Q', action: 'data'},
                        {disp: 'W', value: 'W', action: 'data'},
                        {disp: 'E', value: 'E', action: 'data'},
                        {disp: 'R', value: 'R', action: 'data'},
                        {disp: 'T', value: 'T', action: 'data'},
                        {disp: 'Y', value: 'Y', action: 'data'},
                        {disp: 'U', value: 'U', action: 'data'},
                        {disp: 'I', value: 'I', action: 'data'},
                        {disp: 'O', value: 'O', action: 'data'},
                        {disp: 'P', value: 'P', action: 'data'}
                        ],

                        // Line 2
                        [
                            {disp: 'A', value: 'A', action: 'data'},
                            {disp: 'S', value: 'S', action: 'data'},
                            {disp: 'D', value: 'D', action: 'data'},
                            {disp: 'F', value: 'F', action: 'data'},
                            {disp: 'G', value: 'G', action: 'data'},
                            {disp: 'H', value: 'H', action: 'data'},
                            {disp: 'J', value: 'J', action: 'data'},
                            {disp: 'K', value: 'K', action: 'data'},
                            {disp: 'L', value: 'L', action: 'data'}
                        ],

                        // Line 3
                        [
                            {disp: null, value: '\t', action: 'data', icon: "ionicons ion-arrow-right-c", moreClasses: "action"},
                            {disp: 'Z', value: 'Z', action: 'data'},
                            {disp: 'X', value: 'X', action: 'data'},
                            {disp: 'C', value: 'C', action: 'data'},
                            {disp: 'V', value: 'V', action: 'data'},
                            {disp: 'B', value: 'B', action: 'data'},
                            {disp: 'N', value: 'N', action: 'data'},
                            {disp: 'M', value: 'M', action: 'data'},
                            {disp: null, value: '\b', action: 'data', icon: "ionicons ion-backspace-outline",  moreClasses: "action"}
                        ],

                        // Line 4
                        [
                            {disp: null, value: 'view1', action: 'showView', icon: "fa fa-arrow-circle-up", moreClasses: "action"},
                            {disp: null, value: 'view3', action: 'showView', icon: "ionicons ion-ios-infinite", moreClasses: "action"},
                            {disp: '___', value: ' ', action: 'data'},
                            {disp: null, value: 'view4', action: 'showView', icon: "fa fa-code", moreClasses: "action"},
                            {disp: null, value: '\n', action: 'data', icon: "fa fa-arrow-left", moreClasses: "action"}
                        ]
                    ],

                    'view3': [
                        // Line 1
                        [
                            {disp: '1', value: 1, action: 'data'},
                            {disp: '2', value: 2, action: 'data'},
                            {disp: '3', value: 3, action: 'data'},
                            {disp: '4', value: 4, action: 'data'},
                            {disp: '5', value: 5, action: 'data'},
                            {disp: '6', value: 6, action: 'data'},
                            {disp: '7', value: 7, action: 'data'},
                            {disp: '8', value: 8, action: 'data'},
                            {disp: '9', value: 9, action: 'data'},
                            {disp: '0', value: 0, action: 'data'}
                        ],

                        // Line 2
                        [
                            {disp: '(', value: '(', action: 'data'},
                            {disp: ')', value: ')', action: 'data'},
                            {disp: '[', value: '[', action: 'data'},
                            {disp: ']', value: ']', action: 'data'},
                            {disp: '"', value: '"', action: 'data'},
                            {disp: "'", value: "'", action: 'data'},
                            {disp: ':', value: ':', action: 'data'},
                            {disp: '=', value: '=', action: 'data'},
                            {disp: '.', value: '.', action: 'data'}
                        ],

                        // Line 3
                        [
                            {disp: null, value: '\t', action: 'data', icon: "ionicons ion-arrow-right-c", moreClasses: "action"},
                            {disp: '+', value: '+', action: 'data'},
                            {disp: '-', value: '-', action: 'data'},
                            {disp: '*', value: '*', action: 'data'},
                            {disp: '/', value: '/', action: 'data'},
                            {disp: '#', value: '#', action: 'data'},
                            {disp: ',', value: ',', action: 'data'},
                            {disp: '_', value: '_', action: 'data'},
                            {disp: null, value: '\b', action: 'data', icon: "ionicons ion-backspace-outline",  moreClasses: "action"}
                        ],

                        // Line 4
                        [
                            {disp: null, value: 'view1', action: 'showView', icon: "fa fa-arrow-circle-o-up", moreClasses: "action"},
                            {disp: null, value: 'view3.2', action: 'showView', icon: "ionicons ion-ios-infinite", moreClasses: "action"},
                            {disp: '___', value: ' ', action: 'data'},
                            {disp: null, value: 'view4', action: 'showView', icon: "fa fa-code", moreClasses: "action"},
                            {disp: null, value: '\n', action: 'data', icon: "fa fa-arrow-left", moreClasses: "action"}
                        ]
                    ],

                    'view3.2': [
                        // Line 1
                        [
                            {disp: '1', value: 1, action: 'data'},
                            {disp: '2', value: 2, action: 'data'},
                            {disp: '3', value: 3, action: 'data'},
                            {disp: '4', value: 4, action: 'data'},
                            {disp: '5', value: 5, action: 'data'},
                            {disp: '6', value: 6, action: 'data'},
                            {disp: '7', value: 7, action: 'data'},
                            {disp: '8', value: 8, action: 'data'},
                            {disp: '9', value: 9, action: 'data'},
                            {disp: '0', value: 0, action: 'data'}
                        ],

                        // Line 2
                        [
                            {disp: '~', value: '~', action: 'data'},
                            {disp: '`', value: '`', action: 'data'},
                            {disp: '!', value: '!', action: 'data'},
                            {disp: '@', value: '@', action: 'data'},
                            {disp: '$', value: '$', action: 'data'},
                            {disp: '%', value: '%', action: 'data'},
                            {disp: '^', value: '^', action: 'data'},
                            {disp: '{', value: '{', action: 'data'},
                            {disp: '}', value: '}', action: 'data'}
                        ],

                        // Line 3
                        [
                            {disp: null, value: '\t', action: 'data', icon: "ionicons ion-arrow-right-c", moreClasses: "action"},
                            {disp: '&', value: '&', action: 'data'},
                            {disp: '|', value: '|', action: 'data'},
//                            {disp: '\\', value: '\\', action: 'data'},
                            {disp: ';', value: ';', action: 'data'},
                            {disp: '<', value: '<', action: 'data'},
                            {disp: '>', value: '>', action: 'data'},
                            {disp: '?', value: '?', action: 'data'},
                            {disp: null, value: '\b', action: 'data', icon: "ionicons ion-backspace-outline",  moreClasses: "action"}
                        ],

                        // Line 4
                        [
                            {disp: null, value: 'view1', action: 'showView', icon: "fa fa-arrow-circle-o-up", moreClasses: "action"},
                            {disp: null, value: 'view3', action: 'showView', icon: "ionicons ion-ios-infinite", moreClasses: "action"},
                            {disp: '___', value: ' ', action: 'data'},
                            {disp: null, value: 'view4', action: 'showView', icon: "fa fa-code", moreClasses: "action"},
                            {disp: null, value: '\n', action: 'data', icon: "fa fa-arrow-left", moreClasses: "action"}
                        ]
                    ],

                    'view4': [
                        // Line 1
                        [
                            {disp: 'if', value: 'if', action: 'data'},
                            {disp: 'else', value: 'else', action: 'data'},
                            {disp: 'elif', value: 'elif', action: 'data'}
                        ],

                        // Line 2
                        [
                            {disp: 'while', value: 'while', action: 'data'},
                            {disp: 'for', value: 'for', action: 'data'},
                            {disp: 'break', value: 'break', action: 'data'}
                        ],

                        // Line 3
                        [
                            {disp: null, value: '\t', action: 'data', icon: "ionicons ion-arrow-right-c", moreClasses: "action"},
                            {disp: 'def', value: 'def', action: 'data'},
                            {disp: 'return', value: 'return', action: 'data'},
                            {disp: null, value: '\b', action: 'data', icon: "ionicons ion-backspace-outline",  moreClasses: "action"}
                        ],

                        // Line 4
                        [
                            {disp: null, value: 'view1', action: 'showView', icon: "fa fa-arrow-circle-o-up", moreClasses: "action"},
                            {disp: null, value: 'view3', action: 'showView', icon: "ionicons ion-ios-infinite", moreClasses: "action"},
                            {disp: '___', value: ' ', action: 'data'},
                            {disp: null, value: 'view4', action: 'showView', icon: "fa fa-code", moreClasses: "action"},
                            {disp: null, value: '\n', action: 'data', icon: "fa fa-arrow-left", moreClasses: "action"}
                        ]
                    ]
                }
            }
        };

        var factory = {};
        factory.get = function(type){
            if (_.has(maps, type)){
                return maps[type];
            }
            else {
                console.error("Unable to find requested keyboard ", type);
                return maps['default'];
            }
        };

        return factory;
    }]);