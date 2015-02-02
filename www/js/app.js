// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('superlime', [
    'ionic',
    'ui.codemirror',
    'common.module',
    'login.module',
    'config.module',
    'filepicker.module',
    'editor.module',
    'commit.module'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider, $sceDelegateProvider) {


    // Never show native keyboard
    window.addEventListener('native.keyboardshow', function(e){
        cordova.plugins.Keyboard.close();
    });

    $sceDelegateProvider.resourceUrlWhitelist(['self', 'https://oauth.io/**', 'https://api.github.com/**', 'https://www.github.com/**']);


    // States are organized as per the organization explained here -  http://www.frederiknakstad.com/2014/02/09/ui-router-in-angular-client-side-auth/
    $stateProvider
        .state('user', {
            url: "/",
            abstract: true,
            template: "<ion-nav-view></ion-nav-view>",
            controller: 'LoginCheckRedirectController',
            resolve: {
                user: ['LoginService', function(LoginService){
                    return LoginService.getUser();
                }]
            }
        })

        .state('user.login', {
            url: "",
            templateUrl: "modules/login/login.view.html",
            controller: 'LoginController'
        })

        .state('user.home', {
            abstract: true,
            url: "/user",
            templateUrl: "modules/filepicker/filepicker.view.html",
            resolve: {
                // If user had to login fresh, user object inherited from parent scope will be null. Refresh it.
                user: ['LoginService', function(LoginService){
                    return LoginService.getUser();
                }]
            }
        })

        .state('user.home.repopicker', {
              url: "/repopicker/:orgname",
              templateUrl: "modules/filepicker/filepicker.repoview.html",
              controller: "FilePickerRepoController",
              resolve: {
                  orgname: ['$stateParams', function($stateParams){
                    return $stateParams.orgname ? $stateParams.orgname : '';
                  }]
              }
        })

        .state('user.home.filepicker', {
              url: "/filepicker/:reponame/{path:.*}",
              templateUrl: "modules/filepicker/filepicker.fileview.html",
              controller: "FilePickerFileController",
              resolve: {
                  path: ['$stateParams', function($stateParams){
                    return $stateParams.path ? $stateParams.path : '';
                  }],

                  reponame: ['$stateParams', function($stateParams){
                    return $stateParams.reponame ? $stateParams.reponame : '';
                  }]
              }
        })


        .state('user.home.editor', {
              url: "/editor/:reponame/{path:.*}",
              templateUrl: "modules/editor/editor.view.html",
              controller: "EditorViewController",
              resolve: {
                  path: ['$stateParams', function($stateParams){
                    return $stateParams.path ? $stateParams.path : '';
                  }],

                  reponame: ['$stateParams', function($stateParams){
                    return $stateParams.reponame ? $stateParams.reponame : '';
                  }]
              }
        })


        .state('user.commit', {
              abstract: true,
              url: "/commit",
              templateUrl: "modules/commit/commit.view.html",
              resolve: {
                // If user had to login fresh, user object inherited from parent scope will be null. Refresh it.
                user: ['LoginService', function(LoginService){
                    return LoginService.getUser();
                }]
              }
        })


        .state('user.commit.filelist', {
              url: "/commit/:reponame",
              templateUrl: "modules/commit/commit.filelist.html",
              controller: "CommitFileListController",
              resolve: {
                  reponame: ['$stateParams', function($stateParams){
                    return $stateParams.reponame ? $stateParams.reponame : '';
                  }]
              }
        });

//        .state('editortest', {
//              url: "/editortest",
//              templateUrl: "modules/editor/editor.view.html",
//              controller: "EditorTestViewController"
//        })

//    .state('app.search', {
//      url: "/search",
//      views: {
//        'menuContent' :{
//          templateUrl: "templates/search.html"
//        }
//      }
//    })
//
//    .state('app.browse', {
//      url: "/browse",
//      views: {
//        'menuContent' :{
//          templateUrl: "templates/browse.html"
//        }
//      }
//    })
//    .state('app.playlists', {
//      url: "/playlists",
//      views: {
//        'menuContent' :{
//          templateUrl: "templates/playlists.html",
//          controller: 'PlaylistsCtrl'
//        }
//      }
//    })
//
//    .state('app.single', {
//      url: "/playlists/:playlistId",
//      views: {
//        'menuContent' :{
//          templateUrl: "templates/playlist.html",
//          controller: 'PlaylistCtrl'
//        }
//      }
//    })
//
//    .state('app.editor', {
//        url: '/editor',
//        views: {
//            'menuContent': {
//                templateUrl: "templates/editor.html",
//                controller: 'EditorCtrl'
//            }
//        }
//    });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/');
});

