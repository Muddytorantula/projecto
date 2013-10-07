"use strict";

(function() {

  angular.module("projecto").controller("FilesTreeController", ["$scope", "$route", "title", "FilesService", "ProjectsService", function($scope, $route, title, FilesService, ProjectsService) {
    title("Files", $scope.currentProject);

    var files = [];
    $scope.$on("files-added", function(e, element, fs) {
      files = [];
      for (var i=0; i<fs.length; i++) {
        files.push(fs[i]);
      }
    });


    $scope.currentProject = null;

    $("body").statusmsg("open", "Loading...");

    $scope.newDirectory = function() {
      var name = $.trim(prompt("Enter folder name"));
      if (name) {
        $("body").statusmsg("open", "Creating directory...");
        var req = FilesService.newDirectory($scope.currentProject, $route.current.params.path || "/", name);
        req.success(function(data, status, headers, config) {
          $("body").statusmsg("close");
          $scope.update();
        });

        req.error(function(data, status, headers, config) {
          if (status === 404) {
            $("body").statusmsg("open", "You cannot create a directory inside a directory that does not exist!", {type: "error", closable: true});
          }
        });
      }
    };

    var resetFileUploads = function() {
      files = [];
      document.getElementById("files-file-upload").value = "";
    };

    $scope.newFile = function() {
      if (files.length === 0) {
        $("body").statusmsg("open", "You need to select a file!", {type: "warning", autoclose: 1500});
      } else {
        var req = FilesService.newFile($scope.currentProject, $route.current.params.path || "/", files[0]);
        req.success(function(data, status, headers, config) {
          $("body").statusmsg("open", "File added!", {type: "success", autoclose: 1500});
          $scope.update();
          $("#files-new-file-modal").foundation("reveal", "close");
          resetFileUploads();
        });

        req.error(function(data, status, headers, config) {
          var message = "";
          if (data && data.error) {
            message = data.error;
          } else {
            message = status;
          }
          $("body").statusmsg("open", "Error adding file: " + message, {autoclose: false, type: "alert"});
          console.log("Error adding files", data, status);
          resetFileUploads();
        });
      }
    };

    $scope.update = function() {
      if ($scope.currentProject) {
        $scope.notFound = false;
        title("Files", $scope.currentProject);
        var path = $route.current.params.path;

        // This is for parsing for the breadcrumbs.
        $scope.currentDirectoryList = [{path: "/", name: "Root", last: true}];
        if (!path) {
          path = "/";
        } else {
          // stripping / from beginning and end of the path ..
          $scope.currentDirectoryList[0].last = false;
          var tmp = FilesService.trimSlashes(path).split("/");
          var currentPath;
          for (var i=0; i<tmp.length; i++) {
            currentPath = tmp.slice(0, i+1);
            currentPath = "/" + currentPath.join("/") + "/";
            $scope.currentDirectoryList.push({
              path: currentPath,
              name: tmp[i],
              last: i == tmp.length - 1
            });
          }
        }
        var req = FilesService.get($scope.currentProject, path);
        req.success(function(data, status, headers, config) {
          $("body").statusmsg("close");
          $scope.files = data.children;
          var directories = [];
          var files = [];
          for (var i=0; i<$scope.files.length; i++) {
            var f = $scope.files[i];
            var path = f.path;
            f.is_directory = path.charAt(path.length - 1) === "/";
            var tmp = FilesService.trimSlashes(path).split("/");
            f.name = tmp[tmp.length-1];

            if (f.is_directory)
              directories.push(f);
            else
              files.push(f);
          }
          // TODO: this could be made more efficient by using insert that kept order... but oh well.
          var filenameComparer = function(a, b) {
            if (a.name.toLowerCase() > b.name.toLowerCase()) {
              return 1;
            } else if (a.name.toLowerCase() < b.name.toLowerCase()) {
              return -1;
            } else {
              console.log("WAT. Something horrible just happened.. Why are two filenames the same!", a, b);
              return 0;
            }
          };
          directories.sort(function(a, b) {  })
          directories.push.apply(directories, files);
          $scope.files = directories;
        });
        req.error(function(data, status, headers, config) {
          if (status === 404) {
            $("body").statusmsg("open", "This directory is not found!", {type: "error", closable: true});
            $scope.notFound = true;
          } else {
            $("body").statusmsg("open", "List directory failed (" + status + ")!", {type: "error", closable: true});
          }
        });
      }
    };

    ProjectsService.getCurrentProject().done(function(currentProject){
      $scope.currentProject = currentProject;
      $scope.update();

      $scope.$$phase || $scope.$apply();
    });
  }]);

})();